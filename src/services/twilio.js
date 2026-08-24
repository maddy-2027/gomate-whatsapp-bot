const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+17372508034';

let client = null;
if (accountSid && authToken && !accountSid.includes('dummy')) {
  try {
    client = twilio(accountSid, authToken);
  } catch (err) {
    console.warn('⚠️ Twilio initialization error:', err.message);
  }
}

/**
 * Send WhatsApp message via Twilio Official API
 * @param {string} to - Recipient phone number (e.g. "+919822012345" or "whatsapp:+919822012345")
 * @param {string} body - Message text content
 */
async function sendWhatsApp(to, body) {
  if (!to || !body) return false;

  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const formattedFrom = twilioNumber.startsWith('whatsapp:') ? twilioNumber : `whatsapp:${twilioNumber}`;

  if (client) {
    try {
      const message = await client.messages.create({
        body: body,
        from: formattedFrom,
        to: formattedTo
      });
      console.log(`📡 [Twilio] WhatsApp sent to ${formattedTo} (SID: ${message.sid})`);
      return message;
    } catch (err) {
      console.error(`❌ [Twilio] Send error to ${formattedTo}:`, err.message);
    }
  }

  // Fallback to whatsappWeb if running locally
  try {
    const { sendWhatsAppDirect } = require('./whatsappWeb');
    return await sendWhatsAppDirect(to, body);
  } catch (e) {
    return false;
  }
}

module.exports = { sendWhatsApp };
