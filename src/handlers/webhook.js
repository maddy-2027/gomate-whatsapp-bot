const { getSession } = require('../services/session');
const { routeMessage } = require('./router');
const twilio = require('twilio');
const { MessagingResponse } = twilio.twiml;

/**
 * Webhook handler for Twilio WhatsApp incoming messages and HTTP simulator.
 */
module.exports = async (req, res) => {
  let from = req.body.From || req.body.phone || '';
  let body = req.body.Body || req.body.message || '';

  // Extract GPS Location from Twilio WhatsApp location pins if shared
  if (req.body.Latitude && req.body.Longitude) {
    body = `GPS_LOCATION:${req.body.Latitude},${req.body.Longitude}`;
  }

  // Clean phone number (e.g. "whatsapp:+919876543210" -> "+919876543210")
  const rawPhone = from.replace('whatsapp:', '').trim();
  body = (body || '').trim();

  console.log(`📱 [Twilio Webhook] Received from ${rawPhone}: "${body}"`);

  if (!rawPhone || !body) {
    const emptyTwiml = new MessagingResponse();
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(emptyTwiml.toString());
  }

  try {
    const session = getSession(rawPhone);
    const replyText = await routeMessage(rawPhone, body, session);

    if (replyText) {
      console.log(`💬 [Twilio Webhook] Replying via TwiML to ${rawPhone}: "${replyText.substring(0, 60)}..."`);
      
      // Use official Twilio TwiML Builder
      const twiml = new MessagingResponse();
      twiml.message(replyText);

      res.writeHead(200, { 'Content-Type': 'text/xml' });
      return res.end(twiml.toString());
    } else {
      const emptyTwiml = new MessagingResponse();
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      return res.end(emptyTwiml.toString());
    }
  } catch (err) {
    console.error('❌ [Twilio Webhook] Processing error:', err);
    const emptyTwiml = new MessagingResponse();
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(emptyTwiml.toString());
  }
};
