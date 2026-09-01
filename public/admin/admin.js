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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
}

function bookingStatus(status) {
  const normalized = String(status || 'pending').toLowerCase();
  return ['pending', 'confirmed', 'completed', 'cancelled'].includes(normalized) ? normalized : 'pending';
}

function bookingCard(booking, includeReview = false) {
  const status = bookingStatus(booking.status);
  const reference = escapeHtml(booking.booking_ref || 'Pending request');
  const machine = escapeHtml(booking.equipment_name || 'Equipment to be confirmed');
  const customer = escapeHtml(booking.customer_name || booking.customer_phone || 'Customer');
  const location = escapeHtml(booking.village || booking.district || 'Maharashtra');
  const date = escapeHtml(booking.start_date || booking.created_at?.slice(0, 10) || 'ASAP');
  const duration = Number(booking.duration_days || booking.duration_hours || 1);
  const amount = Number(booking.total_amount || 0).toLocaleString('en-IN');
  return `<article class="booking-card" data-booking-status="${status}">
    <div class="booking-card__top"><span class="booking-card__ref">${reference}</span><span class="status-chip status-chip--${status}">${escapeHtml(status)}</span></div>
    <div class="booking-card__machine">${machine}</div>
    <div class="booking-card__customer">${customer} · ${location}</div>
    <div class="booking-card__meta"><span>${date}</span><span>${duration} ${booking.duration_hours ? 'hr' : 'day'}${duration === 1 ? '' : 's'}</span></div>
    <div class="booking-card__footer"><span class="booking-card__amount">₹${amount}</span>${includeReview ? '<button class="gm-btn gm-btn-outline" type="button" onclick="switchTab(\'bookings\')">Review</button>' : ''}</div>
  </article>`;
}

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
      errorEl.textContent = data.message || 'Unable to sign in';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = 'Server connection failed. Please try again.';
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
  const cards = document.getElementById('recentBookingCards');
  const recent = (dashboardData.bookings || []).slice(0, 5);

  if (!recent.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 16px;">No bookings recorded yet.</td></tr>';
    if (cards) cards.innerHTML = '<p class="admin-empty-state">No recent bookings yet.</p>';
    return;
  }

  if (cards) cards.innerHTML = recent.map(booking => bookingCard(booking, true)).join('');

  tbody.innerHTML = recent.map(b => `
    <tr>
      <td><strong>${escapeHtml(b.booking_ref)}</strong></td>
      <td>${escapeHtml(b.customer_phone || b.customer_name || 'Customer')}</td>
      <td>${escapeHtml(b.equipment_name || 'Equipment')}</td>
      <td>${escapeHtml(b.district || 'Maharashtra')}</td>
      <td>${escapeHtml(b.start_date || 'ASAP')} (${escapeHtml(b.duration_days || 1)}d)</td>
      <td><strong>₹${(b.total_amount || 0).toLocaleString('en-IN')}</strong></td>
      <td><span class="status-chip status-chip--${bookingStatus(b.status)}">${escapeHtml(bookingStatus(b.status))}</span></td>
    </tr>
  `).join('');
}

