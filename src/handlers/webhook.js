const { getSession } = require('../services/session');
const { routeMessage } = require('./router');
const { sendWhatsApp } = require('../services/twilio');

/**
 * Webhook handler for Twilio WhatsApp incoming messages and HTTP simulator.
 */
module.exports = async (req, res) => {
  // Acknowledge Twilio quickly with 200 OK
  res.status(200).send('<Response></Response>');

  let from = req.body.From || req.body.phone || '';
  let body = req.body.Body || req.body.message || '';

  // Extract GPS Location from Twilio WhatsApp location pins if shared
  if (req.body.Latitude && req.body.Longitude) {
    body = `GPS_LOCATION:${req.body.Latitude},${req.body.Longitude}`;
  }

  // Clean phone number (e.g. "whatsapp:+919876543210" -> "+919876543210")
  const rawPhone = from.replace('whatsapp:', '').trim();
  body = (body || '').trim();

  console.log(`📱 [Twilio Webhook] Message from ${rawPhone}: "${body}"`);
  if (!rawPhone || !body) return;

  try {
    const session = getSession(rawPhone);
    const replyText = await routeMessage(rawPhone, body, session);
    if (replyText) {
      console.log(`💬 [Twilio Webhook] Sending reply to ${from}: "${replyText.substring(0, 60)}..."`);
      await sendWhatsApp(from, replyText);
    }
  } catch (err) {
    console.error('❌ [Twilio Webhook] Processing error:', err);
  }
};
