const Razorpay = require('razorpay');

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

async function createSubscription(phone, planId) {
  if (!razorpay) return { id: `sub_mock_${Date.now()}`, short_url: 'https://rzp.io/l/mock' };
  
  try {
    const sub = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12,
      customer_notify: 1,
    });
    return sub;
  } catch (error) {
    console.error('Razorpay Error:', error);
    return null;
  }
}

async function handleWebhookEvent(event) {
  console.log('Razorpay Webhook Event:', event.event);
}

module.exports = { createSubscription, handleWebhookEvent };
