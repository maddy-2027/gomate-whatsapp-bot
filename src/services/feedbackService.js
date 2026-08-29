/**
 * GoMate Automated WhatsApp Feedback & Star Ratings Service
 * Dispatches post-job feedback requests to farmers and updates owner reputation scores.
 */

const { sendWhatsAppDirect } = require('./whatsappWeb');
const { addReview } = require('../db/reviews.repo');

// Map of pending feedback sessions by farmer phone
const pendingFeedbackMap = new Map();

/**
 * Trigger a post-job WhatsApp feedback request to the farmer
 * @param {object} booking - The completed booking record
 */
async function triggerFeedbackRequest(booking) {
  const customerPhone = booking.customer_phone;
  if (!customerPhone) return null;

  const equipmentName = booking.equipment_name || booking.equipment_model || 'ट्रॅक्टर व अवजारे';
  const ownerName = booking.owner_name || 'राजेश पाटील';
  const bookingRef = booking.booking_ref || 'GM-XXXX';

  pendingFeedbackMap.set(customerPhone, {
    bookingRef,
    ownerPhone: booking.owner_phone || '+919822012345',
    ownerName,
    equipmentName,
    customerName: booking.customer_name || 'शेतकरी मित्र',
    village: booking.village || 'Jath',
    triggeredAt: Date.now()
  });

  const feedbackPromptMr = `🌾 *GoMate सेवा अभिप्राय (Feedback)* ⭐
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
नमस्कार ${booking.customer_name || 'शेतकरी बंधूंनो'},
आपले **${equipmentName}** चे काम यशस्वीरित्या पूर्ण झाले आहे! (Ref: *${bookingRef}*)

मशिनरी मालक **${ownerName}** यांच्या सेवेचा आपला अनुभव कसा होता?
कृपया खालीलपैकी १ ते ५ स्टार निवडा:

🌟 *5* - अतिशय उत्कृष्ट (Excellent)
⭐ *4* - चांगले काम (Good)
⭐ *3* - समाधानकारक (Average)
⭐ *2* - सुधारणा हवी (Needs Improvement)
⚠️ *1* - असमाधानकारक (Poor)

👉 *फक्त ५, ४, ३, २ किंवा १ पाठवून रेटिंग द्या.*`;

  try {
    await sendWhatsAppDirect(customerPhone, feedbackPromptMr);
  } catch (err) {
    console.warn('⚠️ [FeedbackService] Notice sending WhatsApp feedback request:', err.message);
  }

  return {
    success: true,
    customerPhone,
    bookingRef,
    prompt: feedbackPromptMr
  };
}

/**
 * Check if a phone has a pending feedback request
 */
function hasPendingFeedback(phone) {
  return pendingFeedbackMap.has(phone);
}

/**
 * Process a farmer's rating response
 */
async function handleFeedbackResponse(phone, text, session = {}) {
  const pending = pendingFeedbackMap.get(phone);
  if (!pending) return null;

  const raw = String(text).trim().toLowerCase();
  let rating = 5;

  if (raw.includes('5') || raw.includes('५') || raw.includes('उत्कृष्ट') || raw.includes('excellent') || raw.includes('खूप छान')) {
    rating = 5;
  } else if (raw.includes('4') || raw.includes('४') || raw.includes('चांगले') || raw.includes('good') || raw.includes('छान')) {
    rating = 4;
  } else if (raw.includes('3') || raw.includes('३') || raw.includes('समाधानकारक') || raw.includes('average')) {
    rating = 3;
  } else if (raw.includes('2') || raw.includes('२')) {
    rating = 2;
  } else if (raw.includes('1') || raw.includes('१') || raw.includes('वाईट') || raw.includes('poor')) {
    rating = 1;
  } else {
    // If not a digit/rating, return standard prompt reminder
    return `⭐ कृपया मशिनरी सेवेसाठी *५, ४, ३, २ किंवा १* पाठवून आपला अभिप्राय नोंदवा.`;
  }

  // Extract optional comment if farmer wrote more than just a number
  let comment = raw.length > 2 ? text.trim() : (rating >= 4 ? 'वेळेवर व समाधानकारक काम.' : 'सेवा पूर्ण झाली.');

  // Save to Reviews Repository
  const result = await addReview({
    booking_ref: pending.bookingRef,
    owner_phone: pending.ownerPhone,
    customer_phone: phone,
    customer_name: pending.customerName,
    village: pending.village,
    equipment_name: pending.equipmentName,
    rating,
    comment
  });

  // Clear pending state
  pendingFeedbackMap.delete(phone);
  if (session) {
    session.state = 'CUSTOMER_MENU';
  }

  const starIcons = '⭐'.repeat(rating);

  // Notify machinery owner of new review
  const ownerAlertMr = `🌟 *नवीन ${rating}-स्टार रेटिंग प्राप्त!* ${starIcons}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
शेतकरी **${pending.customerName} (${pending.village})** यांनी आपल्या **${pending.equipmentName}** सेवेला **${rating}/५ स्टार** रेटिंग दिले आहे!

💬 _"${comment}"_
📊 *आपले चालू रेटिंग:* ⭐ ${result.ownerSummary.averageRating} (${result.ownerSummary.totalReviews} अभिप्राय)`;

  try {
    await sendWhatsAppDirect(pending.ownerPhone, ownerAlertMr);
  } catch (err) {
    // Non-blocking
  }

  return `🙏 *धन्यवाद ${pending.customerName}!*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
तुमचा *${rating}-स्टार* (${starIcons}) अभिप्राय यशस्वीरित्या नोंदवला गेला आहे.

GoMate मुळे स्थानिक शेतकरी व मशिनरी मालकांना पारदर्शक सेवा मिळते.
नवीन अवजारे शोधण्यासाठी किंवा बुकिंगसाठी कधीही *'1'* किंवा *'मेनू'* पाठवा! 🚜🌾`;
}

module.exports = {
  triggerFeedbackRequest,
  hasPendingFeedback,
  handleFeedbackResponse
};
