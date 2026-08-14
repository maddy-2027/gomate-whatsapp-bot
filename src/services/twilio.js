const twilio = require('twilio');
const config = require('../config');

let client = null;
if (config.twilio.accountSid !== 'dummy_sid') {
  client = twilio(config.twilio.accountSid, config.twilio.authToken);
} else {
  console.warn('Twilio not configured. Using mock client.');
  client = { messages: { create: async (msg) => console.log('Mock WhatsApp Message sent:', msg) } };
}

async function sendWhatsApp(to, body) {
  try {
    await client.messages.create({
      body: body,
      from: config.twilio.whatsappNumber,
      to: to
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}

module.exports = { sendWhatsApp };
