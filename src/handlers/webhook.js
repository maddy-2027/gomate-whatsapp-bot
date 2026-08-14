const { getSession } = require('../services/session');
const { routeMessage } = require('./router');
const { sendWhatsApp } = require('../services/twilio');

module.exports = async (req, res) => {
  // ASYNC reply pattern: return 200 immediately to Twilio
  res.type('text/xml').send('<Response></Response>');
  
  const from = req.body.From;
  const body = req.body.Body;
  console.log(`Received message from ${from}: "${body}"`);
  if (!from || !body) return;

  try {
    const session = getSession(from);
    const replyText = await routeMessage(from, body, session);
    if (replyText) {
      console.log(`Sending reply to ${from}: "${replyText.substring(0, 50)}..."`);
      await sendWhatsApp(from, replyText);
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    await sendWhatsApp(from, 'Sorry, something went wrong processing your request.');
  }
};
