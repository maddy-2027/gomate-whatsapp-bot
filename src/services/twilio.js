/**
 * twilio.js — DEPRECATED
 * GoMate uses whatsapp-web.js (QR scan) instead of Twilio.
 * This shim re-exports sendWhatsAppDirect so any legacy imports don't break.
 */
const { sendWhatsAppDirect } = require('./whatsappWeb');

async function sendWhatsApp(to, body) {
  return await sendWhatsAppDirect(to, body);
}

module.exports = { sendWhatsApp };
