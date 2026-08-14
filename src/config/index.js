require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || 'dummy_sid',
    authToken: process.env.TWILIO_AUTH_TOKEN || 'dummy_token',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'dummy_key'
  },
  supabase: {
    url: process.env.SUPABASE_URL || 'https://dummy.supabase.co',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || 'dummy_key'
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret'
  }
};
