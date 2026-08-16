const { getSession } = require('../services/session');
const { routeMessage } = require('./router');
const { sendWhatsAppDirect } = require('../services/whatsappWeb');

/**
 * Webhook handler for HTTP-based message injection (simulator / testing).
 * Real WhatsApp messages are handled directly inside whatsappWeb.js via msg.reply().
 */
module.exports = async (req, res) => {
  res.status(200).send('OK');

  const from = req.body.From || req.body.phone;
  const body = req.body.Body || req.body.message;

  console.log(`[Webhook] Message from ${from}: "${body}"`);
  if (!from || !body) return;

  try {
    const session = getSession(from);
    const replyText = await routeMessage(from, body, session);
    if (replyText) {
      console.log(`[Webhook] Reply to ${from}: "${replyText.substring(0, 60)}..."`);
      await sendWhatsAppDirect(from, replyText);
    }
  } catch (err) {
    console.error('[Webhook] Processing error:', err);
  }
};
