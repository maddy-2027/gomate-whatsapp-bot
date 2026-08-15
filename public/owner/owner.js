/**
 * GoMate Owner Pro Portal Client JS
 * Dynamic data binding, listing creation, availability toggles, and subscription flow
 */

let currentOwnerPhone = '+919822012345';
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
    'Heavy Trucks (Tata / Blazo)',
    'Dump Trucks & Tippers',
    'Cargo Vans (Eeco)',
    'Delivery Mini Trucks (Tata Ace)',
    'Tanker Trucks (12KL)'
  ],
  infrastructure: [
    'Heavy Excavators (21-Tonne)',
    'Crawler Bulldozers',
    'Backhoe Loaders (JCB 3DX)'
  ]
};

// Initial Load
window.addEventListener('DOMContentLoaded', () => {
  fetchOwnerPortalData();
});

function switchOwnerTab(tabId) {
  document.querySelectorAll('.owner-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.owner-panel').forEach(p => p.style.display = 'none');

  const currentBtn = Array.from(document.querySelectorAll('.owner-tab-btn')).find(b => b.getAttribute('data-tab') === tabId);
  if (currentBtn) currentBtn.classList.add('active');

  const panel = document.getElementById(`tab-${tabId}`);
  if (panel) panel.style.display = 'block';
}

function handleOwnerChange(phone) {
  currentOwnerPhone = phone;
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
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--gm-white); border-radius: var(--gm-radius-md); border: 1px solid var(--gm-gray-200);">
        <div style="font-size: 36px; margin-bottom: 12px;">🚜</div>
        <h3>No machinery listed yet</h3>
        <p style="color: var(--gm-gray-600); font-size: 14px; margin-top: 4px; margin-bottom: 16px;">Add your tractors, trucks, or JCBs to start receiving customer bookings on WhatsApp.</p>
        <button class="gm-btn gm-btn-primary" onclick="openAddMachineModal()">➕ Add Machinery Listing</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = equipmentList.map(item => {
    let img = '/assets/equipment/agri_hero.jpg';
    let badgeClass = 'gm-badge-agri';
    let catIcon = '🌾';

    if (item.category === 'transport') {
      img = '/assets/equipment/transport_hero.jpg';
      badgeClass = 'gm-badge-info';
      catIcon = '🚚';
    } else if (item.category === 'infrastructure') {
      img = '/assets/equipment/infra_hero.jpg';
      badgeClass = 'gm-badge-warning';
      catIcon = '🏗️';
    }

    const isAvailable = item.available !== false;

    return `
      <div class="owner-equip-card" id="equip-card-${item.id}">
        <img src="${img}" alt="${item.name || item.model}" class="owner-equip-img">
        <div class="owner-equip-body">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <div>
              <span class="gm-badge ${badgeClass}">${catIcon} ${item.category}</span>
              <h3 style="font-size: 16px; margin-top: 6px; font-weight: 700;">${item.name || item.model}</h3>
            </div>
            <label class="toggle-switch" title="Toggle active machinery availability">
              <input type="checkbox" ${isAvailable ? 'checked' : ''} onchange="toggleMachineAvailability('${item.id}', this.checked)">
              <span class="slider"></span>
            </label>
          </div>

          <p style="font-size: 13px; color: var(--gm-gray-600); margin: 6px 0;">
            ${item.equipment_type || item.model} • ${item.district || 'Pune'}
          </p>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--gm-gray-200); padding-top: 12px; margin-top: auto;">
            <div>
              <span style="font-size: 11px; color: var(--gm-gray-500);">Hire Rate:</span>
              <div style="font-size: 17px; font-weight: 700; color: var(--gm-brand-navy);">₹${Number(item.daily_rate || 1500).toLocaleString('en-IN')}<span style="font-size: 11px; font-weight: normal; color: var(--gm-gray-500);">/day</span></div>
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
        <td><strong>₹${(b.total_amount || 0).toLocaleString('en-IN')}</strong></td>
        <td><span class="gm-badge ${badgeClass}">${b.status || 'Pending'}</span></td>
        <td>
          <a href="https://wa.me/${(b.customer_phone || '').replace(/\D/g, '')}" target="_blank" class="gm-btn gm-btn-primary" style="padding: 4px 10px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
            💬 WhatsApp
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
  const district = document.getElementById('newMachineDistrict').value.trim() || ownerState.owner.district || 'Pune';

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
        owner_phone: ownerState.owner.phone || currentOwnerPhone,
        owner_name: ownerState.owner.name || 'Rajesh Patil'
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

  const icon = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : 'ℹ️');
  toast.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.opacity = '0';
  }, 3500);
}
