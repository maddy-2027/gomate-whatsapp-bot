// ==========================================================================
// GoMate Admin Operations Dashboard — Client Logic
// ==========================================================================

let adminAuthToken = sessionStorage.getItem('gm_admin_token') || '';
let dashboardData = {
  stats: {},
  bookings: [],
  equipment: [],
  owners: []
};

// Check existing login on load
window.addEventListener('DOMContentLoaded', () => {
  if (adminAuthToken) {
    unlockDashboard();
  }
});

async function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById('adminPass').value;
  const errorEl = document.getElementById('authError');
  errorEl.style.display = 'none';

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();

    if (data.success && data.token) {
      adminAuthToken = data.token;
      sessionStorage.setItem('gm_admin_token', adminAuthToken);
      unlockDashboard();
    } else {
      errorEl.textContent = data.message || 'Invalid password';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = 'Server connection failed';
    errorEl.style.display = 'block';
  }
}

function unlockDashboard() {
  document.getElementById('authOverlay').style.display = 'none';
  document.getElementById('appLayout').style.display = 'flex';
  fetchDashboardData();
}

function handleLogout() {
  adminAuthToken = '';
  sessionStorage.removeItem('gm_admin_token');
  document.getElementById('appLayout').style.display = 'none';
  document.getElementById('authOverlay').style.display = 'flex';
  document.getElementById('adminPass').value = '';
}

// Data Fetching
async function fetchDashboardData() {
  try {
    const headers = { 'Authorization': `Bearer ${adminAuthToken}` };

    const [statsRes, bookingsRes, equipRes, ownersRes] = await Promise.all([
      fetch('/api/admin/stats', { headers }),
      fetch('/api/admin/bookings', { headers }),
      fetch('/api/admin/equipment', { headers }),
      fetch('/api/admin/owners', { headers })
    ]);

    if (statsRes.status === 401) {
      handleLogout();
      return;
    }

    dashboardData.stats = await statsRes.json();
    dashboardData.bookings = await bookingsRes.json();
    dashboardData.equipment = await equipRes.json();
    dashboardData.owners = await ownersRes.json();

    renderOverview();
    renderBookings();
    renderEquipment();
    renderOwners();
    renderRevenue();
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
  }
}

// Rendering
function renderOverview() {
  const stats = dashboardData.stats || {};
  document.getElementById('kpiTotalBookings').textContent = stats.bookings?.totalBookings || 0;
  document.getElementById('kpiConfirmedBookings').textContent = stats.bookings?.confirmed || 0;
  document.getElementById('kpiTotalEquipment').textContent = stats.equipment?.total || 0;
  document.getElementById('kpiActiveOwners').textContent = stats.owners?.activeSubs || 0;
  document.getElementById('kpiMRR').textContent = `₹${(stats.owners?.monthlyRevenue || 0).toLocaleString('en-IN')}`;

  // Render recent 5 bookings in overview table
  const tbody = document.querySelector('#recentBookingsTable tbody');
  const recent = (dashboardData.bookings || []).slice(0, 5);

  if (!recent.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 16px;">No bookings recorded yet.</td></tr>';
    return;
  }

  tbody.innerHTML = recent.map(b => `
    <tr>
      <td><strong>${b.booking_ref}</strong></td>
      <td>${b.customer_phone || b.customer_name || 'Customer'}</td>
      <td>${b.equipment_name || 'Equipment'}</td>
      <td>${b.district || 'Maharashtra'}</td>
      <td>${b.start_date || 'ASAP'} (${b.duration_days || 1}d)</td>
      <td><strong>₹${(b.total_amount || 0).toLocaleString('en-IN')}</strong></td>
      <td><span class="badge badge-${(b.status || 'pending').toLowerCase()}">${b.status || 'pending'}</span></td>
    </tr>
  `).join('');
}

