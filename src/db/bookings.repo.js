const supabase = require('./supabase');

// In-memory fallback bookings for simulation & testing
let memoryBookings = [
  {
    id: 'b1-001',
    booking_ref: 'GM-8942',
    customer_name: 'Vikram Shinde',
    customer_phone: '+919876543210',
    equipment_id: '101',
    equipment_name: 'Mahindra 575 DI (45 HP)',
    category: 'agriculture',
    district: 'Pune',
    start_date: '2026-08-16',
    duration_days: 3,
    total_amount: 4500,
    status: 'confirmed',
    owner_phone: '+919822012345',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'b1-002',
    booking_ref: 'GM-3419',
    customer_name: 'Ramesh Pawar',
    customer_phone: '+919811223344',
    equipment_id: '301',
    equipment_name: 'JCB 3DX Super Backhoe Loader',
    category: 'infrastructure',
    district: 'Nashik',
    start_date: '2026-08-18',
    duration_days: 2,
    total_amount: 9000,
    status: 'pending',
    owner_phone: '+919822054321',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'b1-003',
    booking_ref: 'GM-5510',
    customer_name: 'Sunil Gaikwad',
    customer_phone: '+919766554433',
    equipment_id: '201',
    equipment_name: 'Tata Ace Gold (Chhota Hathi)',
    category: 'transport',
    district: 'Kolhapur',
    start_date: '2026-08-15',
    duration_days: 1,
    total_amount: 1300,
    status: 'completed',
    owner_phone: '+919822099887',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'b1-004',
    booking_ref: 'GM-7721',
    customer_name: 'Ganesh More',
    customer_phone: '+919422001122',
    equipment_id: '109',
    equipment_name: 'GoMate Agri-Hexacopter Spray Drone 10L',
    category: 'agriculture',
    district: 'Nashik',
    start_date: '2026-08-20',
    duration_days: 2,
    total_amount: 5000,
    status: 'confirmed',
    owner_phone: '+919822054321',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

async function createBooking(data) {
  const ref = 'GM-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const newBooking = {
    ...data,
    booking_ref: ref,
    id: data.id || ('b-' + Date.now()),
    created_at: new Date().toISOString(),
    status: data.status || 'pending'
  };

  memoryBookings.unshift(newBooking);

  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([newBooking])
      .select()
      .single();
    if (!error && booking && booking.booking_ref) return booking;
  } catch (err) {
    console.error('Error inserting booking to Supabase:', err);
  }
  return newBooking;
}

async function getBookingByRef(ref) {
  try {
    const { data, error } = await supabase.from('bookings').select('*, equipment(*)').eq('booking_ref', ref).single();
    if (!error && data) return data;
  } catch (err) {
    // fallback to memory
  }
  return memoryBookings.find(b => b.booking_ref === ref.toUpperCase()) || null;
}

async function getBookingsByPhone(phone) {
  try {
    const { data, error } = await supabase.from('bookings').select('*, equipment(*)').eq('customer_phone', phone).order('created_at', { ascending: false });
    if (!error && data && data.length) return data;
  } catch (err) {
    // fallback
  }
  return memoryBookings.filter(b => b.customer_phone === phone);
}

async function getBookingsByOwnerPhone(ownerPhone) {
  try {
    const { data, error } = await supabase.from('bookings').select('*').eq('owner_phone', ownerPhone).order('created_at', { ascending: false });
    if (!error && data && data.length) return data;
  } catch (err) {
    // fallback
  }
  return memoryBookings.filter(b => b.owner_phone === ownerPhone);
}

async function getBookingsByEquipment(equipmentId) {
  try {
    const { data, error } = await supabase.from('bookings').select('*').eq('equipment_id', equipmentId).order('created_at', { ascending: false });
    if (!error && data && data.length) return data;
  } catch (err) {
    // fallback
  }
  return memoryBookings.filter(b => b.equipment_id == equipmentId);
}

async function updateBookingStatus(id, status) {
  const item = memoryBookings.find(b => b.id == id || b.booking_ref == id);
  if (item) item.status = status;

  try {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    return !error;
  } catch (err) {
    return true;
  }
}

async function getAllBookings() {
  try {
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length) return data;
  } catch (err) {
    // fallback
  }
  return memoryBookings;
}

async function getBookingStats() {
  const all = await getAllBookings();
  const totalBookings = all.length;
  const confirmed = all.filter(b => b.status === 'confirmed').length;
  const pending = all.filter(b => b.status === 'pending').length;
  const completed = all.filter(b => b.status === 'completed').length;
  const totalVolume = all.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

  return {
    totalBookings,
    confirmed,
    pending,
    completed,
    totalVolume
  };
}

module.exports = {
  createBooking,
  getBookingByRef,
  getBookingsByPhone,
  getBookingsByOwnerPhone,
  getBookingsByEquipment,
  updateBookingStatus,
  getAllBookings,
  getBookingStats
};
