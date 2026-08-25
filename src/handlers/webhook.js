const { getSession } = require('../services/session');
const { routeMessage } = require('./router');
const { sendWhatsApp } = require('../services/twilio');

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

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
    res.type('text/xml').send('<Response></Response>');
    return;
  }

  try {
    const session = getSession(rawPhone);
    const replyText = await routeMessage(rawPhone, body, session);

    if (replyText) {
      console.log(`💬 [Twilio Webhook] Replying to ${rawPhone}: "${replyText.substring(0, 60)}..."`);
      
      // 1. Send TwiML Response
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(replyText)}</Message>
</Response>`;
      
      res.type('text/xml').send(twiml);

      // 2. Also trigger Twilio REST API async dispatch (Dual Delivery Guarantee)
      if (from.startsWith('whatsapp:')) {
        sendWhatsApp(from, replyText).catch(() => {});
      }
    } else {
      res.type('text/xml').send('<Response></Response>');
    }
  } catch (err) {
    console.error('❌ [Twilio Webhook] Processing error:', err);
    res.type('text/xml').send('<Response></Response>');
  }
};
