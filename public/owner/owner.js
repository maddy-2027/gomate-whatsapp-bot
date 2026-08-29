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
        <div style="width: 54px; height: 54px; border-radius: 50%; background: var(--gm-gray-100); color: var(--gm-gray-500); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <h3 style="font-size: 18px; margin-bottom: 4px;">No machinery listed yet</h3>
        <p style="color: var(--gm-gray-600); font-size: 14px; margin-top: 4px; margin-bottom: 16px;">Add your tractors, trucks, or JCBs to start receiving customer bookings on WhatsApp.</p>
        <button class="gm-btn gm-btn-primary" onclick="openAddMachineModal()" style="display: inline-flex; align-items: center; gap: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
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
          <a href="https://wa.me/${(b.customer_phone || '').replace(/\D/g, '')}" target="_blank" class="gm-btn gm-btn-primary" style="padding: 4px 10px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
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

  let iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  if (type === 'success') {
    iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
  }
  toast.innerHTML = `<span>${iconSvg}</span> <span>${msg}</span>`;
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
        <button onclick="deleteExpenseLog('${l.id}')" style="background: transparent; border: none; color: #EF4444; cursor: pointer; font-size: 13px; padding: 4px;" title="Delete">
          🗑️
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
