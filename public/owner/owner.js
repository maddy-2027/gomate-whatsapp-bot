/**
 * GoMate Owner Pro Portal Client JS
 * Dynamic data binding, listing creation, availability toggles, and subscription flow
 */

let currentOwnerPhone = '+919822012345';
let jathVillages = [];
let ownerState = {
  owner: {},
  equipment: [],
  bookings: [],
  kpis: {}
};

// Canonical 16 equipment types mapping for the Add Machine modal
const CANONICAL_EQUIPMENT = {
  agriculture: [
    'Tractors (45–55 HP 4WD)',
    'Cultivators (9-Tyne)',
    'Tipping Trailers (4-Tonne)',
    'Seed Drills',
    'Combine Harvesters',
    'Tractor Sprayers (HTP 500L)',
    'Rotavators (6-ft)',
    'Agri Spraying Drones (10L)'
  ],
  transport: [
    'Delivery Mini Trucks (Tata Ace)',
    'Pickup Trucks (Dost Plus)',
    'Medium Trucks (Tata 407 4-Tonne)',
    'Tanker Trucks (12KL Water)',
    'Dump Trucks & Tippers'
  ],
  infrastructure: [
    'Backhoe Loaders (JCB 3DX)',
    'Backhoe Loaders (JCB 4DX)',
    'Heavy Excavators (21-Tonne Poklen)',
    'Crawler Bulldozers (CAT D6)'
  ]
};

// Initial Load
window.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('phone')) {
    currentOwnerPhone = urlParams.get('phone');
  }
  await loadRegisteredOwnersList();
  await loadJathVillages();
  fetchOwnerPortalData();
});

async function loadRegisteredOwnersList() {
  try {
    const res = await fetch('/api/admin/owners');
    if (!res.ok) return;
    const owners = await res.json();
    const select = document.getElementById('ownerSelectDropdown');
    if (select && owners && owners.length > 0) {
      select.innerHTML = owners.map(o => `
        <option value="${o.phone}" ${o.phone === currentOwnerPhone ? 'selected' : ''}>
          ${o.name} (${o.village || o.district || 'Jath'})
        </option>
      `).join('');
    }
  } catch (err) {
    console.warn('Could not load owner list:', err);
  }
}

async function loadJathVillages() {
  try {
    const res = await fetch('/api/jath/villages');
    if (!res.ok) return;
    const data = await res.json();
    jathVillages = data.villages || [];
    const villageSelect = document.getElementById('newMachineVillage');
    if (villageSelect && jathVillages.length > 0) {
      villageSelect.innerHTML = jathVillages.map(v => `
        <option value="${v.name}">${v.nameMr} (${v.name}) — जत</option>
      `).join('');
    }
  } catch (err) {
    console.warn('Could not load villages:', err);
  }
}

function switchOwnerTab(tabId) {
  document.querySelectorAll('.owner-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.owner-panel').forEach(p => p.style.display = 'none');

  const currentBtn = Array.from(document.querySelectorAll('.owner-tab-btn')).find(b => b.getAttribute('data-tab') === tabId);
  if (currentBtn) currentBtn.classList.add('active');

  const panel = document.getElementById(`tab-${tabId}`);
  if (panel) panel.style.display = 'block';

  if (tabId === 'expenses') {
    fetchOwnerExpenses();
  } else if (tabId === 'calendar') {
    fetchOwnerCalendar();
  }
}

function handleOwnerChange(phone) {
  currentOwnerPhone = phone;
  const url = new URL(window.location);
  url.searchParams.set('phone', phone);
  window.history.replaceState({}, '', url);
  fetchOwnerPortalData();
}

async function fetchOwnerPortalData() {
  try {
    const res = await fetch(`/api/owner/data?phone=${encodeURIComponent(currentOwnerPhone)}`);
    if (!res.ok) throw new Error('Failed to load owner data');
    const data = await res.json();
    ownerState = data;
    renderOwnerPortal();
  } catch (err) {
    console.error('Error fetching owner data:', err);
    showToast('Failed to load live data. Using cached profile.', 'error');
  }
}