function renderBookings() {
  const tbody = document.getElementById('bookingsTableBody');
  const list = dashboardData.bookings || [];

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No bookings found.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(b => `
    <tr>
      <td><strong>${b.booking_ref}</strong></td>
      <td>${b.customer_phone}</td>
      <td>${b.equipment_name || 'Equipment'}</td>
      <td>${b.district || 'Maharashtra'}</td>
      <td>${b.start_date || 'N/A'}</td>
      <td>${b.duration_days} day(s)</td>
      <td><strong>₹${(b.total_amount || 0).toLocaleString('en-IN')}</strong></td>
      <td><span class="badge badge-${(b.status || 'pending').toLowerCase()}">${b.status || 'pending'}</span></td>
      <td style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
        ${b.status !== 'confirmed' ? `
          <button class="btn btn-primary" style="padding: 4px 8px; font-size: 11px;" onclick="updateStatus('${b.id || b.booking_ref}', 'confirmed')">Confirm</button>
        ` : `<span style="font-size: 12px; color: var(--gm-green-600);">✅ Done</span>`}
        <a href="/api/bookings/${b.booking_ref}/invoice" target="_blank"
           style="padding: 4px 8px; font-size: 11px; background: #1D4ED8; color: white; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 3px;">
          📄 PDF
        </a>
        <button class="btn" style="padding: 4px 8px; font-size: 11px; background: #16A34A; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;"
          onclick="sendInvoiceWhatsApp('${b.booking_ref}', '${b.customer_phone}')">
          📲 WhatsApp
        </button>
      </td>
    </tr>
  `).join('');
}

async function updateStatus(id, status) {
  try {
    await fetch(`/api/admin/bookings/${id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAuthToken}`
      },
      body: JSON.stringify({ status })
    });
    fetchDashboardData();
  } catch (err) {
    console.error('Failed to update booking status:', err);
  }
}

