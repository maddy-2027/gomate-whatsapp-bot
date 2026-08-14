const { getText } = require('../../services/language');
const { createBooking } = require('../../db/bookings.repo');
const twilioService = require('../../services/twilio'); 

async function handleEquipmentSelect(phone, text, session) {
  const idx = parseInt(text.trim()) - 1;
  const results = session.data.searchResults;
  if (!isNaN(idx) && results && results[idx]) {
    session.data.selectedEquipment = results[idx];
    session.state = 'BOOKING_DATES';
    return getText(session.language, 'booking_dates_prompt', { model: results[idx].model });
  }
  return "Please select a valid number from the results.";
}

async function handleDateInput(phone, text, session) {
  const parts = text.split(' ');
  if (parts.length >= 2) {
    session.data.startDate = parts[0];
    session.data.duration = parseInt(parts[1]) || 1;
    const equip = session.data.selectedEquipment;
    session.data.totalAmount = equip.price_per_day * session.data.duration;
    
    session.state = 'BOOKING_CONFIRM';
    return getText(session.language, 'booking_summary', {
      model: equip.model,
      date: session.data.startDate,
      duration: session.data.duration,
      total: session.data.totalAmount
    });
  }
  return "Invalid format. Please enter date and duration (e.g. 15/08/2026 3)";
}

async function handleConfirmation(phone, text, session) {
  const t = text.trim().toUpperCase();
  if (t === 'CONFIRM') {
    const equip = session.data.selectedEquipment;
    const booking = await createBooking({
      customer_phone: phone,
      equipment_id: equip.id,
      start_date: session.data.startDate,
      duration_days: session.data.duration,
      total_amount: session.data.totalAmount,
      status: 'pending'
    });
    
    session.state = 'CUSTOMER_MENU';
    return getText(session.language, 'booking_confirmed', { ref: booking.booking_ref });
  } else if (t === 'CANCEL') {
    session.state = 'CUSTOMER_MENU';
    return getText(session.language, 'booking_cancelled');
  }
  return "Please reply with CONFIRM or CANCEL.";
}

module.exports = { handleEquipmentSelect, handleDateInput, handleConfirmation };
