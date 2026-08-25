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
 * Parses natural strings like:
 * - "Tomorrow for 2 days"
 * - "उद्या 2 दिवस"
 * - "5 tractors for 3 days in Pune"
 * - "20/08/2026 3"
 * - "3 days"
 * 
 * IMMEDIATELY creates the booking and generates the payment link so the user is never blocked!
 */
async function handleDateInput(phone, text, session) {
  const t = text.trim();
  const lower = t.toLowerCase();

  let startDate = 'Today';
  let duration = 1;
  let quantity = 1;

  // Extract quantity if mentioned (e.g. "5 tractors", "2 JCB")
  const qtyMatch = t.match(/\b([1-9][0-9]?)\s*(tractor|tractors|ट्रॅक्टर|jcb|जेसीबी|truck|trucks)\b/i);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1]) || 1;
  }

  // Extract duration (e.g. "for 3 days", "3 दिवस", "3 days", "3 दिन")
  const durMatch = t.match(/\b([1-9][0-9]?)\s*(day|days|दिवस|दिन|वार)\b/i);
  const numMatch = t.match(/\b([1-9][0-9]?)\b/);
  
  if (durMatch) {
    duration = parseInt(durMatch[1]);
  } else if (numMatch) {
    duration = parseInt(numMatch[1]) || 1;
  }

  // Parse start date
  if (lower.includes('उद्या') || lower.includes('कल') || lower.includes('tomorrow')) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    startDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } else if (lower.includes('आज') || lower.includes('today')) {
    const d = new Date();
    startDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } else {
    const parts = t.split(/[\s,]+/);
    if (parts.length >= 1 && parts[0].includes('/')) {
      startDate = parts[0];
    } else {
      const d = new Date();
      startDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
  }

  session.data.startDate = startDate;
  session.data.duration = duration;
  session.data.quantity = quantity;

  const equip = session.data.selectedEquipment || {
    id: 101,
    model: 'Mahindra 575 DI (45 HP)',
    price_per_day: 1500,
    district: session.data.location || 'Pune'
  };

  const pricePerDay = equip.price_per_day || 1500;
  const totalAmount = pricePerDay * duration * quantity;
  session.data.totalAmount = totalAmount;

  // ── 1. Create Pending Booking in DB immediately ───────────────────────────
  let booking;
  const customerName = session.customerName || session.data.customerName || 'Customer';
  try {
    booking = await createBooking({
      customer_phone: phone,
      customer_name: customerName,
      equipment_id: equip.id || 101,
      start_date: startDate,
      duration_days: duration,
      total_amount: totalAmount,
      status: 'pending'
    });
  } catch (err) {
    booking = { booking_ref: 'GM-' + Math.random().toString(36).substring(2, 6).toUpperCase() };
  }
  session.data.bookingRef = booking.booking_ref;

  // ── 2. Generate Real / Demo UPI Payment Link ──────────────────────────────
  const payObj = await createBookingPaymentLink(
    phone,
    totalAmount,
    booking.booking_ref,
    equip.model || 'Equipment'
  );
  const payLink = (payObj && payObj.short_url) ? payObj.short_url : 'https://rzp.io/l/gomate-booking';
  session.data.payLink = payLink;

  // ── 3. Notify Owner in the background ────────────────────────────────────
  const ownerPhone = (equip.owners && equip.owners.phone) || equip.owner_phone || process.env.ADMIN_WHATSAPP_NUMBER || '+919123456789';
  const ownerLang = (equip.owners && equip.owners.language) || 'mr';
  const alertMsg = getText(ownerLang, 'owner_new_booking_notification', {
    ref: booking.booking_ref,
    customerPhone: customerName !== 'Customer' ? `${customerName} (${phone})` : phone,
    model: `${quantity > 1 ? `${quantity}x ` : ''}${equip.model}`,
    date: startDate,
    duration: duration,
    total: totalAmount
  });
  sendWhatsAppDirect(ownerPhone, alertMsg).catch(() => {});

  // ── 4. Move state to BOOKING_CONFIRM (allows replying 'pay', 'confirm', 'cancel')
  session.state = 'BOOKING_CONFIRM';

  // ── 5. Format localized response with instant Payment Link ────────────────
  const modelText = quantity > 1 ? `${quantity}x ${equip.model}` : equip.model;
  
  if (session.language === 'mr') {
    return `*बुकिंग तपशील व पेमेंट सारांश*
━━━━━━━━━━━━━━━━━━━━
उपकरण: *${modelText}*
स्थान: *${session.data.location || 'पुणे'}*
तारीख: *${startDate}*
कालावधी: *${duration} दिवस*
एकूण रक्कम: *₹${totalAmount.toLocaleString('en-IN')}*
संदर्भ क्र: *${booking.booking_ref}*
━━━━━━━━━━━━━━━━━━━━

*पेमेंट करण्यासाठी खालील लिंकवर क्लिक करा:*
👉 ${payLink}

_PhonePe, Google Pay, Paytm, किंवा BHIM UPI द्वारे त्वरित पेमेंट करा._
_(रद्द करण्यासाठी *0* किंवा *CANCEL* पाठवा)_`;
  } else if (session.language === 'hi') {
    return `*बुकिंग विवरण व पेमेंट सारांश*
━━━━━━━━━━━━━━━━━━━━
उपकरण: *${modelText}*
स्थान: *${session.data.location || 'पुणे'}*
तिथि: *${startDate}*
अवधि: *${duration} दिन*
कुल राशि: *₹${totalAmount.toLocaleString('en-IN')}*
संदर्भ संख्या: *${booking.booking_ref}*
━━━━━━━━━━━━━━━━━━━━

*भुगतान करने के लिए नीचे दिए गए लिंक पर क्लिक करें:*
👉 ${payLink}

_PhonePe, Google Pay, Paytm, या BHIM UPI द्वारा तुरंत भुगतान करें।_
_(रद्द करने के लिए *0* या *CANCEL* भेजें)_`;
  } else {
    return `*Booking Summary & Payment Link*
━━━━━━━━━━━━━━━━━━━━
Equipment: *${modelText}*
Location: *${session.data.location || 'Pune'}*
Date: *${startDate}*
Duration: *${duration} days*
Total Amount: *₹${totalAmount.toLocaleString('en-IN')}*
Reference: *${booking.booking_ref}*
━━━━━━━━━━━━━━━━━━━━

*Proceed to Pay & Confirm Booking:*
👉 ${payLink}

_Pay securely using PhonePe, Google Pay, Paytm, or Cards._
_(Reply *0* or *CANCEL* to cancel)_`;
  }
}

