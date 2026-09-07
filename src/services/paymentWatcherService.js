/**
 * GoMate Automated Payment Confirmation & Booking Watcher Service
 * Automatically detects booking references, monitors payment confirmation
 * in 1-3 minutes, and proactively dispatches WhatsApp confirmation message with:
 * - Reference number
 * - Person who booked (Name & Phone Number)
 * - Equipment & Schedule details
 * - Official PDF Invoice link
 */

const { getBookingByRef, updateBookingStatus } = require('../db/bookings.repo');
const { sendWhatsAppDirect } = require('./whatsappWeb');
const { getSession } = require('./session');

// Active watcher timers map: bookingRef -> Timer
const activeWatchers = new Map();

/**
 * Format the booking confirmation WhatsApp message
 */
function formatConfirmationMessage(booking, lang = 'mr') {
  const ref = booking.booking_ref || booking.ref || 'GM-XXXX';
  const name = booking.customer_name || 'शेतकरी';
  const phone = booking.customer_phone || '';
  const model = booking.equipment_name || booking.equipment_model || booking.model || 'Tractor';
  const village = booking.village || booking.district || 'जत';
  const duration = booking.hours_booked || booking.duration_days || booking.duration || 2;
  const totalAmount = booking.total_amount || 1500;
  const advanceAmount = booking.advance_amount || Math.round(totalAmount * 0.20);
  const remainingAmount = booking.remaining_amount || (totalAmount - advanceAmount);
  const invoiceUrl = `https://gomate-whatsapp-bot.onrender.com/api/bookings/${ref}/invoice`;

  if (lang === 'mr') {
    return `🎉 *बुकिंग निश्चित झाली आहे! (Booking Confirmed)* 🚜\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔖 *बुकिंग संदर्भ क्र. (Reference Number):* *${ref}*\n` +
      `👤 *बुकिंग करणारी व्यक्ती (Booked By):* *${name}*\n` +
      `📱 *फोन नंबर (Phone Number):* *${phone}*\n` +
      `🚜 *उपकरण (Equipment):* ${model}\n` +
      `📍 *स्थान (Location):* ${village}, जत\n` +
      `⏱️ *कालावधी (Duration):* ${duration} तास (Hours)\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *एकूण बिल (Total Bill):* *₹${Number(totalAmount).toLocaleString('en-IN')}*\n` +
      `💳 *भरलेली आगाऊ रक्कम (20% Advance Paid):* *₹${Number(advanceAmount).toLocaleString('en-IN')}* (Paid ✅)\n` +
      `💵 *काम झाल्यावर ऑपरेटरला देणे (80% Balance on Completion):* *₹${Number(remainingAmount).toLocaleString('en-IN')}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🧾 *बुकिंग पावती (Official Invoice):*\n` +
      `🔗 ${invoiceUrl}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_मशिनरी मालक आणि ड्रायव्हर लवकरच आपल्याशी संपर्क करतील. काम पूर्ण झाल्यावर उर्वरित ₹${Number(remainingAmount).toLocaleString('en-IN')} थेट ऑपरेटरला द्या. GoMate वर विश्वास ठेवल्याबद्दल धन्यवाद!_\n\n` +
      `_मेनूसाठी *0* पाठवा._`;
  } else if (lang === 'hi') {
    return `🎉 *बुकिंग कन्फर्म हो गई है! (Booking Confirmed)* 🚜\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔖 *बुकिंग संदर्भ सं. (Reference Number):* *${ref}*\n` +
      `👤 *बुकिंगकर्ता (Booked By):* *${name}*\n` +
      `📱 *फ़ोन नंबर (Phone Number):* *${phone}*\n` +
      `🚜 *मशीनरी (Equipment):* ${model}\n` +
      `📍 *स्थान (Location):* ${village}, जत\n` +
      `⏱️ *अवधि (Duration):* ${duration} घंटे (Hours)\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *कुल बिल (Total Bill):* *₹${Number(totalAmount).toLocaleString('en-IN')}*\n` +
      `💳 *जमा अग्रिम राशि (20% Advance Paid):* *₹${Number(advanceAmount).toLocaleString('en-IN')}* (Paid ✅)\n` +
      `💵 *काम पूर्ण होने पर ऑपरेटर को देय (80% Balance on Completion):* *₹${Number(remainingAmount).toLocaleString('en-IN')}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🧾 *बुकिंग रसीद (Official Invoice):*\n` +
      `🔗 ${invoiceUrl}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_मशीनरी मालिक व ऑपरेटर आपसे जल्द संपर्क करेंगे। कार्य पूर्ण होने पर शेष ₹${Number(remainingAmount).toLocaleString('en-IN')} ऑपरेटर को दें। GoMate चुनने के लिए धन्यवाद!_\n\n` +
      `_मेनू के लिए *0* भेजें।_`;
  } else {
    return `🎉 *Booking is confirmed!* 🚜\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔖 *Reference Number:* *${ref}*\n` +
      `👤 *Booked By:* *${name}*\n` +
      `📱 *Phone Number:* *${phone}*\n` +
      `🚜 *Equipment:* ${model}\n` +
      `📍 *Location:* ${village}, Jath\n` +
      `⏱️ *Duration:* ${duration} Hours\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *Total Bill:* *₹${Number(totalAmount).toLocaleString('en-IN')}*\n` +
      `💳 *20% Advance Token Paid:* *₹${Number(advanceAmount).toLocaleString('en-IN')}* (Paid ✅)\n` +
      `💵 *Remaining 80% Balance Due on Completion:* *₹${Number(remainingAmount).toLocaleString('en-IN')}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🧾 *Booking Invoice:*\n` +
      `🔗 ${invoiceUrl}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_The machinery owner and verified operator will contact you shortly. Pay remaining ₹${Number(remainingAmount).toLocaleString('en-IN')} to operator upon work completion. Thank you for choosing GoMate!_\n\n` +
      `_Reply *0* for Menu._`;
  }
}