function renderBookings() {
  const tbody = document.getElementById('bookingsTableBody');
  const cards = document.getElementById('allBookingCards');
  const list = dashboardData.bookings || [];

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No bookings found.</td></tr>';
    if (cards) cards.innerHTML = '<p class="admin-empty-state">No booking requests found.</p>';
    return;
  }

  if (cards) cards.innerHTML = list.map(booking => bookingCard(booking)).join('');

  tbody.innerHTML = list.map(b => `
    <tr>
      <td>
        <span style="font-family: var(--gm-font-mono); font-weight: 700; color: #0F172A; font-size: 13px;">${escapeHtml(b.booking_ref)}</span>
      </td>
      <td>
        <div style="font-size: 12px; font-weight: 600;">${escapeHtml(b.customer_name || '—')}</div>
        <div style="font-size: 11px; color: var(--gm-gray-500);">${escapeHtml(b.customer_phone || '')}</div>
      </td>
      <td style="max-width: 180px; font-size: 12px;">${escapeHtml(b.equipment_name || 'Equipment')}</td>
      <td style="font-size: 12px;">${escapeHtml(b.village || b.district || 'Maharashtra')}</td>
      <td style="font-size: 12px;">${escapeHtml(b.start_date || b.created_at?.slice(0,10) || 'ASAP')}</td>
      <td style="font-size: 12px;">${b.duration_days || b.duration_hours || 1} ${b.duration_hours ? 'hr(s)' : 'day(s)'}</td>
      <td><strong style="font-family: var(--gm-font-mono);">₹${(b.total_amount || 0).toLocaleString('en-IN')}</strong></td>
      <td><span class="status-chip status-chip--${bookingStatus(b.status)}">${escapeHtml(bookingStatus(b.status))}</span></td>
      <td>
        ${bookingStatus(b.status) !== 'confirmed' && bookingStatus(b.status) !== 'completed' ? `
          <button class="btn btn-primary" style="padding: 5px 10px; font-size: 11px; white-space: nowrap;" onclick="updateStatus('${escapeHtml(b.id || b.booking_ref)}', 'confirmed')">✓ Confirm</button>
        ` : `<span style="font-size: 12px; color: #16A34A; font-weight: 600;">✅ Confirmed</span>`}
      </td>
      <td>
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <a href="/api/bookings/${encodeURIComponent(b.booking_ref || '')}/invoice" target="_blank"
             style="padding: 5px 10px; font-size: 11px; background: #1D4ED8; color: white; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;">
            📄 View PDF
          </a>
          <button style="padding: 5px 10px; font-size: 11px; background: #15803D; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; white-space: nowrap;"
            onclick="sendInvoiceWhatsApp('${escapeHtml(b.booking_ref)}', '${escapeHtml(b.customer_phone)}')">
            📲 Send via WA
          </button>
        </div>
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
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminAuthToken}` },
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
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.view-panel').forEach(p => p.style.display = 'none');

  const titles = {
    overview: ['Marketplace Overview', 'Real-time demand, fleet availability, and owner subscription metrics'],
    bookings: ['Bookings Operations', 'Inspect and manage customer machinery rental requests'],
    equipment: ['Equipment Fleet Directory', '16 canonical machinery types listed across Maharashtra'],
    owners: ['Machinery Owners & Subscriptions', '₹599/month subscription status and listings health'],
    revenue: ['Revenue & Platform Financials', 'Subscription MRR and equipment rental volume'],
    broadcast: ['WhatsApp Seasonal Broadcast Center', 'Targeted agricultural announcements and seasonal demand alerts'],
    heatmap: ['Taluka Demand Heatmap & Fleet Deficit', 'Live demand density and machinery shortage alerts across Jath Taluka'],
    sos: ['Machinery Breakdown SOS Control Room', 'Live on-field breakdown monitor, replacement fleet dispatch, and emergency resolution'],
    fleet: ['Fleet Dispatch', 'Assign the nearest available machine and keep the farmer informed']
  };

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
  } else if (tabId === 'sos') {
    loadSosData();
  } else if (tabId === 'fleet') {
    loadFleetPending();
    loadFleetAssignLog();
  }
  document.getElementById('adminSidebar')?.classList.remove('is-open');
  document.querySelector('.admin-mobile-menu')?.setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleAdminMenu() {
  const sidebar = document.getElementById('adminSidebar');
  const menu = document.querySelector('.admin-mobile-menu');
  const open = sidebar?.classList.toggle('is-open');
  menu?.setAttribute('aria-expanded', String(Boolean(open)));
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
  document.querySelectorAll('#allBookingCards .booking-card').forEach(card => {
    const matchesQ = card.textContent.toLowerCase().includes(q);
    const matchesStatus = status === 'all' || card.dataset.bookingStatus === status;
    card.style.display = (matchesQ && matchesStatus) ? '' : 'none';
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

// ==========================================================================
// Machinery Breakdown SOS & Emergency Control Room Management
// ==========================================================================
let sosIncidentsList = [];

async function loadSosData() {
  try {
    const res = await fetch('/api/emergency/incidents', {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });
    if (!res.ok) throw new Error('Failed to load SOS incidents');
    const data = await res.json();
    sosIncidentsList = data.incidents || [];
    renderSosIncidents();
  } catch (err) {
    console.error('Error loading SOS incidents:', err);
  }
}

function renderSosIncidents() {
  const activeCount = sosIncidentsList.filter(i => (i.status || '').toUpperCase() === 'ACTIVE').length;
  const resolvedCount = sosIncidentsList.filter(i => (i.status || '').toUpperCase() === 'RESOLVED').length;

  if (document.getElementById('sosActiveCount')) {
    document.getElementById('sosActiveCount').textContent = `${activeCount} Incidents`;
  }
  if (document.getElementById('sosResolvedCount')) {
    document.getElementById('sosResolvedCount').textContent = `${resolvedCount} Saved`;
  }

  const tbody = document.getElementById('sosTableBody');
  if (!tbody) return;

  if (sosIncidentsList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--gm-gray-500);">कोणत्याही बिघाडाच्या नोंदी नाहीत (No active breakdown incidents).</td></tr>';
    return;
  }

  tbody.innerHTML = sosIncidentsList.map(inc => {
    const isResolved = (inc.status || '').toUpperCase() === 'RESOLVED';
    const statusBadge = isResolved
      ? '<span class="gm-badge gm-badge-success">✅ RESOLVED (मार्ग निघाला)</span>'
      : '<span class="gm-badge gm-badge-danger" style="background: #FEE2E2; color: #DC2626; font-weight: 700;">🚨 ACTIVE DISPATCH (मदत मार्गावर)</span>';

    return `
      <tr>
        <td>
          <span style="font-family: var(--gm-font-mono); font-weight: 700; color: #991B1B; font-size: 13px;">${inc.id}</span>
          <div style="font-size: 11px; color: var(--gm-gray-500);">${inc.booking_ref ? 'Ref: ' + inc.booking_ref : 'Direct SOS'}</div>
        </td>
        <td>
          <div style="font-weight: 700; color: #0F172A;">${inc.farmer_name || 'शेतकरी'}</div>
          <div style="font-size: 12px; color: #15803D; font-weight: 600;">📍 गाव: ${inc.village || 'शेगाव'}</div>
          <div style="font-size: 11px; color: var(--gm-gray-500);">${inc.farmer_phone || '—'}</div>
        </td>
        <td style="max-width: 180px;">
          <div style="font-size: 12px; font-weight: 700; color: #DC2626;">⚠️ ${inc.broken_machine || 'ट्रॅक्टर बिघाड'}</div>
          <div style="font-size: 11px; color: var(--gm-gray-600);">${inc.original_owner || 'स्थानिक ऑपरेटर'}</div>
        </td>
        <td style="max-width: 220px;">
          <div style="font-size: 12px; font-weight: 700; color: #16A34A;">🚜 ${inc.replacement_machine || 'पर्यायी ट्रॅक्टर'}</div>
          <div style="font-size: 11px; color: var(--gm-gray-600);">${inc.replacement_owner || 'स्थानिक मालक'}</div>
        </td>
        <td>
          <div><strong style="font-family: var(--gm-font-mono); font-size: 13px;">${inc.distance_km || 3.8} km</strong></div>
          <div style="font-size: 11px; color: #1D4ED8; font-weight: 700;">⏱️ ${inc.eta_mins || 15} मिनिटे ETA</div>
        </td>
        <td>${statusBadge}</td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${!isResolved ? `
              <button onclick="resolveSosIncident('${inc.id}')" class="gm-btn gm-btn-primary" style="padding: 5px 10px; font-size: 11px; background: #16A34A; border: none; white-space: nowrap;">
                ✅ Resolve (पूर्ण झाले)
              </button>
            ` : `
              <span style="font-size: 12px; color: #16A34A; font-weight: 600;">निवारण झाले</span>
            `}
            <a href="https://wa.me/${(inc.farmer_phone || '').replace(/\D/g, '')}?text=${encodeURIComponent('GoMate SOS Update: आपल्या ' + (inc.village || 'शेतात') + ' पर्यायी ट्रॅक्टर ' + (inc.replacement_machine || '') + ' रवाना झाले आहे.')}" target="_blank" class="gm-btn gm-btn-outline" style="padding: 4px 8px; font-size: 11px; text-decoration: none; text-align: center; white-space: nowrap;">
              📲 शेतकरी WhatsApp
            </a>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function resolveSosIncident(incidentId) {
  if (!confirm(`SOS घटना ${incidentId} निवारण झाली म्हणून मार्क करायची आहे का?`)) return;

  try {
    const res = await fetch(`/api/emergency/incidents/${incidentId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAuthToken}`
      }
    });
    const data = await res.json();
    if (data.success) {
      alert(`✅ घटना ${incidentId} यशस्वीरीत्या सोडवली गेली.`);
      loadSosData();
    } else {
      alert('त्रुटी: घटना अपडेट करता आली नाही.');
    }
  } catch (err) {
    alert('सर्व्हर त्रुटी: ' + err.message);
  }
}

function openManualSosModal() {
  document.getElementById('manualSosModal').style.display = 'flex';
}

function closeManualSosModal() {
  document.getElementById('manualSosModal').style.display = 'none';
}

async function handleManualSosSubmit(e) {
  e.preventDefault();
  const phone = document.getElementById('sosFarmerPhone').value.trim();
  const village = document.getElementById('sosVillageSelect').value;
  const ref = document.getElementById('sosBookingRef').value.trim();
  const text = document.getElementById('sosBreakdownText').value.trim();

  try {
    const res = await fetch('/api/emergency/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminAuthToken}` },
      body: JSON.stringify({
        senderPhone: phone,
        bookingRef: ref,
        rawText: `${village}: ${text}`
      })
    });
    const data = await res.json();
    if (data.success) {
      alert(`🚨 आपत्कालीन रिलीफ ट्रॅक्टर यशस्वीरीत्या मॅच झाला!\n\nतिकीट क्र: ${data.incident.id}\nपर्यायी उपकरण: ${data.incident.replacement_machine}\nअंतर: ${data.incident.distance_km} किमी (ETA: ${data.incident.eta_mins} मिनिटे)`);
      closeManualSosModal();
      loadSosData();
    } else {
      alert('त्रुटी: SOS नोंदवता आला नाही.');
    }
  } catch (err) {
    alert('सर्व्हर त्रुटी: ' + err.message);
  }
}