async function sendInvoiceWhatsApp(bookingRef, customerPhone) {
  try {
    const res = await fetch(`/api/bookings/${bookingRef}/send-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_phone: customerPhone })
    });
    const data = await res.json();
    if (data.success) {
      alert(`✅ Invoice WhatsApp message sent!\n\nRef: ${bookingRef}\nTo: ${customerPhone}\n\nPDF URL:\n${data.invoice_url}`);
    }
  } catch (err) {
    console.error('Send invoice error:', err);
  }
}

function renderEquipment() {
  const grid = document.getElementById('equipmentGrid');
  const list = dashboardData.equipment || [];

  if (!list.length) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No equipment listed yet.</p>';
    return;
  }

  grid.innerHTML = list.map(e => `
    <div class="equip-card">
      <div class="equip-card-header">
        <div>
          <div class="equip-title">${e.model}</div>
          <div class="equip-district">📍 ${e.district || 'Maharashtra'}</div>
        </div>
        <span class="equip-type-tag">${e.category} • ${e.type}</span>
      </div>
      <div style="font-size: 12px; color: var(--gm-slate-600); line-height: 1.4;">
        ${e.description || 'Verified machinery listed for daily hire.'}
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; border-top: 1px solid var(--gm-slate-100); padding-top: 10px;">
        <div class="equip-price">₹${(e.price_per_day || 0).toLocaleString('en-IN')}<span style="font-size: 11px; font-weight: normal; color: var(--gm-slate-500);">/day</span></div>
        <span class="badge badge-active">${e.available !== false ? 'Available' : 'Booked'}</span>
      </div>
    </div>
  `).join('');
}

function renderOwners() {
  const tbody = document.getElementById('ownersTableBody');
  const list = dashboardData.owners || [];

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No owners registered yet.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(o => `
    <tr>
      <td><strong>${o.name}</strong></td>
      <td>${o.phone}</td>
      <td>${o.district || 'Maharashtra'}</td>
      <td><span style="font-weight: 600; color: var(--gm-slate-800);">Owner Pro (₹599/mo)</span></td>
      <td><span class="badge badge-${(o.subscription_status || 'active').toLowerCase()}">${o.subscription_status || 'active'}</span></td>
      <td>${o.subscription_expires_at ? new Date(o.subscription_expires_at).toLocaleDateString() : '30 Days'}</td>
      <td>
        <a href="https://wa.me/${(o.phone || '').replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px;">
          💬 WhatsApp
        </a>
      </td>
    </tr>
  `).join('');
}

function renderRevenue() {
  const stats = dashboardData.stats || {};
  const mrr = stats.owners?.monthlyRevenue || 0;
  const gmv = stats.bookings?.totalVolume || 0;

  document.getElementById('revenueMRR').textContent = `₹${mrr.toLocaleString('en-IN')}`;
  document.getElementById('revenueGMV').textContent = `₹${gmv.toLocaleString('en-IN')}`;
}

// Tab Switching
function switchTab(tabId) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.view-panel').forEach(p => p.style.display = 'none');

  const titles = {
    overview: ['Marketplace Overview', 'Real-time demand, fleet availability, and owner subscription metrics'],
    bookings: ['Bookings Operations', 'Inspect and manage customer machinery rental requests'],
    equipment: ['Equipment Fleet Directory', '16 canonical machinery types listed across Maharashtra'],
    owners: ['Machinery Owners & Subscriptions', '₹599/month subscription status and listings health'],
    revenue: ['Revenue & Platform Financials', 'Subscription MRR and equipment rental volume'],
    broadcast: ['WhatsApp Seasonal Broadcast Center', 'Targeted agricultural announcements and seasonal demand alerts'],
    heatmap: ['Taluka Demand Heatmap & Fleet Deficit', 'Live demand density and machinery shortage alerts across Jath Taluka']
  };

  const currentBtn = Array.from(document.querySelectorAll('.nav-item')).find(b => b.textContent.toLowerCase().includes(tabId));
  if (currentBtn) currentBtn.classList.add('active');

  const panel = document.getElementById(`tab-${tabId}`);
  if (panel) panel.style.display = 'block';

  if (titles[tabId]) {
    document.getElementById('viewTitle').textContent = titles[tabId][0];
    document.getElementById('viewSubtitle').textContent = titles[tabId][1];
  }

  if (tabId === 'broadcast') {
    loadBroadcastData();
  } else if (tabId === 'heatmap') {
    loadHeatmapData();
  }
}

// Filters
function filterBookings() {
  const q = document.getElementById('bookingSearch').value.toLowerCase();
  const status = document.getElementById('bookingStatusFilter').value;
  const rows = document.querySelectorAll('#bookingsTableBody tr');

  rows.forEach(r => {
    const text = r.textContent.toLowerCase();
    const matchesQ = text.includes(q);
    const matchesStatus = status === 'all' || text.includes(status);
    r.style.display = (matchesQ && matchesStatus) ? '' : 'none';
  });
}

function filterEquipment() {
  const q = document.getElementById('equipSearch').value.toLowerCase();
  const cat = document.getElementById('equipCategoryFilter').value;
  const cards = document.querySelectorAll('.equip-card');

  cards.forEach(c => {
    const text = c.textContent.toLowerCase();
    const matchesQ = text.includes(q);
    const matchesCat = cat === 'all' || text.includes(cat);
    c.style.display = (matchesQ && matchesCat) ? '' : 'none';
  });
}

function filterOwners() {
  const q = document.getElementById('ownerSearch').value.toLowerCase();
  const rows = document.querySelectorAll('#ownersTableBody tr');

  rows.forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

// ==========================================================================
// WhatsApp Seasonal Broadcast Management
// ==========================================================================
let broadcastTemplates = [];
let broadcastHistory = [];

async function loadBroadcastData() {
  try {
    const res = await fetch('/api/admin/broadcast/templates', {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });
    const data = await res.json();
    broadcastTemplates = data.templates || [];
    broadcastHistory = data.history || [];

    // Populate Template Select
    const select = document.getElementById('bcTemplate');
    if (select) {
      select.innerHTML = broadcastTemplates.map((t, i) => 
        `<option value="${t.id}" ${i === 0 ? 'selected' : ''}>${t.title}</option>`
      ).join('');
    }

    if (broadcastTemplates.length > 0) {
      document.getElementById('bcMessageText').value = broadcastTemplates[0].messageMr;
      updatePreviewBubble();
    }

    renderBroadcastHistory();
  } catch (err) {
    console.error('Failed to load broadcast templates:', err);
  }
}

function onTemplateChange() {
  const selectedId = document.getElementById('bcTemplate').value;
  applyQuickTemplate(selectedId);
}

function applyQuickTemplate(templateId) {
  const tmpl = broadcastTemplates.find(t => t.id === templateId);
  if (tmpl) {
    const select = document.getElementById('bcTemplate');
    if (select) select.value = templateId;
    document.getElementById('bcMessageText').value = tmpl.messageMr;
    if (tmpl.target) {
      document.getElementById('bcTarget').value = tmpl.target;
    }
    updatePreviewBubble();
    updateBroadcastPreview();
  }
}

function updatePreviewBubble() {
  const text = document.getElementById('bcMessageText').value || '';
  const bubble = document.getElementById('bcPreviewBubble');
  const charCount = document.getElementById('charCount');
  
  if (charCount) {
    charCount.textContent = `${text.length} chars`;
  }

  if (bubble) {
    let formatted = text
      .replace(/\*([^\*]+)\*/g, '<strong>$1</strong>')
      .replace(/_([^_]+)_/g, '<em>$1</em>');
    bubble.innerHTML = formatted;
  }
}

function updateBroadcastPreview() {
  // Update audience estimation counter
  const target = document.getElementById('bcTarget').value;
  const countEl = document.getElementById('broadcastAudienceCount');
  if (countEl) {
    if (target === 'farmers') countEl.textContent = '42';
    else if (target === 'owners') countEl.textContent = '7';
    else countEl.textContent = '49';
  }
}

async function sendBroadcast() {
  const targetAudience = document.getElementById('bcTarget').value;
  const taluka = document.getElementById('bcTaluka').value;
  const templateId = document.getElementById('bcTemplate').value;
  const customMessage = document.getElementById('bcMessageText').value.trim();

  if (!customMessage) {
    alert('Please enter a message to broadcast.');
    return;
  }

  const confirmMsg = `Are you sure you want to broadcast this WhatsApp message to ${targetAudience.toUpperCase()} in ${taluka.toUpperCase()}?`;
  if (!confirm(confirmMsg)) return;

  const btn = document.getElementById('bcSendBtn');
  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span> <span>Dispatched to WhatsApp Queue...</span>';

  try {
    const res = await fetch('/api/admin/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAuthToken}`
      },
      body: JSON.stringify({ targetAudience, taluka, templateId, customMessage })
    });

    const data = await res.json();
    if (data.success) {
      alert(`✅ Broadcast successful!\nDelivered to ${data.delivered} WhatsApp recipients.`);
      const totalSentEl = document.getElementById('broadcastTotalSent');
      if (totalSentEl) {
        totalSentEl.textContent = Number(totalSentEl.textContent || 1) + 1;
      }
      loadBroadcastData();
    } else {
      alert(`⚠️ Broadcast notice: ${data.error || 'Failed to dispatch'}`);
    }
  } catch (err) {
    alert('Network error while dispatching broadcast.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>🚀</span> <span>Broadcast on WhatsApp (प्रसारित करा)</span>';
  }
}

