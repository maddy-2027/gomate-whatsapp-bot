const Razorpay = require('razorpay');

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

async function createPaymentLink(phone, ownerName = 'Equipment Owner') {
  if (!razorpay) {
    const encodedPhone = encodeURIComponent(phone || '+919876543210');
    // Use the live Render public link so it opens on phones without 'localhost' restrictions
    const baseUrl = process.env.RENDER_EXTERNAL_URL || 'https://gomate-whatsapp-bot.onrender.com';
    return {
      id: `plink_mock_${Date.now()}`,
      short_url: `${baseUrl}/demo-payment?phone=${encodedPhone}`
    };
  }



  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: 59900, // ₹599 in paise
      currency: 'INR',
      accept_partial: false,
      description: 'GoMate Owner Pro Subscription (1 Month)',
      customer: {
        name: ownerName,
        contact: phone
      },
      notify: {
        sms: true,
        whatsapp: true
      },
      reminder_enable: true,
      notes: {
        plan: 'Owner Pro Monthly',
        phone: phone
      },
      callback_url: 'https://gomate-whatsapp-bot.onrender.com/payment-success',
      callback_method: 'get'
    });

    return paymentLink;
  } catch (error) {
    console.error('Razorpay Payment Link Error:', error);
    return {
      id: `plink_fallback_${Date.now()}`,
      short_url: 'https://rzp.io/i/gomate-owner-pro'
    };
  }
}

async function createSubscription(phone, planId) {
  return await createPaymentLink(phone);
}

async function handleWebhookEvent(event) {
  console.log('Razorpay Webhook Event:', event.event);
  if (event.event === 'payment_link.paid' || event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const phone = payment.contact;
    console.log(`✅ ₹599 Subscription Payment verified for owner: ${phone}`);
  }
}

module.exports = { createPaymentLink, createSubscription, handleWebhookEvent };

