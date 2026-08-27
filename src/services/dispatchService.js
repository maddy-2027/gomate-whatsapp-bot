const { sendWhatsAppDirect } = require('./whatsappWeb');
const { updateBookingStatus, getBookingByRef } = require('../db/bookings.repo');
const { getAllOwners } = require('../db/owners.repo');
const { findJathVillage } = require('../data/jathVillages');

// Active pending dispatch requests: ownerPhone -> dispatchSession
const pendingDispatches = new Map();

// Reverse lookup: bookingRef -> ownerPhone
const bookingToOwner = new Map();

/**
 * 15-Minute SLA in milliseconds
 */
const SLA_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * Find candidate owners in Jath cluster
 */
async function getCandidateOwners(villageName) {
  const allOwners = await getAllOwners();
  if (!allOwners || allOwners.length === 0) return [];

  // Filter or sort by proximity to village
  const vInfo = findJathVillage(villageName);
  const targetVillage = (vInfo ? vInfo.name : villageName || '').toLowerCase();

  return [...allOwners].sort((a, b) => {
    const aDistrict = (a.district || '').toLowerCase();
    const bDistrict = (b.district || '').toLowerCase();
    const aMatch = aDistrict.includes(targetVillage) ? 1 : 0;
    const bMatch = bDistrict.includes(targetVillage) ? 1 : 0;
    return bMatch - aMatch;
  });
}

/**
 * Send interactive dispatch alert to equipment owner
 */
async function sendOwnerDispatchAlert(bookingData) {
  const {
    bookingRef,
    farmerPhone,
    farmerName,
    equipModel,
    village,
    startDate,
    startTime,
    duration,
    rentalAmount,
    totalAmount
  } = bookingData;

  const candidateOwners = await getCandidateOwners(village);
  const primaryOwner = candidateOwners[0] || {
    phone: process.env.ADMIN_WHATSAPP_NUMBER || '+919822012345',
    name: 'Rajesh Patil (Jat Hub)'
  };

  const ownerPhone = primaryOwner.phone;
  const ownerPayout = rentalAmount || (totalAmount ? totalAmount - 49 : 3000);

  const alertText = `🚨 *GoMate नवीन मशिनरी मागणी (New Booking Request)!* 🚜
━━━━━━━━━━━━━━━━━━━━
🔖 संदर्भ: *${bookingRef}*
🚜 उपकरण: *${equipModel}*
📍 कार्यक्षेत्र/गाव: *${village || 'जत तालुका'}*
📅 तारीख: *${startDate}*
⏰ वेळ: *${startTime || '08:00 AM'}*
⏱️ कालावधी: *${duration} दिवस*
💰 तुमची निव्वळ कमाई: *₹${ownerPayout.toLocaleString('en-IN')}* (थेट रोख/UPI)
👤 शेतकरी/ग्राहक: *${farmerName || 'शेतकरी'}*
━━━━━━━━━━━━━━━━━━━━
⚡ *पुढील १५ मिनिटांत उत्तर द्या:*
👉 *स्वीकारण्यासाठी '1' (किंवा YES) पाठवा*
👉 *नकार देण्यासाठी '2' (किंवा NO) पाठवा*

_(नकार दिल्यास ही ऑर्डर जत क्लस्टरमधील दुसऱ्या मालकाकडे पाठवली जाईल)_`;

  // Set timeout for 15-min SLA
  const timeoutTimer = setTimeout(() => {
    handleDispatchTimeout(ownerPhone, bookingRef);
  }, SLA_TIMEOUT_MS);

  const session = {
    bookingRef,
    farmerPhone,
    farmerName: farmerName || 'Farmer',
    equipModel,
    village,
    startDate,
    startTime: startTime || '08:00 AM',
    duration,
    ownerPayout,
    totalAmount: totalAmount || ownerPayout + 49,
    ownerPhone,
    ownerName: primaryOwner.name,
    candidateOwners,
    currentCandidateIndex: 0,
    expiresAt: Date.now() + SLA_TIMEOUT_MS,
    timeoutTimer
  };

  pendingDispatches.set(ownerPhone, session);
  bookingToOwner.set(bookingRef, ownerPhone);

  try {
    await sendWhatsAppDirect(ownerPhone, alertText);
    console.log(`📲 [Dispatch] Alert sent to owner ${ownerPhone} for booking ${bookingRef}`);
  } catch (err) {
    console.warn(`⚠️ [Dispatch] Failed to send alert to ${ownerPhone}:`, err.message);
  }

  return session;
}

