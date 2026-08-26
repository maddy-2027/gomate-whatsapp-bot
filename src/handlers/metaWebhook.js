/**
 * GoMate - Meta WhatsApp Cloud API Webhook Handler
 * Handles:
 * 1. GET /webhook/meta - Verification challenge handshake from Meta App Dashboard
 * 2. POST /webhook/meta - Inbound message processing & instant replies
 */

const { routeMessage } = require('./router');
const { getSession } = require('../services/session');
const metaWhatsApp = require('../services/metaWhatsApp');

/**
 * Verification Handshake (Meta sends GET request when you register the webhook)
 */
function handleMetaVerification(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.META_VERIFY_TOKEN || 'gomate_meta_token_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('✅ [Meta WhatsApp] Webhook verified successfully by Meta!');
    return res.status(200).send(challenge);
  }

  console.warn('⚠️ [Meta WhatsApp] Webhook verification failed. Token mismatch.');
  return res.status(403).send('Forbidden: Token mismatch');
}

/**
 * Inbound Event Handler (Meta sends POST request on new customer message)
 */
async function handleMetaInbound(req, res) {
  // Always respond with 200 OK immediately to satisfy Meta's 3-second SLA
  res.status(200).send('EVENT_RECEIVED');

  try {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') {
      return;
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value || !value.messages || value.messages.length === 0) {
      // Could be a status update (delivered, read, sent), ignore
      return;
    }

    const message = value.messages[0];
    const rawFrom = message.from; // e.g. "919876543210"
    const phone = rawFrom.startsWith('+') ? rawFrom : `+${rawFrom}`;

    let incomingText = '';

    // Handle different message types from WhatsApp
    if (message.type === 'text') {
      incomingText = message.text?.body || '';
    } else if (message.type === 'interactive') {
      const interactive = message.interactive;
      if (interactive.type === 'button_reply') {
        incomingText = interactive.button_reply.id || interactive.button_reply.title || '';
      } else if (interactive.type === 'list_reply') {
        incomingText = interactive.list_reply.id || interactive.list_reply.title || '';
      }
    } else if (message.type === 'location') {
      incomingText = message.location?.name || message.location?.address || 'Maharashtra';
    } else {
      incomingText = '1'; // Default fallback for unsupported media
    }

    console.log(`\n📩 [Meta WhatsApp] Inbound from ${phone}: "${incomingText}"`);

    const session = getSession(phone);

    // Route message through GoMate conversation state engine
    const replyText = await routeMessage(phone, incomingText, session);

    // Send reply back directly via Meta Graph API
    await metaWhatsApp.sendTextMessage(phone, replyText);

    console.log(`📤 [Meta WhatsApp] Sent response to ${phone}`);
  } catch (error) {
    console.error('❌ [Meta WhatsApp] Webhook processing error:', error);
  }
}

module.exports = {
  handleMetaVerification,
  handleMetaInbound
};
