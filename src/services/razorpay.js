const Razorpay = require('razorpay');

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && 
    process.env.RAZORPAY_KEY_SECRET && 
    !process.env.RAZORPAY_KEY_ID.includes('dummy') &&
    process.env.RAZORPAY_KEY_ID.startsWith('rzp_')) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

async function createPaymentLink(phone, ownerName = 'Equipment Owner') {
  const baseUrl = process.env.RENDER_EXTERNAL_URL || 'https://gomate-whatsapp-bot.onrender.com';
  if (!razorpay) {
    const encodedPhone = encodeURIComponent(phone || '+919876543210');
    return {
      id: `plink_mock_${Date.now()}`,
      short_url: `${baseUrl}/demo-payment?phone=${encodedPhone}`
    };
  }

  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: 14900, // ₹149 in paise
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
      callback_url: `${baseUrl}/payment-success`,
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

async function createBookingPaymentLink(phone, amount, bookingRef, equipmentModel) {
  const baseUrl = process.env.RENDER_EXTERNAL_URL || 'https://gomate-whatsapp-bot.onrender.com';
  if (!razorpay) {
    const encodedPhone = encodeURIComponent(phone || '+919876543210');
    return {
      id: `plink_book_${Date.now()}`,
      short_url: `${baseUrl}/customer-payment.html?phone=${encodedPhone}&amount=${amount}&ref=${bookingRef}&model=${encodeURIComponent(equipmentModel)}`
    };
  }

  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: Math.round(amount * 100), // amount in paise
      currency: 'INR',
      accept_partial: false,
      description: `Rental Deposit for ${equipmentModel} (Ref: ${bookingRef})`,
      customer: {
        contact: phone
      },
      notify: {
        sms: true,
        whatsapp: true
      },
      notes: {
        bookingRef,
        equipmentModel,
        phone
      },
      callback_url: `${baseUrl}/payment-success`,
      callback_method: 'get'
    });

    return paymentLink;
  } catch (error) {
    console.error('Customer Booking Payment Link Error:', error);
    const encodedPhone = encodeURIComponent(phone || '+919876543210');
    return {
      id: `plink_book_fb_${Date.now()}`,
      short_url: `${baseUrl}/customer-payment.html?phone=${encodedPhone}&amount=${amount}&ref=${bookingRef}&model=${encodeURIComponent(equipmentModel)}`
    };
  }
}

async function createSubscription(phone, planId) {
  return await createPaymentLink(phone);
}

async function handleWebhookEvent(event) {
  console.log('Razorpay Webhook Event:', event.event);
  if (event.event === 'payment_link.paid' || event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity;
    const paymentLink = event.payload?.payment_link?.entity;
    const phone = payment?.contact || paymentLink?.customer?.contact;
    console.log(`✅ [Razorpay Webhook] Payment verified (${event.event}) for: ${phone}`);

    // 1. Customer Booking Payment
    const bookingRef = payment?.notes?.bookingRef || paymentLink?.notes?.bookingRef;
    if (bookingRef) {
      console.log(`🎯 [Razorpay Webhook] Detected bookingRef: ${bookingRef}. Confirming booking and dispatching WhatsApp invoice...`);
      try {
        const { confirmAndSendNotification } = require('./paymentWatcherService');
        await confirmAndSendNotification(bookingRef);
      } catch (err) {
        console.error('❌ [Razorpay Webhook] Error dispatching booking confirmation:', err);
      }
    }

    // 2. Owner Pro Subscription Payment
    const plan = payment?.notes?.plan || paymentLink?.notes?.plan;
    if (plan || (!bookingRef && phone)) {
      console.log(`👑 [Razorpay Webhook] Owner Pro subscription payment recorded for ${phone}`);
      try {
        const { updateOwnerSubscription } = require('../db/owners.repo');
        if (typeof updateOwnerSubscription === 'function') {
          await updateOwnerSubscription(phone, 'active');
        }
      } catch (_) {}
    }
  }
}

module.exports = { createPaymentLink, createBookingPaymentLink, createSubscription, handleWebhookEvent };