function renderBroadcastHistory() {
  const tbody = document.getElementById('bcHistoryTableBody');
  if (!tbody) return;

  if (!broadcastHistory.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 16px;">No broadcast campaigns recorded yet.</td></tr>';
    return;
  }

  tbody.innerHTML = broadcastHistory.map(b => `
    <tr>
      <td><code>${b.id}</code></td>
      <td><strong>${b.title}</strong></td>
      <td><span class="gm-badge gm-badge-neutral">${b.target.toUpperCase()}</span></td>
      <td>${b.recipientsCount} Users</td>
      <td><span style="color: #16A34A; font-weight: 700;">✓ ${b.deliveredCount}</span></td>
      <td><span class="gm-badge gm-badge-success">${b.status}</span></td>
      <td>${new Date(b.sentAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
    </tr>
  `).join('');
}

// ==========================================================================
// Taluka Demand Heatmap & Fleet Deficit Management
// ==========================================================================
let heatmapData = {
  clusters: [],
  deficitAlerts: []
};

async function loadHeatmapData() {
  try {
    const res = await fetch('/api/admin/heatmap', {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });
    if (!res.ok) throw new Error('Failed to load heatmap');
    const data = await res.json();
    heatmapData = data;
    renderHeatmap();
  } catch (err) {
    console.error('Error loading heatmap metrics:', err);
  }
}

