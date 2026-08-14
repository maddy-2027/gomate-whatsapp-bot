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

const { createBookingPaymentLink } = require('../../services/razorpay');
const { sendWhatsAppDirect } = require('../../services/whatsappWeb');

async function handleConfirmation(phone, text, session) {

  const t = text.trim().toUpperCase();
  if (t === 'CONFIRM') {
    const equip = session.data.selectedEquipment || {};
    const booking = await createBooking({
      customer_phone: phone,
      equipment_id: equip.id,
      start_date: session.data.startDate,
      duration_days: session.data.duration,
      total_amount: session.data.totalAmount,
      status: 'pending'
    });
    
    // 1. Generate Customer Instant Payment Link
    const payObj = await createBookingPaymentLink(
      phone, 
      session.data.totalAmount || 1500, 
      booking.booking_ref, 
      equip.model || 'Equipment'
    );
    const payLink = payObj && payObj.short_url ? payObj.short_url : 'https://rzp.io/l/gomate-booking';

    // 2. Determine Owner Contact (from equipment relation or default owner phone)
    const ownerPhone = (equip.owners && equip.owners.phone) || equip.owner_phone || '+919123456789';
    const ownerLang = (equip.owners && equip.owners.language) || session.language || 'en';

    // 3. Format Owner Notification in owner's language
    const alertMsg = getText(ownerLang, 'owner_new_booking_notification', {
      ref: booking.booking_ref,
      customerPhone: phone,
      model: equip.model || 'Equipment',
      date: session.data.startDate,
      duration: session.data.duration,
      total: session.data.totalAmount
    });

    console.log(`\n📢 INSTANT OWNER ALERT: Dispatching to ${ownerPhone}...`);

    // Dispatch alert to Equipment Owner
    sendWhatsAppDirect(ownerPhone, alertMsg).catch(err => console.error('Owner WhatsApp alert failed:', err));

    // Send alert preview to demo tester
    const demoOwnerPreview = `🔔 *[TRACTOR OWNER NOTIFICATION PREVIEW]*\n_This is what the machinery owner receives immediately on their phone:_\n\n${alertMsg}`;
    sendWhatsAppDirect(phone, demoOwnerPreview).catch(err => console.error('Demo alert preview failed:', err));

    session.state = 'CUSTOMER_MENU';
    
    // 4. Return Customer Confirmation with Payment Link
    const confirmText = getText(session.language, 'booking_confirmed', { ref: booking.booking_ref });
    const paymentPrompt = `💳 *Pay Rental Total (₹${session.data.totalAmount}) via UPI:*\n${payLink}\n\n_Instant payment with PhonePe, Google Pay, Paytm, or BHIM UPI._`;

    return `${confirmText}\n\n${paymentPrompt}`;
  } else if (t === 'CANCEL') {
    session.state = 'CUSTOMER_MENU';
    return getText(session.language, 'booking_cancelled');
  }
  return "Please reply with CONFIRM or CANCEL.";
}

module.exports = { handleEquipmentSelect, handleDateInput, handleConfirmation };