function renderOwnerPortal() {
  const { owner, equipment, bookings, kpis } = ownerState;

  // Header & Identity
  const nameDisplay = document.getElementById('ownerNameDisplay');
  if (nameDisplay) nameDisplay.textContent = `${owner.name} (${owner.district})`;

  // KPIs
  document.getElementById('kpiEarnings').textContent = `₹${(kpis.totalEarnings || 0).toLocaleString('en-IN')}`;
  document.getElementById('kpiActiveMachinery').textContent = `${kpis.activeListings || equipment.length} Units`;
  document.getElementById('kpiBookingsCount').textContent = `${bookings.length} Bookings`;
  document.getElementById('kpiSubStatus').textContent = `${owner.subscription_status === 'active' ? 'Owner Pro Active' : 'Trial (7 Days)'}`;

  // Listings Tab
  renderListings(equipment);

  // Bookings Tab & Dashboard Table
  renderBookings(bookings);

  // Profile Tab
  if (document.getElementById('profileName')) document.getElementById('profileName').value = owner.name || '';
  if (document.getElementById('profilePhone')) document.getElementById('profilePhone').value = owner.phone || '';
  if (document.getElementById('profileDistrict')) document.getElementById('profileDistrict').value = `${owner.district || 'Pune'}, Maharashtra`;
  if (document.getElementById('profileSubBadge')) document.getElementById('profileSubBadge').textContent = `Verified Partner #${owner.id || 'GM-0472'}`;
}

