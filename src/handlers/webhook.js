const { getSession } = require('../services/session');
const { routeMessage } = require('./router');
const twilio = require('twilio');
const { MessagingResponse } = twilio.twiml;

/**
 * Webhook handler for Twilio WhatsApp incoming messages and HTTP simulator.
 * Hardened with a 5-second timeout and automatic fail-safe recovery so the bot NEVER drops a reply.
 */
module.exports = async (req, res) => {
  const startTime = Date.now();
  let from = req.body.From || req.body.phone || '';
  let body = req.body.Body || req.body.message || '';

  // Extract GPS Location from Twilio WhatsApp location pins if shared
  if (req.body.Latitude && req.body.Longitude) {
    body = `GPS_LOCATION:${req.body.Latitude},${req.body.Longitude}`;
  }

  // Clean phone number (e.g. "whatsapp:+919876543210" -> "+919876543210")
  const rawPhone = from.replace('whatsapp:', '').trim();
  body = (body || '').trim();

  console.log(`📱 [Twilio Webhook] Incoming message from ${rawPhone}: "${body}"`);

  if (!rawPhone || !body) {
    const emptyTwiml = new MessagingResponse();
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(emptyTwiml.toString());
  }

  const session = getSession(rawPhone);
  const lang = session.language || 'mr';

  // Fallback response in case of timeout or non-fatal exception
  const fallbackMessage = lang === 'en'
    ? `🙏 *GoMate Assistant*\n\nHow can we help you today? Reply *1* to Search Equipment, *2* for Rates, or *0* for Main Menu.`
    : `🙏 *GoMate कृषी व वाहतूक सहाय्यक*\n\nआम्ही कशी मदत करू शकतो? उपकरणे शोधण्यासाठी *1* पाठवा, दरपत्रकासाठी *दर* पाठवा, किंवा मुख्य मेनूसाठी *0* पाठवा.`;

  try {
    // ⏱️ 5-second timeout protection race: guarantees a reply before Twilio's 15s timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PROCESSING_TIMEOUT')), 5000)
    );

    const replyText = await Promise.race([
      routeMessage(rawPhone, body, session),
      timeoutPromise
    ]);

    const finalReply = replyText || fallbackMessage;
    const latency = Date.now() - startTime;
    console.log(`💬 [Twilio Webhook] Replying in ${latency}ms to ${rawPhone}: "${finalReply.substring(0, 60)}..."`);

    const twiml = new MessagingResponse();
    twiml.message(finalReply);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(twiml.toString());

  } catch (err) {
    const latency = Date.now() - startTime;
    console.warn(`⚠️ [Twilio Webhook] Handled fallback (${err.message}) after ${latency}ms for ${rawPhone}`);

    // Always send a courteous response even if a backend API is slow or temporarily errored
    const twiml = new MessagingResponse();
    twiml.message(fallbackMessage);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(twiml.toString());
  }
};