// ==========================================================================
// Fleet Route Optimizer & Dispatch — Client Logic
// ==========================================================================
let fleetCurrentBooking = null;
let fleetSelectedMachine = null;
let fleetDispatchedCount = 0;

async function loadFleetPending() {
  try {
    const res = await fetch('/api/admin/fleet/pending', {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });
    const data = await res.json();
    const bookings = data.bookings || [];

    // Update KPI
    const el = document.getElementById('fleetPendingCount');
    if (el) el.textContent = bookings.length;

    const tbody = document.getElementById('fleetPendingTableBody');
    if (!tbody) return;

    if (bookings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#94A3B8;">All bookings are assigned. Fleet fully dispatched!</td></tr>';
      return;
    }

    tbody.innerHTML = bookings.map(b => `
      <tr>
        <td><strong>${b.ref}</strong></td>
        <td>${b.equipment_type}</td>
        <td>📍 ${b.location}</td>
        <td>${b.start_date} (${b.duration_days}d)</td>
        <td><span class="badge badge-${b.status}">${b.status}</span></td>
        <td id="nearest-${b.ref}" style="font-size:11px; color:#64748B;">—</td>
        <td>
          <button onclick="openFleetAssignModal('${b.ref}', '${b.equipment_type}', '${b.location}', '${b.customer_phone}')"
            class="gm-btn gm-btn-primary"
            style="padding:4px 10px; font-size:11px; font-weight:700;">
            🗺️ Find & Assign
          </button>
        </td>
      </tr>
    `).join('');

    // Background: pre-fetch nearest for each booking and fill cell
    bookings.forEach(async b => {
      try {
        const nr = await fetch(`/api/admin/fleet/nearest?location=${encodeURIComponent(b.location)}&equipment_type=${encodeURIComponent(b.equipment_type)}`, { headers: { 'Authorization': `Bearer ${adminAuthToken}` } });
        const nd = await nr.json();
        const nearest = nd.nearest_machine;
        const cell = document.getElementById(`nearest-${b.ref}`);
        if (cell && nearest) {
          cell.innerHTML = `<strong>${nearest.model}</strong><br>${nearest.distance_km} km · ${nearest.eta_minutes} min`;
          cell.style.color = '#0F172A';
        }
      } catch {}
    });

    // Update avg ETA KPI
    updateFleetAvgEta(bookings);
  } catch (err) {
    console.error('Fleet pending load error:', err);
  }
}

