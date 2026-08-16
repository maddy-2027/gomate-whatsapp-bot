const { getText } = require('../../services/language');
const { createBooking } = require('../../db/bookings.repo');
const { createBookingPaymentLink } = require('../../services/razorpay');
const { sendWhatsAppDirect } = require('../../services/whatsappWeb');

async function handleEquipmentSelect(phone, text, session) {
  const idx = parseInt(text.trim()) - 1;
  const results = session.data.searchResults;
  if (!isNaN(idx) && results && results[idx]) {
    session.data.selectedEquipment = results[idx];
    session.state = 'BOOKING_DATES';
    return getText(session.language, 'booking_dates_prompt', { model: results[idx].model });
  }
  return getText(session.language, 'invalid_selection');
}

/**
 * Flexible Date & Duration Parser
 * Handles "15/08/2026 3", "Tomorrow for 2 days", "उद्या 2 दिवस", "कल 2 दिन", "2 days", etc.
 */
async function handleDateInput(phone, text, session) {
  const t = text.trim();
  const lower = t.toLowerCase();

  let startDate = 'Today';
  let duration = 1;

  // Extract number of days from anywhere in string
  const numMatch = t.match(/\b([1-9][0-9]?)\b/);
  const foundNum = numMatch ? parseInt(numMatch[1]) : 1;

  if (lower.includes('उद्या') || lower.includes('कल') || lower.includes('tomorrow')) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    startDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    duration = foundNum > 0 ? foundNum : 1;
  } else if (lower.includes('आज') || lower.includes('today')) {
    const d = new Date();
    startDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    duration = foundNum > 0 ? foundNum : 1;
  } else {
    // Check if parts match "DD/MM/YYYY duration"
    const parts = t.split(/[\s,]+/);
    if (parts.length >= 2 && parts[0].includes('/')) {
      startDate = parts[0];
      duration = parseInt(parts[1]) || foundNum || 1;
    } else if (parts[0].includes('/')) {
      startDate = parts[0];
      duration = foundNum || 1;
    } else {
      // Fallback: use text as date description with parsed duration
      const d = new Date();
      startDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      duration = foundNum || 1;
    }
  }

  session.data.startDate = startDate;
  session.data.duration = duration;
  const equip = session.data.selectedEquipment || {};
  const pricePerDay = equip.price_per_day || 1500;
  session.data.totalAmount = pricePerDay * duration;

  session.state = 'BOOKING_CONFIRM';
  return getText(session.language, 'booking_summary', {
    model: equip.model || 'Equipment',
    date: session.data.startDate,
    duration: session.data.duration,
    total: session.data.totalAmount
  });
}

async function handleConfirmation(phone, text, session) {
  const t = text.trim().toLowerCase();

  const isConfirm = ['confirm', '1', 'yes', 'होय', 'हो', 'निश्चित', 'कन्फर्म', 'haan', 'ok', 'okay'].includes(t);
  const isCancel = ['cancel', '0', 'no', 'नाही', 'रद्द', 'रद्द करा', 'nahi', 'reject'].includes(t);

  if (isConfirm) {
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
    const ownerLang = (equip.owners && equip.owners.language) || session.language || 'mr';

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

    session.state = 'CUSTOMER_MENU';

    // 4. Return Customer Confirmation with Payment Link
    const confirmText = getText(session.language, 'booking_confirmed', { ref: booking.booking_ref });
    
    let paymentPrompt = '';
    if (session.language === 'mr') {
      paymentPrompt = `💳 *भाडे रक्कम (₹${session.data.totalAmount}) UPI द्वारे भरा:*\n${payLink}\n\n_PhonePe, Google Pay, किंवा Paytm द्वारे त्वरित पेमेंट करा._`;
    } else if (session.language === 'hi') {
      paymentPrompt = `💳 *किराया राशि (₹${session.data.totalAmount}) UPI द्वारा भुगतान करें:*\n${payLink}\n\n_PhonePe, Google Pay, या Paytm द्वारा तुरंत भुगतान करें._`;
    } else {
      paymentPrompt = `💳 *Pay Rental Total (₹${session.data.totalAmount}) via UPI:*\n${payLink}\n\n_Instant payment with PhonePe, Google Pay, Paytm, or BHIM UPI._`;
    }

    return `${confirmText}\n\n${paymentPrompt}`;
  } else if (isCancel) {
    session.state = 'CUSTOMER_MENU';
    return getText(session.language, 'booking_cancelled');
  }

  return getText(session.language, 'booking_summary', {
    model: (session.data.selectedEquipment && session.data.selectedEquipment.model) || 'Equipment',
    date: session.data.startDate,
    duration: session.data.duration,
    total: session.data.totalAmount
  });
}

module.exports = { handleEquipmentSelect, handleDateInput, handleConfirmation };