/**
 * Handle Owner Response (Accept / Reject)
 */
async function handleOwnerResponse(ownerPhone, text) {
  const session = pendingDispatches.get(ownerPhone);
  if (!session) return null;

  const t = (text || '').trim().toLowerCase();
  const isAccept = ['1', 'yes', 'ho', 'accept', 'हो', 'स्वीकार', 'स्वीकारा', 'मंजूर', 'confirm', 'ok'].includes(t);
  const isReject = ['2', 'no', 'nahi', 'reject', 'नाही', 'नकार', 'रद्द', 'व्यस्त'].includes(t);

  if (!isAccept && !isReject) {
    return `⚠️ कृपया योग्य पर्याय निवडा:
👉 *स्वीकारण्यासाठी '1'* पाठवा
👉 *नकार देण्यासाठी '2'* पाठवा`;
  }

  // Clear timeout timer
  if (session.timeoutTimer) {
    clearTimeout(session.timeoutTimer);
  }

  pendingDispatches.delete(ownerPhone);
  bookingToOwner.delete(session.bookingRef);

  if (isAccept) {
    // 1. Update Booking in Database
    await updateBookingStatus(session.bookingRef, 'confirmed');

    // 2. Notify Farmer on WhatsApp
    const farmerMsg = `🎉 *आनंदाची बातमी! तुमच्या उपकरणाची बुकिंग कन्फर्म झाली आहे!* 🚜
━━━━━━━━━━━━━━━━━━━━
🔖 संदर्भ: *${session.bookingRef}*
🚜 उपकरण: *${session.equipModel}*
👨‍🌾 मशिनरी मालक: *${session.ownerName}*
📞 मालकाचा संपर्क: *${session.ownerPhone}*
📅 पोहोचण्याची वेळ: *${session.startDate}, ${session.startTime}*
📍 तुमचे गाव: *${session.village}*
⏱️ कालावधी: *${session.duration} दिवस*
💰 एकूण देय रक्कम: *₹${session.totalAmount.toLocaleString('en-IN')}* (कामाच्या वेळी थेट द्या)
━━━━━━━━━━━━━━━━━━━━
✅ मालक स्वतः ठरलेल्या वेळेत ड्रायव्हरसह उपकरण तुमच्या शेतात पोहोचवतील!
_काही मदत हवी असल्यास थेट कॉल करा किंवा '0' पाठवा._`;

    try {
      await sendWhatsAppDirect(session.farmerPhone, farmerMsg);
    } catch (err) {
      console.warn(`[Dispatch] Could not notify farmer ${session.farmerPhone}:`, err.message);
    }

    // 3. Send detailed work order to Owner
    return `✅ *बुकिंग यशस्वीरित्या स्वीकारले (Booking Accepted)!* 🚜
━━━━━━━━━━━━━━━━━━━━
🔖 संदर्भ: *${session.bookingRef}*
👤 ग्राहक नाव: *${session.farmerName}*
📞 ग्राहक फोन: *${session.farmerPhone}*
📍 कार्यक्षेत्र: *${session.village} (जत तालुका)*
📅 शेड्युल वेळ: *${session.startDate}, सकाळी ${session.startTime}*
⏱️ कालावधी: *${session.duration} दिवस*
💰 एकूण भाडे: *₹${session.ownerPayout.toLocaleString('en-IN')}* (थेट ग्राहकाकडून मिळवा)
━━━━━━━━━━━━━━━━━━━━
👉 *पुढील पायरी:*
कृपया ग्राहकाशी (${session.farmerPhone}) फोनवर बोलून नेमकी शेताची वाट समजून घ्या आणि ठरलेल्या वेळेत पोहोचवा. धन्यवाद!`;
  } else {
    // Owner Rejected -> Cascade
    console.log(`❌ Owner ${ownerPhone} rejected booking ${session.bookingRef}`);
    cascadeToNextOwner(session);

    return `👍 *बुकिंग नाकारले आहे (Declined).*
नोंद घेतली आहे. GoMate वरून तुमच्या भागातील पुढील बुकिंग लवकरच पाठवले जाईल. धन्यवाद!`;
  }
}

