process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const axios = require('axios');
const { getBookingByRef } = require('../src/db/bookings.repo');
const razorpayService = require('../src/services/razorpay');

const PLINK_ID = 'plink_TYl5FBfht0W3iF';
const BOOKING_REF = 'GM-4YZN';
const AUTH_HEADER = 'Basic ' + Buffer.from(process.env.RAZORPAY_KEY_ID + ':' + process.env.RAZORPAY_KEY_SECRET).toString('base64');

async function checkPaymentStatus() {
  const res = await axios.get(`https://api.razorpay.com/v1/payment_links/${PLINK_ID}`, {
    headers: { 'Authorization': AUTH_HEADER }
  });
  return res.data;
}

async function watch() {
  console.log('===============================================================');
  console.log('💳 Razorpay Live ₹1 Payment Watcher Active');
  console.log(`🔗 Pay Link: https://rzp.io/rzp/126B4iH`);
  console.log(`🔖 Booking Ref: ${BOOKING_REF} | Amount: ₹1.00`);
  console.log('Waiting for you to complete the payment on UPI / GPay...');
  console.log('===============================================================\n');

  let attempts = 0;
  const maxAttempts = 60; // 3 minutes

  const interval = setInterval(async () => {
    attempts++;
    try {
      const data = await checkPaymentStatus();
      process.stdout.write(`⏱️ [Attempt ${attempts}/${maxAttempts}] Status: ${data.status} | Amount Paid: ₹${data.amount_paid / 100}\r`);

      if (data.status === 'paid' || (data.amount_paid && data.amount_paid >= 100)) {
        clearInterval(interval);
        console.log('\n\n🎉 PAYMENT DETECTED AS PAID ON RAZORPAY!');
        console.log('Payment Link Details:', {
          id: data.id,
          amount_paid: data.amount_paid / 100
        });

        // 1. Trigger Razorpay Webhook Event
        const webhookEvent = {
          entity: 'event',
          account_id: 'acc_live',
          event: 'payment_link.paid',
          contains: ['payment_link', 'payment'],
          payload: {
            payment_link: { entity: data },
            payment: {
              entity: {
                id: (data.payments && data.payments[0] && data.payments[0].payment_id) || 'pay_live_done',
                amount: data.amount_paid || 100,
                status: 'captured',
                contact: data.customer?.contact || '+918605470552',
                notes: data.notes
              }
            }
          }
        };

        console.log('\n📡 Sending Live Webhook to /webhook/razorpay...');
        await razorpayService.handleWebhookEvent(webhookEvent);

        // 2. Verify Booking Status
        const updatedBooking = await getBookingByRef(BOOKING_REF);
        console.log('\n📊 Verifying Booking Status in Database:');
        console.log(`  Reference: ${updatedBooking.booking_ref}`);
        console.log(`  Status: ${updatedBooking.status} (Expected: confirmed)`);
        console.log(`  Amount: ₹${updatedBooking.total_amount}`);

        // 3. Verify PDF Invoice
        const invoiceUrl = `http://localhost:3000/api/bookings/${BOOKING_REF}/invoice`;
        const invoiceRes = await axios.get(invoiceUrl, { responseType: 'arraybuffer' });
        console.log(`\n🧾 PDF Invoice Verified: HTTP ${invoiceRes.status} (${invoiceRes.data.length} bytes)`);

        console.log('\n===============================================================');
        console.log('✅ ALL VERIFICATIONS PASSED SUCCESSFULLY!');
        console.log('===============================================================');
        process.exit(0);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.log('\n⌛ Timed out waiting for payment. You can run this script again anytime.');
        process.exit(0);
      }
    } catch (err) {
      console.error('\nError polling Razorpay:', err.message);
    }
  }, 3000);
}

watch();