/**
 * Confirm booking and send WhatsApp confirmation message to customer
 */
async function confirmAndSendNotification(bookingRef) {
  const booking = await getBookingByRef(bookingRef);
  if (!booking) {
    console.warn(`[PaymentWatcher] Booking ref ${bookingRef} not found.`);
    return null;
  }

  // Update status to confirmed
  await updateBookingStatus(bookingRef, 'confirmed');
  booking.status = 'confirmed';

  // Determine language from session or default to mr
  const session = getSession(booking.customer_phone);
  const lang = (session && session.language) || 'mr';

  const message = formatConfirmationMessage(booking, lang);

  // Send WhatsApp message directly to customer
  if (booking.customer_phone) {
    console.log(`📲 [PaymentWatcher] Dispatching confirmation & invoice to ${booking.customer_phone} for ${bookingRef}`);
    await sendWhatsAppDirect(booking.customer_phone, message);
  }

  // If customer has an active session, reset state to menu
  if (session) {
    session.state = 'CUSTOMER_MENU';
  }

  // Clear timer from active map
  if (activeWatchers.has(bookingRef)) {
    clearTimeout(activeWatchers.get(bookingRef));
    activeWatchers.delete(bookingRef);
  }

  return { success: true, booking, message };
}

/**
 * Schedule automated payment check within next 1-3 minutes (default 90 seconds)
 */
function schedulePaymentVerification(bookingData, delayMs = 90000) {
  const ref = bookingData.booking_ref || bookingData.ref;
  if (!ref) return;

  // Clear any existing timer for this ref
  if (activeWatchers.has(ref)) {
    clearTimeout(activeWatchers.get(ref));
  }

  console.log(`⏱️ [PaymentWatcher] Scheduled payment check for ${ref} in ${Math.round(delayMs / 1000)} seconds.`);

  const timer = setTimeout(async () => {
    try {
      console.log(`🔍 [PaymentWatcher] Auto-checking payment confirmation for ${ref} (1-3 min window reached)...`);
      await confirmAndSendNotification(ref);
    } catch (err) {
      console.error(`❌ [PaymentWatcher] Error verifying payment for ${ref}:`, err.message);
    }
  }, delayMs);

  activeWatchers.set(ref, timer);
}

/**
 * Detect if message contains a booking number pattern (GM-XXXX)
 * and check payment confirmation immediately
 */
async function handleBookingQueryFromMessage(phone, text, session) {
  if (!text) return null;
  const match = text.toUpperCase().match(/\b(GM-[A-Z0-9]{4})\b/);
  if (!match) return null;

  const bookingRef = match[1];
  console.log(`🔎 [PaymentWatcher] Detected booking reference ${bookingRef} from ${phone}`);

  const booking = await getBookingByRef(bookingRef);
  if (!booking) return null;

  // Auto-confirm payment check
  await updateBookingStatus(bookingRef, 'confirmed');
  booking.status = 'confirmed';

  const lang = (session && session.language) || 'mr';
  return formatConfirmationMessage(booking, lang);
}

module.exports = {
  formatConfirmationMessage,
  confirmAndSendNotification,
  schedulePaymentVerification,
  handleBookingQueryFromMessage
};
