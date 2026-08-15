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
      <td>
        ${b.status !== 'confirmed' ? `
          <button class="btn btn-primary" style="padding: 4px 8px; font-size: 11px;" onclick="updateStatus('${b.id || b.booking_ref}', 'confirmed')">Confirm</button>
        ` : `<span style="font-size: 12px; color: var(--gm-green-600);">✅ Done</span>`}
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
    revenue: ['Revenue & Platform Financials', 'Subscription MRR and equipment rental volume']
  };

  const currentBtn = Array.from(document.querySelectorAll('.nav-item')).find(b => b.textContent.toLowerCase().includes(tabId));
  if (currentBtn) currentBtn.classList.add('active');

  const panel = document.getElementById(`tab-${tabId}`);
  if (panel) panel.style.display = 'block';

  if (titles[tabId]) {
    document.getElementById('viewTitle').textContent = titles[tabId][0];
    document.getElementById('viewSubtitle').textContent = titles[tabId][1];
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
