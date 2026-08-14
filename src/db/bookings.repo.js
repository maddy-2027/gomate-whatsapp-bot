const supabase = require('./supabase');

async function createBooking(data) {
  const ref = 'GM-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const newBooking = { ...data, booking_ref: ref, id: data.id || Math.floor(Math.random() * 10000) };
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([newBooking])
      .select()
      .single();
    if (!error && booking && booking.booking_ref) return booking;
  } catch (err) {
    console.error('Error inserting booking:', err);
  }
  return newBooking;
}


async function getBookingByRef(ref) {
  const { data, error } = await supabase.from('bookings').select('*, equipment(*)').eq('booking_ref', ref).single();
  return data;
}

async function getBookingsByPhone(phone) {
  const { data, error } = await supabase.from('bookings').select('*, equipment(*)').eq('customer_phone', phone).order('created_at', { ascending: false });
  return data || [];
}

async function getBookingsByEquipment(equipmentId) {
  const { data, error } = await supabase.from('bookings').select('*').eq('equipment_id', equipmentId).order('created_at', { ascending: false });
  return data || [];
}

async function updateBookingStatus(id, status) {
  const { data, error } = await supabase.from('bookings').update({ status }).eq('id', id);
  return !error;
}

module.exports = { createBooking, getBookingByRef, getBookingsByPhone, getBookingsByEquipment, updateBookingStatus };