async function updateFleetAvgEta(bookings) {
  try {
    if (!bookings.length) return;
    const first = bookings[0];
    const res = await fetch(`/api/admin/fleet/nearest?location=${encodeURIComponent(first.location)}&equipment_type=${encodeURIComponent(first.equipment_type)}`, { headers: { 'Authorization': `Bearer ${adminAuthToken}` } });
    const data = await res.json();
    const nearest = data.nearest_machine;
    const etaEl = document.getElementById('fleetAvgEta');
    if (etaEl && nearest) etaEl.textContent = `${nearest.eta_minutes} min`;
  } catch {}
}

async function openFleetAssignModal(bookingRef, equipmentType, location, farmerPhone) {
  fleetCurrentBooking = { ref: bookingRef, equipment_type: equipmentType, location, farmer_phone: farmerPhone };
  fleetSelectedMachine = null;

  const modal = document.getElementById('fleetAssignModal');
  modal.style.display = 'flex';
  document.getElementById('fleetDispatchBtn').disabled = true;
  document.getElementById('fleetWaPreview').style.display = 'none';
  document.getElementById('fleetDriverName').value = '';
  document.getElementById('fleetDriverPhone').value = '';

  // Fill booking summary
  document.getElementById('fleetModalBookingSummary').innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      <div><span style="font-size:11px; color:#64748B; font-weight:700;">BOOKING REF</span><br><strong>${bookingRef}</strong></div>
      <div><span style="font-size:11px; color:#64748B; font-weight:700;">EQUIPMENT NEEDED</span><br><strong>${equipmentType}</strong></div>
      <div><span style="font-size:11px; color:#64748B; font-weight:700;">FARM LOCATION</span><br><strong>📍 ${location}</strong></div>
      <div><span style="font-size:11px; color:#64748B; font-weight:700;">FARMER PHONE</span><br><strong>${farmerPhone}</strong></div>
    </div>
  `;

  // Load nearest machines
  document.getElementById('fleetNearestMachines').innerHTML =
    '<div style="text-align:center; padding:16px; color:#94A3B8;">⏳ Calculating nearest machines via route engine...</div>';

  try {
    const res = await fetch(`/api/admin/fleet/nearest?location=${encodeURIComponent(location)}&equipment_type=${encodeURIComponent(equipmentType)}`, { headers: { 'Authorization': `Bearer ${adminAuthToken}` } });
    const data = await res.json();
    const machines = data.machines || [];

    if (machines.length === 0) {
      document.getElementById('fleetNearestMachines').innerHTML =
        '<div style="text-align:center; padding:16px; color:#EF4444;">No idle machines found near this location.</div>';
      return;
    }

    document.getElementById('fleetNearestMachines').innerHTML = machines.map((m, i) => `
      <div id="machine-card-${m.id}"
        onclick="selectFleetMachine(${JSON.stringify(m).replace(/"/g, '&quot;')})"
        style="border:2px solid ${i===0 ? '#2563EB' : '#E2E8F0'}; border-radius:8px; padding:12px; cursor:pointer; background:${i===0 ? '#EFF6FF' : '#F8FAFC'}; transition:all 0.15s;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
          <div>
            <strong style="font-size:13.5px; color:#0F172A;">${m.model}</strong>
            ${i===0 ? '<span style="background:#2563EB; color:#fff; font-size:10px; font-weight:700; padding:1px 6px; border-radius:10px; margin-left:6px;">NEAREST</span>' : ''}
          </div>
          <strong style="font-size:13px; color:#15803D;">₹${m.price_per_day.toLocaleString('en-IN')}/day</strong>
        </div>
        <div style="font-size:12px; color:#475569;">
          👤 ${m.owner_name} &nbsp;|&nbsp; 📍 Hub: ${m.hub}
        </div>
        <div style="font-size:12px; margin-top:6px; display:flex; gap:16px;">
          <span style="color:#2563EB; font-weight:700;">📏 ${m.distance_km} km</span>
          <span style="color:#D97706; font-weight:700;">⏱️ ${m.eta_minutes} min ETA</span>
        </div>
      </div>
    `).join('');

    // Auto-select nearest
    selectFleetMachine(machines[0]);
  } catch (err) {
    document.getElementById('fleetNearestMachines').innerHTML =
      `<div style="color:#EF4444;">Error loading machines: ${err.message}</div>`;
  }
}

function selectFleetMachine(machine) {
  fleetSelectedMachine = machine;

  // Reset all card borders
  document.querySelectorAll('[id^="machine-card-"]').forEach(el => {
    el.style.border = '2px solid #E2E8F0';
    el.style.background = '#F8FAFC';
  });

  // Highlight selected
  const card = document.getElementById(`machine-card-${machine.id}`);
  if (card) {
    card.style.border = '2px solid #16A34A';
    card.style.background = '#F0FDF4';
  }

  // Pre-fill driver name
  document.getElementById('fleetDriverName').value = machine.owner_name || '';
  document.getElementById('fleetDriverPhone').value = '+919822012345';

  // Show WhatsApp preview
  const farmerMsg = `नमस्कार! बुकिंग *${fleetCurrentBooking.ref}* साठी यंत्र निश्चित झाले:\n\nयंत्र: ${machine.model}\nचालक: ${machine.owner_name}\nअंतर: ${machine.distance_km} किमी | वेळ: ${machine.eta_minutes} मिनिटे\n\nGoMate Support: 1800-123-4567`;
  const preview = document.getElementById('fleetWaPreview');
  preview.textContent = farmerMsg;
  preview.style.display = 'block';

  document.getElementById('fleetDispatchBtn').disabled = false;
}

async function confirmFleetAssignment() {
  if (!fleetCurrentBooking || !fleetSelectedMachine) return;

  const driverName = document.getElementById('fleetDriverName').value || fleetSelectedMachine.owner_name;
  const driverPhone = document.getElementById('fleetDriverPhone').value || '+919822012345';

  document.getElementById('fleetDispatchBtn').disabled = true;
  document.getElementById('fleetDispatchBtn').textContent = 'Dispatching...';

  try {
    const res = await fetch('/api/admin/fleet/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminAuthToken}` },
      body: JSON.stringify({
        booking_ref: fleetCurrentBooking.ref,
        machine_id: fleetSelectedMachine.id,
        machine_model: fleetSelectedMachine.model,
        driver_name: driverName,
        driver_phone: driverPhone,
        farmer_phone: fleetCurrentBooking.farmer_phone,
        farmer_village: fleetCurrentBooking.location,
        eta_minutes: fleetSelectedMachine.eta_minutes,
        distance_km: fleetSelectedMachine.distance_km,
        equipment_type: fleetCurrentBooking.equipment_type,
      })
    });
    const data = await res.json();

    if (data.success) {
      fleetDispatchedCount++;
      const dispatchedEl = document.getElementById('fleetDispatchedToday');
      if (dispatchedEl) dispatchedEl.textContent = fleetDispatchedCount;

      closeFleetModal();
      alert(`✅ यंत्र यशस्वीरित्या डिस्पॅच झाले!\n\nबुकिंग: ${data.booking_ref}\nयंत्र: ${data.machine_model}\nचालक: ${data.driver_name}\nETA: ${data.eta_minutes} मिनिटे\n\nWhatsApp notifications sent to farmer & owner.`);
      loadFleetPending();
      loadFleetAssignLog();
    } else {
      alert('Dispatch failed: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Network error: ' + err.message);
  } finally {
    document.getElementById('fleetDispatchBtn').disabled = false;
    document.getElementById('fleetDispatchBtn').textContent = '🚜 Dispatch Machine & Send WhatsApp';
  }
}

async function loadFleetAssignLog() {
  try {
    const res = await fetch('/api/admin/fleet/log', {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });
    const data = await res.json();
    const log = data.log || [];
    const tbody = document.getElementById('fleetAssignLogBody');
    if (!tbody) return;

    if (log.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#94A3B8;">No assignments yet. Assign a booking above.</td></tr>';
      return;
    }

    tbody.innerHTML = log.slice().reverse().map(a => `
      <tr>
        <td><strong>${a.booking_ref}</strong></td>
        <td>${a.machine_model}</td>
        <td>${a.driver_name}</td>
        <td>📍 ${a.farmer_village}</td>
        <td>${a.distance_km} km</td>
        <td><span style="color:#D97706; font-weight:700;">${a.eta_minutes} min</span></td>
        <td style="font-size:11px; color:#64748B;">${new Date(a.assigned_at).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'})}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Fleet log error:', err);
  }
}

function closeFleetModal() {
  document.getElementById('fleetAssignModal').style.display = 'none';
  fleetSelectedMachine = null;
}
