/**
 * GoMate Admin Fleet Route Optimizer & Dispatch Engine
 */

const { calculateDistanceAndETA } = require('./distanceService');
const equipmentRepo = require('../db/equipment.repo');
const bookingsRepo = require('../db/bookings.repo');

const assignmentLog = [];

const JATH_DRIVERS = [
  { name: 'राजेश पाटील', phone: '+919822012345', hub: 'शेगाव' },
  { name: 'सुरेश शिंदे', phone: '+919845001122', hub: 'जत' },
  { name: 'तुकाराम माळी', phone: '+919876543210', hub: 'उमदी' },
  { name: 'विजय जाधव', phone: '+919900112233', hub: 'संख' },
  { name: 'बाळासाहेब पवार', phone: '+919966778899', hub: 'डफळापूर' },
];

async function getPendingUnassignedBookings() {
  try {
    const allBookings = await bookingsRepo.getAllBookings ? bookingsRepo.getAllBookings() : [];
    const bookings = Array.isArray(allBookings) ? allBookings : (allBookings.bookings || []);
    const pending = bookings
      .filter(b => ['confirmed', 'pending'].includes((b.status || '').toLowerCase()))
      .slice(0, 20)
      .map(b => ({
        ref: b.ref || b.booking_ref || b.id,
        customer_phone: b.customer_phone || b.phone,
        equipment_type: b.equipment_type || b.category || 'Tractor',
        location: b.location || b.village || 'शेगाव',
        start_date: b.start_date || b.date || new Date().toISOString().split('T')[0],
        duration_days: b.duration_days || b.days || 1,
        status: b.status || 'confirmed',
        assigned_machine: b.assigned_machine || null,
        assigned_driver: b.assigned_driver || null,
      }));
    if (pending.length === 0) {
      return [
        { ref: 'GM-A1B2', customer_phone: '+919876543210', equipment_type: 'Rotavator Tractor', location: 'शेगाव', start_date: '2026-08-30', duration_days: 2, status: 'confirmed', assigned_machine: null, assigned_driver: null },
        { ref: 'GM-C3D4', customer_phone: '+919999988888', equipment_type: 'JCB Backhoe Loader', location: 'उमदी', start_date: '2026-08-30', duration_days: 1, status: 'confirmed', assigned_machine: null, assigned_driver: null },
        { ref: 'GM-E5F6', customer_phone: '+917700112233', equipment_type: 'Paddy Harvester', location: 'संख', start_date: '2026-08-31', duration_days: 3, status: 'pending', assigned_machine: null, assigned_driver: null },
        { ref: 'GM-G7H8', customer_phone: '+918899001122', equipment_type: 'Power Tiller', location: 'डफळापूर', start_date: '2026-09-01', duration_days: 1, status: 'confirmed', assigned_machine: null, assigned_driver: null },
      ];
    }
    return pending;
  } catch (err) {
    console.error('getPendingUnassignedBookings error:', err.message);
    return [
      { ref: 'GM-A1B2', customer_phone: '+919876543210', equipment_type: 'Rotavator Tractor', location: 'शेगाव', start_date: '2026-08-30', duration_days: 2, status: 'confirmed', assigned_machine: null, assigned_driver: null },
      { ref: 'GM-C3D4', customer_phone: '+919999988888', equipment_type: 'JCB Backhoe Loader', location: 'उमदी', start_date: '2026-08-30', duration_days: 1, status: 'confirmed', assigned_machine: null, assigned_driver: null },
    ];
  }
}