/**
 * Handle confirmation, payment follow-up, or cancellation
 */
async function handleConfirmation(phone, text, session) {
  const t = (text || '').trim().toLowerCase();

  const isCancel = ['cancel', '0', 'no', 'नाही', 'रद्द', 'रद्द करा', 'nahi', 'reject'].includes(t);
  if (isCancel) {
    session.state = 'CUSTOMER_MENU';
    return getText(session.language || 'mr', 'booking_cancelled');
  }

  return await createInstantBookingWithProcess(phone, session);
}

/**
 * Instant Booking Creator with full 4-step process explanation & UPI payment link
 */
async function createInstantBookingWithProcess(phone, session) {
  const quote = (session.data && session.data.lastQuote) || {};
  const machineName = quote.model || (session.data && session.data.selectedEquipment && session.data.selectedEquipment.model) || 'Mahindra 575 DI Tractor';
  const duration = quote.days || (session.data && session.data.duration) || 1;
  const quantity = quote.qty || (session.data && session.data.quantity) || 1;
  const totalAmount = quote.total || (session.data && session.data.totalAmount) || (1500 * duration * quantity);
  const location = (session.data && session.data.location) || 'Pune';
  const customerName = session.customerName || (session.data && session.data.customerName) || 'Customer';

  // 1. Generate instant booking reference (0ms latency)
  const bookingRef = 'GM-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const booking = { booking_ref: bookingRef };

  // Save to database asynchronously in background without delaying WhatsApp reply
  createBooking({
    customer_phone: phone,
    customer_name: customerName,
    equipment_id: 101,
    start_date: 'Tomorrow',
    duration_days: duration,
    total_amount: totalAmount,
    status: 'pending'
  }).catch(() => {});

  if (!session.data) session.data = {};
  session.data.bookingRef = booking.booking_ref;
  session.data.totalAmount = totalAmount;

  // 2. Generate UPI / Checkout Link
  const payObj = await createBookingPaymentLink(
    phone,
    totalAmount,
    booking.booking_ref,
    machineName
  );
  const payLink = (payObj && payObj.short_url) ? payObj.short_url : 'https://rzp.io/l/gomate-booking';
  session.data.payLink = payLink;
  session.state = 'BOOKING_CONFIRM';

  // 3. Notify owner in the background
  const ownerPhone = process.env.ADMIN_WHATSAPP_NUMBER || '+919822012345';
  sendWhatsAppDirect(ownerPhone, `🔔 *New GoMate Booking!* Ref: ${booking.booking_ref} | ${machineName} | ₹${totalAmount} | Customer: ${phone}`).catch(() => {});

  const lang = session.language || 'en';

  const platformFee = quote.platformFee || 49;
  const rentalAmount = quote.rentalTotal || (totalAmount - platformFee);

  if (lang === 'mr') {
    return `🎉 *तुमची बुकिंग तयार झाली आहे!*
━━━━━━━━━━━━━━━━━━━━
🚜 उपकरण: *${machineName}*
🔖 बुकिंग संदर्भ: *${booking.booking_ref}*
📅 कालावधी: *${duration} दिवस*
• उपकरण भाडे: *₹${rentalAmount.toLocaleString('en-IN')}*
• गोमेट सुरक्षा व सेवा फी: *₹${platformFee}*
━━━━━━━━━━━━━━━━━━━━
💰 *एकूण भरण्याची रक्कम: ₹${totalAmount.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━

👉 *पेमेंट करण्यासाठी खालील लिंकवर क्लिक करा:*
🔗 ${payLink}
_(PhonePe, Google Pay, Paytm किंवा BHIM UPI द्वारे सुरक्षित पेमेंट करा)_

📋 *बुकिंग व डिलिव्हरीची प्रक्रिया:*
1️⃣ *UPI द्वारे पेमेंट करा:* वरील लिंकवर क्लिक करून ₹${totalAmount.toLocaleString('en-IN')} चे पेमेंट पूर्ण करा.
2️⃣ *मालकाचे तपशील:* पेमेंट यशस्वी होताच तुम्हाला मशिनरी मालकाचा फोन नंबर, नाव व थेट पत्ता WhatsApp वर मिळेल.
3️⃣ *डिलिव्हरी समन्वय:* मालक स्वतः तुमच्याशी फोनवर संपर्क साधून तुमच्या शेतात/जागेवर मशिनरी वेळेत पोहोचवतील.
4️⃣ *GoMate सुरक्षा:* काम सुरू होईपर्यंत तुमची रक्कम 100% GoMate द्वारे सुरक्षित राहील.

_मुख्य मेनूसाठी *0* पाठवा किंवा रद्द करण्यासाठी *CANCEL* पाठवा._`;
  } else if (lang === 'hi') {
    return `🎉 *आपकी बुकिंग तैयार हो गई है!*
━━━━━━━━━━━━━━━━━━━━
🚜 मशीनरी: *${machineName}*
🔖 बुकिंग संदर्भ: *${booking.booking_ref}*
📅 अवधि: *${duration} दिन*
• मशीनरी किराया: *₹${rentalAmount.toLocaleString('en-IN')}*
• गोमेट सुरक्षा व सेवा शुल्क: *₹${platformFee}*
━━━━━━━━━━━━━━━━━━━━
💰 *कुल देय राशि: ₹${totalAmount.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━

👉 *भुगतान करने के लिए नीचे दिए गए लिंक पर क्लिक करें:*
🔗 ${payLink}
_(PhonePe, Google Pay, Paytm या BHIM UPI द्वारा सुरक्षित भुगतान करें)_

📋 *बुकिंग व डिलीवरी की प्रक्रिया:*
1️⃣ *UPI द्वारा भुगतान करें:* ऊपर दिए गए लिंक पर क्लिक कर ₹${totalAmount.toLocaleString('en-IN')} का भुगतान पूरा करें।
2️⃣ *मालिक का विवरण:* भुगतान पूरा होते ही आपको मशीन मालिक का फोन नंबर, नाम और पता WhatsApp पर प्राप्त होगा।
3️⃣ *डिलीवरी समन्वय:* मालिक आपसे सीधे फोन पर संपर्क कर मशीनरी आपके खेत/साइट पर पहुंचाएंगे।
4️⃣ *GoMate सुरक्षा:* काम शुरू होने तक आपका पैसा 100% GoMate द्वारा सुरक्षित रहेगा।

_मुख्य मेनू के लिए *0* भेजें या रद्द करने के लिए *CANCEL* भेजें।_`;
  } else {
    return `🎉 *Your Booking is Ready!*
━━━━━━━━━━━━━━━━━━━━
🚜 Equipment: *${machineName}*
🔖 Booking Ref: *${booking.booking_ref}*
📅 Duration: *${duration} day(s)*
• Equipment Rental: *₹${rentalAmount.toLocaleString('en-IN')}*
• GoMate Protection & Support Fee: *₹${platformFee}*
━━━━━━━━━━━━━━━━━━━━
💰 *Total Amount to Pay: ₹${totalAmount.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━

👉 *Click the secure link below to complete payment:*
🔗 ${payLink}
_(Pay instantly via PhonePe, Google Pay, Paytm, or Cards)_

📋 *How the Booking & Delivery Process Works:*
1️⃣ *Complete UPI Payment:* Click the link above to complete the payment of ₹${totalAmount.toLocaleString('en-IN')}.
2️⃣ *Owner Details Shared:* Once paid, the equipment owner's direct phone number, name & location will be sent to your WhatsApp.
3️⃣ *Delivery Coordination:* The owner will coordinate delivery directly to your farm/site on the scheduled date with driver/operator.
4️⃣ *100% GoMate Guarantee:* Your payment is fully protected by GoMate until the machinery arrives and work begins.

_Reply *0* for Main Menu or *CANCEL* to cancel._`;
  }
}

module.exports = { handleEquipmentSelect, handleDateInput, handleConfirmation, createInstantBookingWithProcess };
