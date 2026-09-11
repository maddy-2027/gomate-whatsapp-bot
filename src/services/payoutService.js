/**
 * payoutService.js
 * Calculates owner wallet balances and payout ledger from bookings.
 *
 * Payment split model:
 *  - Customer pays 20% advance via Razorpay (held by GoMate platform)
 *  - Customer pays 80% cash on-site to the owner directly
 *  - GoMate disburses the 20% advance to the owner monthly (less 2% platform fee)
 */

const bookingsRepo = require('../db/bookings.repo');
const equipmentRepo = require('../db/equipment.repo');

/**
 * Returns wallet summary + payout ledger for the given owner phone.
 * @param {string} ownerPhone
 * @returns {Promise<Object>}
 */
async function getOwnerPayoutSummary(ownerPhone) {
  const allEquip = await equipmentRepo.getAllEquipment();
  const ownerEquipIds = new Set(
    allEquip
      .filter(e => e.owner_phone === ownerPhone)
      .map(e => String(e.id))
  );

  const allBookings = await bookingsRepo.getAllBookings();
  const ownerBookings = allBookings.filter(b =>
    b.owner_phone === ownerPhone || ownerEquipIds.has(String(b.equipment_id))
  );

  let advancesReceived = 0;   // 20% paid via Razorpay (held by GoMate)
  let cashToCollect = 0;       // 80% cash on-site still to collect
  let cashCollected = 0;       // 80% cash already collected (completed bookings)
  const ledger = [];

  for (const b of ownerBookings) {
    const total = Number(b.total_amount) || 0;
    const advance = Math.round(total * 0.20);
    const balance = total - advance;
    const date = b.created_at ? b.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
    const farmerName = b.customer_name || b.farmer_name || 'शेतकरी';
    const machineName = b.equipment_name || 'मशिनरी';
    const status = (b.status || '').toUpperCase();

    // Advance tracking
    if (['CONFIRMED', 'COMPLETED', 'ACTIVE'].includes(status) && advance > 0) {
      advancesReceived += advance;
      ledger.push({
        date,
        type: 'advance',
        label: `20% आगाऊ — ${farmerName} (${machineName})`,
        amount: advance,
        status: status === 'COMPLETED' ? 'paid' : 'pending',
        booking_id: b.id
      });
    }

    // Cash on-site tracking
    if (['CONFIRMED', 'ACTIVE'].includes(status) && balance > 0) {
      cashToCollect += balance;
      ledger.push({
        date,
        type: 'cash',
        label: `80% रोख — ${farmerName} (${machineName})`,
        amount: balance,
        status: 'pending_collection',
        booking_id: b.id
      });
    } else if (status === 'COMPLETED' && balance > 0) {
      cashCollected += balance;
      ledger.push({
        date,
        type: 'cash',
        label: `80% रोख — ${farmerName} (${machineName})`,
        amount: balance,
        status: 'collected',
        booking_id: b.id
      });
    }
  }

  // Platform fee (2% of advances)
  const platformFee = Math.round(advancesReceived * 0.02);
  const netPayout = advancesReceived - platformFee;

  // Sort ledger newest-first
  ledger.sort((a, b) => b.date.localeCompare(a.date));

  // Seed some demo entries if no real bookings
  if (ledger.length === 0) {
    const today = new Date();
    const fmt = d => d.toISOString().split('T')[0];
    ledger.push(
      { date: fmt(new Date(today - 2 * 86400000)), type: 'advance', label: '20% आगाऊ — तुकाराम पाटील (ट्रॅक्टर)', amount: 960, status: 'pending', booking_id: 'demo-1' },
      { date: fmt(new Date(today - 5 * 86400000)), type: 'cash', label: '80% रोख — रमेश जाधव (रोटाव्हेटर)', amount: 3840, status: 'collected', booking_id: 'demo-2' },
      { date: fmt(new Date(today - 8 * 86400000)), type: 'advance', label: '20% आगाऊ — सुनील माने (JCB)', amount: 1200, status: 'paid', booking_id: 'demo-3' }
    );
    advancesReceived = 2160;
    cashToCollect = 0;
    cashCollected = 3840;
    platformFee = Math.round(advancesReceived * 0.02);
    netPayout = advancesReceived - platformFee;
  }

  return {
    summary: {
      advancesReceived,   // 20% held by GoMate
      netPayout,           // after 2% platform fee
      platformFee,
      cashToCollect,       // 80% owner must collect on-site
      cashCollected,       // 80% already collected
      totalBookings: ownerBookings.length
    },
    ledger
  };
}

module.exports = { getOwnerPayoutSummary };