/**
 * Handle 15-min SLA Timeout
 */
async function handleDispatchTimeout(ownerPhone, bookingRef) {
  const session = pendingDispatches.get(ownerPhone);
  if (!session) return;

  console.log(`⏱️ [Dispatch] SLA Timeout (15 mins) for owner ${ownerPhone} on booking ${bookingRef}`);
  pendingDispatches.delete(ownerPhone);
  bookingToOwner.delete(bookingRef);

  cascadeToNextOwner(session);
}

/**
 * Cascade to Next Available Owner or Ops
 */
async function cascadeToNextOwner(session) {
  session.currentCandidateIndex += 1;
  const nextOwner = session.candidateOwners[session.currentCandidateIndex];

  if (nextOwner && nextOwner.phone !== session.ownerPhone) {
    console.log(`🔄 [Dispatch] Cascading booking ${session.bookingRef} to secondary owner ${nextOwner.phone}`);
    const nextSession = {
      ...session,
      ownerPhone: nextOwner.phone,
      ownerName: nextOwner.name,
      expiresAt: Date.now() + SLA_TIMEOUT_MS
    };

    nextSession.timeoutTimer = setTimeout(() => {
      handleDispatchTimeout(nextOwner.phone, session.bookingRef);
    }, SLA_TIMEOUT_MS);

    pendingDispatches.set(nextOwner.phone, nextSession);
    bookingToOwner.set(session.bookingRef, nextOwner.phone);

    const alertText = `🚨 *GoMate तातडीची मागणी (Urgent Machinery Request)!* 🚜
━━━━━━━━━━━━━━━━━━━━
🔖 संदर्भ: *${session.bookingRef}*
🚜 उपकरण: *${session.equipModel}*
📍 कार्यक्षेत्र/गाव: *${session.village}*
📅 तारीख: *${session.startDate}*
⏰ वेळ: *${session.startTime}*
⏱️ कालावधी: *${session.duration} दिवस*
💰 तुमची निव्वळ कमाई: *₹${session.ownerPayout.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━
⚡ *पुढील १५ मिनिटांत उत्तर द्या:*
👉 *स्वीकारण्यासाठी '1'* पाठवा
👉 *नकार देण्यासाठी '2'* पाठवा`;

    sendWhatsAppDirect(nextOwner.phone, alertText).catch(() => {});
  } else {
    // All candidates exhausted -> Alert Admin / Ops Concierge
    console.log(`⚠️ [Dispatch] All owners busy for ${session.bookingRef}. Notifying Ops.`);
    const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || '+919822012345';
    sendWhatsAppDirect(adminPhone, `⚠️ *GoMate Alert:* No owner accepted booking ${session.bookingRef} in ${session.village} for ${session.equipModel}. Please call farmer ${session.farmerPhone} manually.`).catch(() => {});

    // Notify farmer reassuringly
    const fallbackMsg = `ℹ️ *GoMate अपडेट:* आपल्या गावातील (${session.village}) मशिनरी मालक सध्या कामात व्यस्त आहेत. आमचे प्रतिनिधी ५ मिनिटांत जवळच्या दुसऱ्या मालकाशी संपर्क साधून आपल्याला थेट कॉल करतील!`;
    sendWhatsAppDirect(session.farmerPhone, fallbackMsg).catch(() => {});
  }
}

/**
 * Check if a phone has a pending dispatch
 */
function hasPendingDispatch(phone) {
  return pendingDispatches.has(phone);
}

module.exports = {
  sendOwnerDispatchAlert,
  handleOwnerResponse,
  hasPendingDispatch,
  pendingDispatches
};