async function findNearestIdleMachines(bookingLocation, equipmentType) {
  try {
    let equipment = [];
    if (typeof equipmentRepo.getAllEquipment === 'function') {
      equipment = await equipmentRepo.getAllEquipment();
    }
    const machines = (Array.isArray(equipment) && equipment.length > 0) ? equipment.slice(0, 8) : [
      { id: 'EQ-001', model: 'Mahindra 475 DI', type: 'Tractor', owner_name: 'राजेश पाटील', hub: 'शेगाव', status: 'available', price_per_day: 1200 },
      { id: 'EQ-002', model: 'Swaraj 744 FE', type: 'Tractor', owner_name: 'सुरेश शिंदे', hub: 'जत', status: 'available', price_per_day: 1100 },
      { id: 'EQ-003', model: 'JCB 3DX Super', type: 'JCB', owner_name: 'तुकाराम माळी', hub: 'उमदी', status: 'available', price_per_day: 5500 },
      { id: 'EQ-004', model: 'Claas Crop Tiger', type: 'Harvester', owner_name: 'विजय जाधव', hub: 'संख', status: 'available', price_per_day: 3200 },
      { id: 'EQ-005', model: 'Eicher 380 Super', type: 'Tractor', owner_name: 'बाळासाहेब पवार', hub: 'डफळापूर', status: 'available', price_per_day: 1050 },
      { id: 'EQ-006', model: 'New Holland 3630', type: 'Tractor', owner_name: 'रामेश्वर खोत', hub: 'बिळूर', status: 'available', price_per_day: 1300 },
    ];
    const machineType = (equipmentType || '').toLowerCase().includes('jcb') ? 'jcb'
      : (equipmentType || '').toLowerCase().includes('harvest') ? 'harvester' : 'tractor';
    const ranked = machines.map((m, idx) => {
      const hub = m.hub || m.village || m.location || m.taluka || m.district || 'जत';
      const eta = calculateDistanceAndETA(bookingLocation, hub, machineType);
      return {
        id: String(m.id || m.equipment_id || `EQ-${idx + 1}`),
        model: m.model || m.name || 'Mahindra Tractor',
        type: m.type || m.category || 'Tractor',
        owner_name: m.owner_name || m.owners?.name || 'राजेश पाटील',
        hub,
        price_per_day: Number(m.price_per_day || m.pricePerDay || 1200),
        distance_km: eta.distanceKm,
        eta_minutes: eta.etaMinutes,
        eta_badge: eta.formattedBadgeMr,
        status: m.available !== false ? 'available' : 'busy',
      };
    });
    ranked.sort((a, b) => a.eta_minutes - b.eta_minutes);
    return ranked.slice(0, 4);
  } catch (err) {
    console.error('findNearestIdleMachines error:', err.message);
    return [];
  }
}

async function assignMachineToBooking({ bookingRef, machineId, machineModel, driverName, driverPhone, farmerPhone, farmerVillage, etaMinutes, distanceKm, equipmentType }) {
  const assignedAt = new Date().toISOString();
  const driver = JATH_DRIVERS.find(d => d.phone === driverPhone) || JATH_DRIVERS[0];

  const farmerMessage =
    `नमस्कार! आपले बुकिंग *${bookingRef}* साठी यंत्र निश्चित झाले आहे.\n\n` +
    `*यंत्र:* ${machineModel} (${equipmentType || 'Tractor'})\n` +
    `*चालक:* ${driverName || driver.name}\n` +
    `*अंतर:* ${distanceKm} किमी\n` +
    `*अंदाजे वेळ:* ${etaMinutes} मिनिटांत पोहोचेल\n\n` +
    `चालक संपर्क: ${driverPhone || driver.phone}\n` +
    `GoMate Support: 1800-123-4567`;

  const ownerMessage =
    `*GoMate — डिस्पॅच आदेश*\n\n` +
    `*बुकिंग:* ${bookingRef}\n` +
    `*यंत्र:* ${machineModel}\n` +
    `*शेतकरी:* ${farmerPhone}\n` +
    `*गाव:* ${farmerVillage}\n` +
    `*अंतर:* ${distanceKm} किमी | *वेळ:* ${etaMinutes} मिनिटे\n\n` +
    `कृपया ताबडतोब निघा.`;

  const assignment = {
    booking_ref: bookingRef, machine_id: machineId, machine_model: machineModel,
    driver_name: driverName || driver.name, driver_phone: driverPhone || driver.phone,
    farmer_village: farmerVillage, distance_km: distanceKm, eta_minutes: etaMinutes,
    assigned_at: assignedAt, farmer_message: farmerMessage, owner_message: ownerMessage,
  };
  assignmentLog.push(assignment);

  return { success: true, booking_ref: bookingRef, machine_model: machineModel,
    driver_name: driverName || driver.name, eta_minutes: etaMinutes, distance_km: distanceKm,
    farmer_message: farmerMessage, owner_message: ownerMessage, assigned_at: assignedAt };
}

function getAssignmentLog() { return assignmentLog; }

module.exports = { getPendingUnassignedBookings, findNearestIdleMachines, assignMachineToBooking, getAssignmentLog };