function renderListings(equipmentList) {
  const grid = document.getElementById('ownerListingsGrid');
  const countBadge = document.getElementById('listingsCountTitle');
  if (countBadge) countBadge.textContent = `My Equipment Listings (${equipmentList.length})`;

  if (!equipmentList || equipmentList.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; background: var(--gm-white); border-radius: var(--gm-radius-lg); border: 1px solid var(--gm-gray-200);">
        <h3 style="font-size: 18px; margin-bottom: 4px; font-weight: 700;">No machinery listed yet</h3>
        <p style="color: var(--gm-gray-600); font-size: 14px; margin-top: 4px; margin-bottom: 16px;">Add your tractors, trucks, or JCBs to start receiving customer bookings on WhatsApp.</p>
        <button class="gm-btn gm-btn-primary" onclick="openAddMachineModal()" style="font-weight: 700;">
          Add Machinery Listing
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = equipmentList.map(item => {
    let img = '/assets/equipment/agri_tractor_3d.jpg';
    let badgeClass = 'gm-badge-agri';
    let catLabel = 'Agriculture';

    if (item.category === 'transport') {
      img = '/assets/equipment/heavy_drone_3d.jpg';
      badgeClass = 'gm-badge-info';
      catLabel = 'Goods Transport';
    } else if (item.category === 'infrastructure') {
      img = '/assets/equipment/infra_jcb_3d.jpg';
      badgeClass = 'gm-badge-warning';
      catLabel = 'Earthmoving & JCB';
    }

    const isAvailable = item.available !== false;

    return `
      <div class="owner-equip-card" id="equip-card-${item.id}">
        <img src="${img}" alt="${item.name || item.model}" class="owner-equip-img">
        <div class="owner-equip-body">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <div>
              <span class="gm-badge ${badgeClass}">${catLabel}</span>
              <h3 style="font-size: 16px; margin-top: 6px; font-weight: 700;">${item.name || item.model}</h3>
            </div>
            <label class="toggle-switch" title="Toggle active machinery availability">
              <input type="checkbox" ${isAvailable ? 'checked' : ''} onchange="toggleMachineAvailability('${item.id}', this.checked)">
              <span class="slider"></span>
            </label>
          </div>

          <p style="font-size: 13px; color: var(--gm-gray-600); margin: 6px 0;">
            ${item.equipment_type || item.model} • ${item.district || 'Jath'}
          </p>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--gm-gray-200); padding-top: 12px; margin-top: auto;">
            <div>
              <span style="font-size: 11px; color: var(--gm-gray-500);">Hire Rate:</span>
              <div style="font-size: 17px; font-weight: 700; color: var(--gm-brand-navy); font-family: var(--gm-font-mono);">₹${Number(item.daily_rate || 1500).toLocaleString('en-IN')}<span style="font-size: 11px; font-weight: normal; color: var(--gm-gray-500); font-family: var(--gm-font-body);">/day</span></div>
            </div>
            <span class="gm-badge ${isAvailable ? 'gm-badge-confirmed' : 'gm-badge-cancelled'}" id="status-badge-${item.id}">
              ${isAvailable ? 'Available' : 'Paused'}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderBookings(bookingsList) {
  // Recent table on dashboard
  const recentTableBody = document.getElementById('ownerRecentBookingsBody');
  // All bookings table on bookings tab
  const allTableBody = document.getElementById('ownerAllBookingsBody');

  if (!bookingsList || bookingsList.length === 0) {
    const emptyRow = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--gm-gray-500);">No booking notifications yet. Active WhatsApp bookings will show here.</td></tr>`;
    if (recentTableBody) recentTableBody.innerHTML = emptyRow;
    if (allTableBody) allTableBody.innerHTML = emptyRow;
    return;
  }

  const rowsHtml = bookingsList.map(b => {
    let badgeClass = 'gm-badge-pending';
    if (b.status === 'confirmed') badgeClass = 'gm-badge-confirmed';
    if (b.status === 'completed') badgeClass = 'gm-badge-active';
    if (b.status === 'cancelled') badgeClass = 'gm-badge-cancelled';

    return `
      <tr>
        <td><strong style="font-family: var(--gm-font-mono);">${b.booking_ref || 'GM-XXXX'}</strong></td>
        <td>${b.equipment_name || 'Machinery Unit'}</td>
        <td>
          <div style="font-weight: 600;">${b.customer_name || 'Farmer Customer'}</div>
          <div style="font-size: 11px; color: var(--gm-gray-500);">${b.customer_phone || '+91 98765 43210'}</div>
        </td>
        <td>${b.start_date || 'Today'} (${b.duration_days || 1} Days)</td>
        <td><strong style="font-family: var(--gm-font-mono);">₹${(b.total_amount || 0).toLocaleString('en-IN')}</strong></td>
        <td><span class="gm-badge ${badgeClass}">${b.status || 'Pending'}</span></td>
        <td>
          <a href="https://wa.me/${(b.customer_phone || '').replace(/\D/g, '')}" target="_blank" class="gm-btn gm-btn-primary" style="padding: 4px 10px; font-size: 11px; font-weight: 700; text-decoration: none;">
            WhatsApp
          </a>
        </td>
      </tr>
    `;
  }).join('');

  if (recentTableBody) recentTableBody.innerHTML = rowsHtml;
  if (allTableBody) allTableBody.innerHTML = rowsHtml;
}

// Toggle Machine Availability (Active / Paused)
async function toggleMachineAvailability(equipmentId, isChecked) {
  const badge = document.getElementById(`status-badge-${equipmentId}`);
  if (badge) {
    badge.className = `gm-badge ${isChecked ? 'gm-badge-confirmed' : 'gm-badge-cancelled'}`;
    badge.textContent = isChecked ? 'Available' : 'Paused';
  }

  try {
    const res = await fetch(`/api/owner/equipment/${equipmentId}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: isChecked })
    });
    if (!res.ok) throw new Error('Failed to update status');
    showToast(isChecked ? 'Machine marked Available for WhatsApp bookings' : 'Machine marked Paused (Hidden from search)', 'success');
  } catch (err) {
    console.error('Error toggling availability:', err);
    showToast('Failed to update machine status', 'error');
  }
}

// Add Machine Modal Functions
function openAddMachineModal() {
  document.getElementById('addMachineModal').style.display = 'flex';
  updateTypeDropdown();
}

function closeAddMachineModal() {
  document.getElementById('addMachineModal').style.display = 'none';
}

function updateTypeDropdown() {
  const cat = document.getElementById('newMachineCategory').value;
  const typeSelect = document.getElementById('newMachineType');
  const types = CANONICAL_EQUIPMENT[cat] || [];

  typeSelect.innerHTML = types.map(t => `<option value="${t}">${t}</option>`).join('');
}

async function handleAddMachineSubmit(e) {
  e.preventDefault();
  const category = document.getElementById('newMachineCategory').value;
  const equipment_type = document.getElementById('newMachineType').value;
  const model = document.getElementById('newMachineModel').value.trim();
  const daily_rate = document.getElementById('newMachinePrice').value.trim();
  const villageSelect = document.getElementById('newMachineVillage');
  const village = (villageSelect && villageSelect.value) ? villageSelect.value : (ownerState.owner.village || 'Jath');
  const district = `${village} (Jath, Sangli)`;

  if (!model || !daily_rate) {
    showToast('Please enter model name and daily rate', 'error');
    return;
  }

  try {
    const res = await fetch('/api/owner/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${equipment_type} - ${model}`,
        category,
        equipment_type,
        model,
        daily_rate: Number(daily_rate),
        district,
        taluka: 'Jath',
        village,
        owner_phone: ownerState.owner.phone || currentOwnerPhone,
        owner_name: ownerState.owner.name || 'Owner'
      })
    });

    if (!res.ok) throw new Error('Failed to add machine');
    
    closeAddMachineModal();
    showToast('Machine listed successfully! It is now live for WhatsApp bookings.', 'success');
    
    // Refresh
    fetchOwnerPortalData();
  } catch (err) {
    console.error('Error adding machine:', err);
    showToast('Failed to add machine. Please retry.', 'error');
  }
}

