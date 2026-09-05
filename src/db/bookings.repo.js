const supabase = require('./supabase');

// In-memory fallback bookings for simulation & testing
let memoryBookings = [
  {
    id: 'b1-001',
    booking_ref: 'GM-8942',
    customer_name: 'Vikram Shinde',
    customer_phone: '+919876543210',
    equipment_name: 'Mahindra 575 DI (45 HP)',
    category: 'agriculture',
    district: 'Jath',
    village: 'शेगाव',
    landmark: 'गट क्र. २४, विहिरीशेजारी',
    latitude: 17.0850,
    longitude: 75.2900,
    google_maps_url: 'https://www.google.com/maps/dir/?api=1&destination=17.0850,75.2900',
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
    equipment_name: 'JCB 3DX Super Backhoe Loader',
    category: 'infrastructure',
    district: 'Jath',
    village: 'संख',
    landmark: 'नवीन कालवा कामाजवळ',
    latitude: 16.9200,
    longitude: 75.4500,
    google_maps_url: 'https://www.google.com/maps/dir/?api=1&destination=16.9200,75.4500',
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
    equipment_name: 'Tata Ace Gold (Chhota Hathi)',
    category: 'transport',
    district: 'Jath',
    village: 'उमदी',
    landmark: 'बाजार समिती रोड, पेट्रोल पंप समोर',
    latitude: 16.9800,
    longitude: 75.5200,
    google_maps_url: 'https://www.google.com/maps/dir/?api=1&destination=16.9800,75.5200',
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
    equipment_name: 'GoMate Agri Spray Drone',
    category: 'agriculture',
    district: 'Jath',
    village: 'डफळापूर',
    landmark: 'डाळिंब बाग, शेताचे मुख्य प्रवेशद्वार',
    latitude: 17.0100,
    longitude: 75.1200,
    google_maps_url: 'https://www.google.com/maps/dir/?api=1&destination=17.0100,75.1200',
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
  
  // Format start date as valid SQL date (YYYY-MM-DD)
  let sqlDate = new Date().toISOString().split('T')[0];
  if (data.start_date && /^\d{4}-\d{2}-\d{2}$/.test(data.start_date)) {
    sqlDate = data.start_date;
  }

  const dbBooking = {
    booking_ref: ref,
    customer_phone: data.customer_phone || '+919876543210',
    customer_name: data.customer_name || 'Customer',
    start_date: sqlDate,
    duration_days: parseInt(data.duration_days) || 1,
    total_amount: parseFloat(data.total_amount) || 1500,
    status: data.status || 'pending'
  };

  // If valid UUID equipment ID
  if (data.equipment_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.equipment_id)) {
    dbBooking.equipment_id = data.equipment_id;
  }

  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([dbBooking])
      .select()
      .single();
    if (!error && booking && booking.booking_ref) {
      const fullBooking = { ...booking, ...data, booking_ref: booking.booking_ref };
      memoryBookings.unshift(fullBooking);
      return fullBooking;
    }
  } catch (err) {
    console.warn('Supabase createBooking fallback:', err.message);
  }

  const fallback = { ...data, ...dbBooking, id: 'b-' + Date.now(), created_at: new Date().toISOString() };
  memoryBookings.unshift(fallback);
  return fallback;
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
    const { error } = await supabase.from('bookings').update({ status }).or(`id.eq.${id},booking_ref.eq.${id}`);
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