function renderHeatmap() {
  const clusters = heatmapData.clusters || [];
  const alerts = heatmapData.deficitAlerts || [];

  if (document.getElementById('heatTotalDemand')) {
    document.getElementById('heatTotalDemand').textContent = heatmapData.totalDemand || 149;
  }
  if (document.getElementById('heatTotalFleet')) {
    document.getElementById('heatTotalFleet').textContent = heatmapData.totalListings || 93;
  }
  if (document.getElementById('heatDeficitCount')) {
    const deficits = clusters.filter(c => c.status === 'CRITICAL_DEFICIT').length;
    document.getElementById('heatDeficitCount').textContent = `${deficits} Clusters`;
  }

  // Render Alert Banner Text
  const alertTextEl = document.getElementById('heatmapAlertText');
  if (alertTextEl && alerts.length > 0) {
    alertTextEl.innerHTML = alerts.map(a => a.alertMr.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')).join('<br>');
  }

  // Render Cluster Table
  const tbody = document.getElementById('heatmapTableBody');
  if (!tbody) return;

  tbody.innerHTML = clusters.map(c => {
    let statusBadge = '<span class="gm-badge gm-badge-success">BALANCED (संतुलित)</span>';
    if (c.status === 'CRITICAL_DEFICIT') {
      statusBadge = '<span class="gm-badge gm-badge-danger" style="background: #FEE2E2; color: #DC2626; font-weight: 700;">🔴 DEFICIT (तुटवडा)</span>';
    } else if (c.status === 'SURPLUS') {
      statusBadge = '<span class="gm-badge gm-badge-info">🟢 SURPLUS (अतिरिक्त)</span>';
    }

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: #0F172A;">${c.nameMr}</div>
          <div style="font-size: 11px; color: var(--gm-gray-500);">${c.name}</div>
        </td>
        <td>${c.coverageVillages} गावे</td>
        <td><strong style="font-family: var(--gm-font-mono); font-size: 14px;">${c.demandCount}</strong> मागण्या</td>
        <td><strong style="font-family: var(--gm-font-mono); font-size: 14px;">${c.activeListings}</strong> युनिट्स</td>
        <td>${statusBadge}</td>
        <td><span style="font-weight: 600; color: #D97706;">🚜 ${c.topNeededEquipment}</span></td>
        <td>
          ${c.status === 'CRITICAL_DEFICIT' ? `
            <button onclick="switchTab('broadcast')" class="gm-btn gm-btn-primary" style="padding: 4px 8px; font-size: 11px;">
              📢 अलर्ट पाठवा
            </button>
          ` : `
            <span style="font-size: 12px; color: var(--gm-gray-500);">ऑप्टिमम</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}