// Razorpay Subscription Trigger
async function initiateSubscriptionCheckout() {
  try {
    const res = await fetch('/api/owner/subscription/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: ownerState.owner.phone || currentOwnerPhone })
    });
    const data = await res.json();
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    }
  } catch (err) {
    window.location.href = '/demo-payment';
  }
}

// Toast Notifications
function showToast(msg, type = 'info') {
  let toast = document.getElementById('gmToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'gmToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      background: var(--gm-charcoal-900);
      color: #FFFFFF;
      border-radius: var(--gm-radius-sm);
      font-size: 13px;
      font-weight: 500;
      z-index: 9999;
      box-shadow: var(--gm-shadow-md);
      transition: opacity 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span style="font-weight: 600;">${msg}</span>`;
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.opacity = '0';
  }, 3500);
}

// ==========================================================================
// Machinery Owner Diesel & Expense Logbook Management
// ==========================================================================
let ownerExpensesData = {
  logs: [],
  summary: {}
};

async function fetchOwnerExpenses() {
  try {
    const res = await fetch(`/api/owner/expenses?phone=${encodeURIComponent(currentOwnerPhone)}`);
    if (!res.ok) throw new Error('Failed to load expenses');
    const data = await res.json();
    ownerExpensesData = data;
    renderExpenses();
    fetchOwnerMaintenance();
  } catch (err) {
    console.error('Error loading expenses:', err);
  }
}

function renderExpenses() {
  const summary = ownerExpensesData.summary || {};
  const logs = ownerExpensesData.logs || [];

  // Update Summary KPI Cards
  if (document.getElementById('expTotalGross')) {
    document.getElementById('expTotalGross').textContent = `₹${(summary.totalGross || 0).toLocaleString('en-IN')}`;
  }
  if (document.getElementById('expTotalDiesel')) {
    document.getElementById('expTotalDiesel').textContent = `₹${(summary.totalDieselCost || 0).toLocaleString('en-IN')}`;
  }
  if (document.getElementById('expTotalLitres')) {
    document.getElementById('expTotalLitres').textContent = `${summary.totalDieselLitres || 0} Litres consumed`;
  }
  if (document.getElementById('expTotalMaint')) {
    document.getElementById('expTotalMaint').textContent = `₹${((summary.totalMaintenance || 0) + (summary.totalWages || 0)).toLocaleString('en-IN')}`;
  }
  if (document.getElementById('expNetProfit')) {
    document.getElementById('expNetProfit').textContent = `₹${(summary.totalNetProfit || 0).toLocaleString('en-IN')}`;
  }
  if (document.getElementById('expProfitMargin')) {
    document.getElementById('expProfitMargin').textContent = `${summary.profitMarginPercent || 0}% Profit Margin`;
  }
  if (document.getElementById('expAvgMileage')) {
    document.getElementById('expAvgMileage').textContent = `${summary.avgDieselPerHour || 3.4} L/hr`;
  }

  // Update Monthly P&L Banner Mini Summary Chips
  if (document.getElementById('pnlMiniGross')) {
    document.getElementById('pnlMiniGross').textContent = `₹${(summary.totalGross || 0).toLocaleString('en-IN')}`;
  }
  if (document.getElementById('pnlMiniDiesel')) {
    document.getElementById('pnlMiniDiesel').textContent = `₹${(summary.totalDieselCost || 0).toLocaleString('en-IN')}`;
  }
  if (document.getElementById('pnlMiniNet')) {
    document.getElementById('pnlMiniNet').textContent = `+₹${(summary.totalNetProfit || 0).toLocaleString('en-IN')} (${summary.profitMarginPercent || 0}%)`;
  }
  const pnlPdfBtn = document.getElementById('ownerPnlPdfLink');
  if (pnlPdfBtn) {
    pnlPdfBtn.href = `/api/owner/pnl/pdf?phone=${encodeURIComponent(currentOwnerPhone)}&month=2026-08`;
  }

  // Render Logbook Table
  const tbody = document.getElementById('expensesTableBody');
  if (!tbody) return;

  if (!logs.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 24px; color: var(--gm-gray-500);">कोणतीही नोंद आढळली नाही. नवीन डिझेल व खर्च नोंदवण्यासाठी वरील बटण दाबा.</td></tr>';
    return;
  }

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td><strong>${l.date}</strong></td>
      <td>${l.equipment_name}</td>
      <td><span class="gm-badge gm-badge-neutral">${l.hours_worked} hrs</span></td>
      <td>
        <div><strong>₹${l.diesel_cost.toLocaleString('en-IN')}</strong></div>
        <div style="font-size: 11px; color: var(--gm-gray-500);">${l.diesel_litres} Litres</div>
      </td>
      <td>₹${((l.maintenance_cost || 0) + (l.operator_wages || 0)).toLocaleString('en-IN')}</td>
      <td><strong style="color: #0F172A;">₹${l.gross_earnings.toLocaleString('en-IN')}</strong></td>
      <td>
        <span class="gm-badge gm-badge-confirmed" style="font-size: 12px; font-weight: 700;">
          +₹${l.net_profit.toLocaleString('en-IN')}
        </span>
      </td>
      <td style="font-size: 12px; color: var(--gm-gray-600); max-width: 220px;">${l.notes || '-'}</td>
      <td>
        <button onclick="deleteExpenseLog('${l.id}')" style="background: transparent; border: 1px solid #FCA5A5; color: #DC2626; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; padding: 3px 8px;" title="Delete">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

function openAddExpenseModal() {
  document.getElementById('addExpenseModal').style.display = 'flex';
  document.getElementById('expDate').value = new Date().toISOString().split('T')[0];
  calcExpenseLive();
}

function closeAddExpenseModal() {
  document.getElementById('addExpenseModal').style.display = 'none';
}

function calcExpenseLive() {
  const hours = parseFloat(document.getElementById('expHours').value) || 0;
  let litres = parseFloat(document.getElementById('expLitres').value);
  
  if (isNaN(litres) || litres === 0) {
    litres = Math.round((hours * 3.5) * 10) / 10;
    document.getElementById('expLitres').value = litres;
  }

  const dieselCost = Math.round(litres * 95);
  document.getElementById('expDieselCost').value = dieselCost;

  const gross = Math.round(hours * 800);
  if (!document.getElementById('expGross').value) {
    document.getElementById('expGross').value = gross;
  }

  calcNetLive();
}

function calcNetLive() {
  const gross = parseFloat(document.getElementById('expGross').value) || 0;
  const diesel = parseFloat(document.getElementById('expDieselCost').value) || 0;
  const maint = parseFloat(document.getElementById('expMaintCost').value) || 0;
  const wages = parseFloat(document.getElementById('expWages').value) || 0;

  const net = gross - (diesel + maint + wages);
  const preview = document.getElementById('expNetLivePreview');
  if (preview) {
    preview.textContent = `₹${net.toLocaleString('en-IN')} (${gross > 0 ? Math.round((net/gross)*100) : 0}% नफा)`;
    preview.style.color = net >= 0 ? '#15803D' : '#DC2626';
  }
}

async function handleAddExpenseSubmit(e) {
  e.preventDefault();
  const date = document.getElementById('expDate').value;
  const equipment_name = document.getElementById('expMachineSelect').value;
  const hours_worked = parseFloat(document.getElementById('expHours').value) || 1;
  const diesel_litres = parseFloat(document.getElementById('expLitres').value) || 0;
  const diesel_cost = parseFloat(document.getElementById('expDieselCost').value) || 0;
  const maintenance_cost = parseFloat(document.getElementById('expMaintCost').value) || 0;
  const operator_wages = parseFloat(document.getElementById('expWages').value) || 0;
  const gross_earnings = parseFloat(document.getElementById('expGross').value) || 0;
  const notes = document.getElementById('expNotes').value.trim();

  try {
    const res = await fetch('/api/owner/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_phone: currentOwnerPhone,
        date,
        equipment_name,
        hours_worked,
        diesel_litres,
        diesel_cost,
        maintenance_cost,
        operator_wages,
        gross_earnings,
        notes
      })
    });

    if (!res.ok) throw new Error('Failed to save log');

    closeAddExpenseModal();
    showToast('दैनिक हिशोब नोंद सेव्ह झाली! (Log saved)', 'success');
    fetchOwnerExpenses();
  } catch (err) {
    console.error('Error saving expense:', err);
    showToast('नोंद सेव्ह करताना त्रुटी आली.', 'error');
  }
}

async function deleteExpenseLog(id) {
  if (!confirm('ही हिशोब नोंद काढून टाकायची आहे का? (Delete this log?)')) return;

  try {
    const res = await fetch(`/api/owner/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    showToast('नोंद काढली. (Log deleted)', 'info');
    fetchOwnerExpenses();
  } catch (err) {
    showToast('नोंद काढता आली नाही.', 'error');
  }
}

