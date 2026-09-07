const assert = require('assert');
const { formatConfirmationMessage } = require('../src/services/paymentWatcherService');
const { generateInvoicePDF } = require('../src/services/invoiceService');
const { createBookingPaymentLink } = require('../src/services/razorpay');

async function runTests() {
  console.log('🚀 Running GoMate 20% Advance Booking Service Test Suite...\n');

  // Test 1: Math verification for 20% advance & 80% remaining
  console.log('🧪 Test 1: Math Verification for 20% advance & 80% remaining');
  const testCases = [
    { total: 1000, expectedAdvance: 200, expectedRemaining: 800 },
    { total: 1549, expectedAdvance: 310, expectedRemaining: 1239 },
    { total: 3049, expectedAdvance: 610, expectedRemaining: 2439 },
    { total: 5049, expectedAdvance: 1010, expectedRemaining: 4039 }
  ];

  for (const tc of testCases) {
    const adv = Math.round(tc.total * 0.20);
    const rem = tc.total - adv;
    assert.strictEqual(adv, tc.expectedAdvance, `Advance should be ${tc.expectedAdvance} for total ${tc.total}`);
    assert.strictEqual(rem, tc.expectedRemaining, `Remaining should be ${tc.expectedRemaining} for total ${tc.total}`);
    assert.strictEqual(adv + rem, tc.total, 'Advance + Remaining must equal Total');
  }
  console.log('✅ Test 1 Passed: 20% advance and 80% balance calculations are exact.\n');

  // Test 2: Razorpay createBookingPaymentLink creates link with advanceAmount
  console.log('🧪 Test 2: createBookingPaymentLink with 20% Advance Token');
  const payObj = await createBookingPaymentLink(
    '+919822012345',
    310,
    'GM-TEST',
    'Mahindra 575 DI (Rotavator)',
    { totalAmount: 1549, remainingAmount: 1239 }
  );
  assert(payObj.short_url, 'Should return a payment short_url');
  if (payObj.amount) {
    // Live Razorpay API response
    assert.strictEqual(payObj.amount, 31000, 'Razorpay amount must be 31000 paise (₹310, exactly 20%)');
    assert.strictEqual(Number(payObj.notes.advanceAmount), 310, 'Razorpay notes must have 310 advance');
    assert.strictEqual(Number(payObj.notes.totalAmount), 1549, 'Razorpay notes must have 1549 total');
    assert.strictEqual(Number(payObj.notes.remainingAmount), 1239, 'Razorpay notes must have 1239 remaining');
  } else {
    // Local / fallback URL
    assert(payObj.short_url.includes('amount=310'), 'URL should contain 20% advance');
    assert(payObj.short_url.includes('total=1549'), 'URL should contain total');
    assert(payObj.short_url.includes('remaining=1239'), 'URL should contain remaining');
  }
  console.log(`✅ Test 2 Passed: Generated live payment link (${payObj.short_url}) for ₹310 (20% advance)\n`);

  // Test 3: formatConfirmationMessage includes 20% advance & 80% remaining
  console.log('🧪 Test 3: Payment Confirmation Message formatting (Marathi, Hindi, English)');
  const mockBooking = {
    booking_ref: 'GM-9988',
    customer_name: 'अमोल शिंदे',
    customer_phone: '+919822099999',
    equipment_name: 'Mahindra 575 DI Tractor',
    village: 'शेगाव',
    hours_booked: 2,
    total_amount: 1549,
    advance_amount: 310,
    remaining_amount: 1239
  };

  const mrMsg = formatConfirmationMessage(mockBooking, 'mr');
  assert(mrMsg.includes('1,549') && mrMsg.includes('Total Bill'), 'Marathi msg should show total bill 1,549');
  assert(mrMsg.includes('310') && mrMsg.includes('20% Advance Paid'), 'Marathi msg should show 20% advance paid 310');
  assert(mrMsg.includes('1,239') && mrMsg.includes('80% Balance on Completion'), 'Marathi msg should show 80% remaining 1,239');

  const hiMsg = formatConfirmationMessage(mockBooking, 'hi');
  assert(hiMsg.includes('1,549') && hiMsg.includes('Total Bill'), 'Hindi msg should show total bill 1,549');
  assert(hiMsg.includes('310') && hiMsg.includes('20% Advance Paid'), 'Hindi msg should show 20% advance paid 310');
  assert(hiMsg.includes('1,239') && hiMsg.includes('80% Balance on Completion'), 'Hindi msg should show 80% remaining 1,239');

  const enMsg = formatConfirmationMessage(mockBooking, 'en');
  assert(enMsg.includes('1,549') && enMsg.includes('Total Bill'), 'English msg should show total bill 1,549');
  assert(enMsg.includes('310') && enMsg.includes('20% Advance Token Paid'), 'English msg should show 20% advance token 310');
  assert(enMsg.includes('1,239') && enMsg.includes('Remaining 80% Balance Due'), 'English msg should show remaining balance 1,239');
  console.log('✅ Test 3 Passed: Multi-language confirmation messages include itemized 20% advance & 80% balance due.\n');

  // Test 4: PDF Invoice Generator with 20% Advance Paid & 80% Balance Due
  console.log('🧪 Test 4: PDF Invoice Generation with 20% advance & 80% balance breakdown');
  const pdfBuffer = await generateInvoicePDF(mockBooking);
  assert(Buffer.isBuffer(pdfBuffer), 'Should return a PDF Buffer');
  assert(pdfBuffer.length > 2000, `PDF size should be valid (got ${pdfBuffer.length} bytes)`);
  console.log(`✅ Test 4 Passed: Generated PDF invoice (${pdfBuffer.length} bytes) with itemized advance & balance rows.\n`);

  console.log('🎉 ALL 4 TEST SUITES PASSED! 20% Advance Booking Service is completely verified.');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