async function sendOwnerPnlWhatsApp() {
  try {
    const res = await fetch('/api/owner/pnl/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: currentOwnerPhone, month: '2026-08' })
    });
    const data = await res.json();
    if (data.success) {
      showToast('मासिक नफा-तोटा अहवाल WhatsApp वर पाठवला!', 'success');
    }
  } catch (err) {
    showToast('अहवाल पाठवता आला नाही.', 'error');
  }
}

// ==========================================================================
// Machinery Preventive Maintenance & Service Due Scheduler
// ==========================================================================
let ownerMaintenanceData = null;

async function fetchOwnerMaintenance() {
  try {
    const res = await fetch(`/api/owner/maintenance?phone=${encodeURIComponent(currentOwnerPhone)}`);
    if (!res.ok) throw new Error('Failed to load maintenance schedule');
    const data = await res.json();
    ownerMaintenanceData = data.schedule;
    renderOwnerMaintenance();
  } catch (err) {
    console.error('Error loading maintenance data:', err);
  }
}

function renderOwnerMaintenance() {
  if (!ownerMaintenanceData) return;

  const totalHoursEl = document.getElementById('maintTotalHoursText');
  if (totalHoursEl) {
    totalHoursEl.textContent = `${ownerMaintenanceData.total_engine_hours} तास`;
  }

  const badgeEl = document.getElementById('maintHealthBadge');
  if (badgeEl) {
    badgeEl.textContent = `आरोग्य स्कोअर: ${ownerMaintenanceData.overall_health_score}`;
    if (ownerMaintenanceData.urgent_alerts_count > 0) {
      badgeEl.style.background = '#FEF3C7';
      badgeEl.style.color = '#92400E';
    } else {
      badgeEl.style.background = '#DCFCE7';
      badgeEl.style.color = '#166534';
    }
  }

  const grid = document.getElementById('maintCardsGrid');
  if (!grid) return;

  const items = ownerMaintenanceData.items || [];
  grid.innerHTML = items.map(item => {
    let barColor = '#16A34A';
    if (item.status === 'OVERDUE') barColor = '#DC2626';
    else if (item.status === 'DUE_SOON') barColor = '#D97706';

    return `
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
            <div style="font-weight: 700; font-size: 13.5px; color: #0F172A;">${item.nameMr}</div>
            <span style="font-size: 11px; font-weight: 700; color: ${item.statusColor}; background: #FFFFFF; border: 1px solid ${item.statusColor}; padding: 2px 6px; border-radius: 4px;">
              ${item.status === 'GOOD' ? 'उत्तम' : (item.status === 'OVERDUE' ? 'तातडीने' : 'लवकरच')}
            </span>
          </div>
          <div style="font-size: 12px; color: var(--gm-gray-600); margin-bottom: 8px;">
            दर ${item.intervalHours} तासांनी आवश्यक &bull; अंदाजे खर्च: ₹${item.costEst.toLocaleString('en-IN')}
          </div>
          
          <!-- Progress Bar -->
          <div style="background: #E2E8F0; border-radius: 6px; height: 8px; overflow: hidden; margin-bottom: 6px;">
            <div style="background: ${barColor}; width: ${item.progressPercent}%; height: 100%;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--gm-gray-600); margin-bottom: 10px;">
            <span>सद्य वापर: ${item.hoursSinceService} तास</span>
            <strong>${item.hoursRemaining > 0 ? item.hoursRemaining + ' तास बाकी' : 'वेळ संपली'}</strong>
          </div>
        </div>

        <div style="border-top: 1px solid #E2E8F0; padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11px; color: var(--gm-gray-500);">शेवटची सर्व्हिस: ${item.lastServicedDate}</span>
          <button onclick="logServiceCompleted('${item.id}')" style="background: #FFFFFF; border: 1px solid #CBD5E1; color: #0F172A; border-radius: 4px; font-size: 11px; font-weight: 700; padding: 4px 8px; cursor: pointer;">
            सर्व्हिस पूर्ण झाली (Reset)
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function sendMaintenanceWhatsAppReminder() {
  try {
    const res = await fetch('/api/owner/maintenance/send-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: currentOwnerPhone })
    });
    const data = await res.json();
    if (data.success) {
      showToast('सर्व्हिस देखभाल सूचना WhatsApp वर पाठवली!', 'success');
    }
  } catch (err) {
    showToast('सूचना पाठवता आली नाही.', 'error');
  }
}

async function logServiceCompleted(serviceId) {
  if (!confirm('या उपकरणाची सर्व्हिस पूर्ण झाली म्हणून नोंद करायची आहे का? (Reset counter?)')) return;

  try {
    const res = await fetch('/api/owner/maintenance/log-service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: currentOwnerPhone, service_id: serviceId })
    });
    const data = await res.json();
    if (data.success) {
      showToast('सर्व्हिस यशस्वीरित्या नोंदवली गेली! काऊंटर रीसेट झाला.', 'success');
      fetchOwnerMaintenance();
    }
  } catch (err) {
    showToast('नोंद करता आली नाही.', 'error');
  }
}

// ==========================================================================
// Owner Monthly Booking & Earnings Calendar (Emoji-Free)
// ==========================================================================
let ownerCalendarData = null;
let currentCalendarMonth = '2026-08';

async function fetchOwnerCalendar(monthStr = '2026-08') {
  currentCalendarMonth = monthStr;
  try {
    const res = await fetch(`/api/owner/calendar?phone=${encodeURIComponent(currentOwnerPhone)}&month=${encodeURIComponent(monthStr)}`);
    if (!res.ok) throw new Error('Failed to load calendar');
    const data = await res.json();
    ownerCalendarData = data.calendar;
    renderOwnerCalendar();
  } catch (err) {
    console.error('Error loading owner calendar:', err);
  }
}

function renderOwnerCalendar() {
  if (!ownerCalendarData) return;

  const summary = ownerCalendarData.summary || {};
  const days = ownerCalendarData.days || [];

  // Update Summary KPIs
  const bookedEl = document.getElementById('calKpiBookedDays');
  if (bookedEl) bookedEl.textContent = `${summary.bookedDays || 0} दिवस`;

  const occEl = document.getElementById('calKpiOccupancy');
  if (occEl) occEl.textContent = `${summary.occupancyRatePercent || 0}% Fleet Occupancy`;

  const idleEl = document.getElementById('calKpiIdleDays');
  if (idleEl) idleEl.textContent = `${summary.idleDays || 0} दिवस`;

  const maintEl = document.getElementById('calKpiMaintDays');
  if (maintEl) maintEl.textContent = `${summary.maintenanceDays || 0} दिवस`;

  const profitEl = document.getElementById('calKpiNetProfit');
  if (profitEl) profitEl.textContent = `+₹${(summary.totalNetProfit || 0).toLocaleString('en-IN')}`;

  const grossEl = document.getElementById('calKpiGrossRevenue');
  if (grossEl) grossEl.textContent = `एकूण भाडे: ₹${(summary.totalGrossRevenue || 0).toLocaleString('en-IN')}`;

  const grid = document.getElementById('ownerCalendarDaysGrid');
  if (!grid) return;

  grid.innerHTML = days.map(d => {
    let bg = '#FFFFFF';
    let borderColor = '#E2E8F0';
    let badgeBg = '#F1F5F9';
    let badgeColor = '#475569';
    let statusText = 'मोकळा दिवस';

    if (d.status === 'BOOKED') {
      bg = '#F0FDF4';
      borderColor = '#86EFAC';
      badgeBg = '#DCFCE7';
      badgeColor = '#166534';
      statusText = 'बुकिंग चालू';
    } else if (d.status === 'MAINTENANCE') {
      bg = '#FFFBEB';
      borderColor = '#FDE68A';
      badgeBg = '#FEF3C7';
      badgeColor = '#92400E';
      statusText = 'सर्व्हिस देखभाल';
    }

    const todayBorder = d.isToday ? 'border: 2px solid #2563EB; box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);' : `border: 1px solid ${borderColor};`;

    return `
      <div style="background: ${bg}; ${todayBorder} border-radius: 8px; padding: 10px; min-height: 110px; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.15s ease;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-weight: 800; font-size: 14px; color: ${d.isToday ? '#2563EB' : '#0F172A'};">
              ${d.day}
            </span>
            <span style="font-size: 10px; font-weight: 700; background: ${badgeBg}; color: ${badgeColor}; padding: 2px 5px; border-radius: 4px;">
              ${statusText}
            </span>
          </div>

          ${d.status === 'BOOKED' ? `
            <div style="font-size: 11px; font-weight: 700; color: #0F172A; line-height: 1.3;">${d.farmer} (${d.village})</div>
            <div style="font-size: 10.5px; color: #475569; margin-top: 2px;">${d.work} &bull; ${d.hours} तास</div>
          ` : (d.status === 'MAINTENANCE' ? `
            <div style="font-size: 11px; font-weight: 700; color: #92400E;">${d.work}</div>
            <div style="font-size: 10.5px; color: #78350F; margin-top: 2px;">खर्च: ₹${d.maintenanceCost.toLocaleString('en-IN')}</div>
          ` : `
            <div style="font-size: 10.5px; color: #94A3B8; margin-top: 4px;">नवीन बुकिंगसाठी उपलब्ध</div>
          `)}
        </div>

        <div style="border-top: 1px solid rgba(0,0,0,0.06); padding-top: 6px; margin-top: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
          ${d.status === 'BOOKED' ? `
            <span style="font-weight: 800; color: #15803D;">+₹${d.netProfit.toLocaleString('en-IN')}</span>
            <span style="color: #64748B; font-size: 10px;">डिझेल: ₹${d.dieselCost}</span>
          ` : (d.status === 'MAINTENANCE' ? `
            <span style="font-weight: 700; color: #B45309;">-₹${d.maintenanceCost.toLocaleString('en-IN')}</span>
            <span style="color: #64748B; font-size: 10px;">सर्व्हिस</span>
          ` : `
            <span style="color: #94A3B8; font-weight: 600;">₹0</span>
            <span style="color: #94A3B8; font-size: 10px;">मोकळा</span>
          `)}
        </div>
      </div>
    `;
  }).join('');
}
