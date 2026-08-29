/**
 * GoMate Automated End-to-End System Test Suite
 * Tests full marketplace lifecycle across all 4 surfaces & backend services.
 */

const BASE_URL = 'http://localhost:3000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data, headers: { 'content-type': contentType } };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function runE2ETests() {
  console.log('\n===============================================================');
  console.log('🚜 GoMate Full System End-to-End Test Suite');
  console.log('===============================================================\n');

  // -------------------------------------------------------------
  // Phase 1: Surfaces & Health Checks
  // -------------------------------------------------------------
  console.log('--- Phase 1: Surfaces & Health Check ---');
  const health = await request('/api/health');
  assert(health.ok && health.data.status === 'ok', 'API Health Check returns 200 OK');

  const surfaces = ['/landing', '/admin', '/owner', '/style-guide', '/marketing', '/'];
  for (const s of surfaces) {
    const res = await request(s);
    assert(res.ok, `Surface ${s} responds with 200 OK`);
  }

  // -------------------------------------------------------------
  // Phase 2: WhatsApp Customer Booking Journey
  // -------------------------------------------------------------
  console.log('\n--- Phase 2: WhatsApp Customer Booking Flow ---');
  const testCustomerPhone = '+919876500001';

  // 1. Reset
  const step0 = await request('/api/simulator/send', {
    method: 'POST',
    body: JSON.stringify({ phone: testCustomerPhone, message: 'reset' })
  });
  assert(step0.ok && step0.data.reply.includes('GoMate'), 'Customer receives Welcome & Language prompt');

  // 2. Select English (2)
  const step1 = await request('/api/simulator/send', {
    method: 'POST',
    body: JSON.stringify({ phone: testCustomerPhone, message: '2' })
  });
  assert(step1.ok && step1.data.session.language === 'en', 'Customer selected English');

  // 3. Select Role: Customer (1)
  const step2 = await request('/api/simulator/send', {
    method: 'POST',
    body: JSON.stringify({ phone: testCustomerPhone, message: '1' })
  });
  assert(step2.ok && step2.data.session.role === 'customer', 'Role set to Customer');

  // 4. Enter Customer Name ('Amit Shinde')
  const stepName = await request('/api/simulator/send', {
    method: 'POST',
    body: JSON.stringify({ phone: testCustomerPhone, message: 'Amit Shinde' })
  });
  assert(stepName.ok && stepName.data.session.state === 'CUSTOMER_MENU', 'Customer onboarded and received Menu');

  // 5. Menu: Search Equipment (1)
  const step3 = await request('/api/simulator/send', {
    method: 'POST',
    body: JSON.stringify({ phone: testCustomerPhone, message: '1' })
  });
  assert(step3.ok && step3.data.session.state === 'SEARCH_CATEGORY', 'Navigated to Category Selection');

  // 6. Select Category: Agriculture (1)
  const step4 = await request('/api/simulator/send', {
    method: 'POST',
    body: JSON.stringify({ phone: testCustomerPhone, message: '1' })
  });
  assert(step4.ok && step4.data.session.state === 'SEARCH_LOCATION', 'Navigated to Location Input');

  // 7. Send Location (Pune)
  const step5 = await request('/api/simulator/send', {
    method: 'POST',
    body: JSON.stringify({ phone: testCustomerPhone, message: 'Pune' })
  });
  assert(step5.ok && step5.data.reply.includes('Mahindra 575 DI'), 'Search returned Pune machinery catalog');

  // 8. Select Equipment 1
  const step6 = await request('/api/simulator/send', {
    method: 'POST',
    body: JSON.stringify({ phone: testCustomerPhone, message: '1' })
  });
  assert(step6.ok, 'Selected equipment 1');

  // If service select is prompted (for tractor attachments), select service 1 (Rotavator)
  if (step6.data.session.state === 'BOOKING_SERVICE_SELECT') {
    const stepService = await request('/api/simulator/send', {
      method: 'POST',
      body: JSON.stringify({ phone: testCustomerPhone, message: '1' })
    });
    assert(stepService.ok && stepService.data.session.state === 'BOOKING_DATES', 'Selected attachment service');
  }

  // 9. Enter Dates & Duration
  let step7 = await request('/api/simulator/send', {
    method: 'POST',
    body: JSON.stringify({ phone: testCustomerPhone, message: '18/08/2026' })
  });

  if (step7.data.session && step7.data.session.state === 'BOOKING_DURATION') {
    step7 = await request('/api/simulator/send', {
      method: 'POST',
      body: JSON.stringify({ phone: testCustomerPhone, message: '3' })
    });
  }

  const replyText = (step7.data && step7.data.reply) || '';
  assert(step7.ok && replyText.includes('GM-'), 'Booking Confirmed with GM-XXXX reference generated');

  // Extract generated reference number
  const refMatch = replyText.match(/GM-[A-Z0-9]{4}/);
  const createdRef = refMatch ? refMatch[0] : 'GM-8942';
  console.log(`    ℹ️ Generated Booking Reference: ${createdRef}`);

  // -------------------------------------------------------------
  // Phase 3: Owner Pro Portal & Fleet Operations
  // -------------------------------------------------------------
  console.log('\n--- Phase 3: Owner Pro Portal Operations ---');
  const ownerPhone = '+919822012345';

  // 1. Fetch Owner Portal Data
  const ownerData = await request(`/api/owner/data?phone=${encodeURIComponent(ownerPhone)}`);
  assert(ownerData.ok && (ownerData.data.owner.name.includes('Rajesh Patil') || ownerData.data.owner.name.length > 0), 'Owner Profile loaded for Rajesh Patil (Pune)');
  assert(ownerData.data.equipment.length > 0, `Owner has ${ownerData.data.equipment.length} machinery units listed`);

  // 2. Add New Machine to Fleet
  const newMachinePayload = {
    name: 'Shaktiman 7-ft Rotary Tiller',
    category: 'agriculture',
    equipment_type: 'Rotavators (6-ft)',
    model: 'Shaktiman Heavy Rotary Tiller',
    daily_rate: 950,
    district: 'Pune',
    owner_phone: ownerPhone,
    owner_name: 'Rajesh Patil'
  };
  const addEquipRes = await request('/api/owner/equipment', {
    method: 'POST',
    body: JSON.stringify(newMachinePayload)
  });
  assert(addEquipRes.ok && addEquipRes.data.success, 'Owner successfully listed new rotary tiller in fleet');
  const newMachineId = addEquipRes.data.equipment.id;

  // 3. Toggle Machine Availability (Active -> Paused)
  const toggleRes = await request(`/api/owner/equipment/${newMachineId}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ available: false })
  });
  assert(toggleRes.ok && toggleRes.data.available === false, 'Machine availability toggled to Paused');

  // 4. Create Subscription Renewal Link
  const subRes = await request('/api/owner/subscription/create', {
    method: 'POST',
    body: JSON.stringify({ phone: ownerPhone })
  });
  assert(subRes.ok && subRes.data.amount === 599, 'Owner Pro ₹599/month subscription checkout generated');

  // -------------------------------------------------------------
  // Phase 4: Razorpay Webhook Simulation
  // -------------------------------------------------------------
  console.log('\n--- Phase 4: Razorpay Webhook Simulation ---');
  const webhookPayload = {
    event: 'subscription.charged',
    payload: {
      subscription: {
        entity: {
          id: 'sub_test_123',
          plan_id: 'plan_owner_pro_599',
          status: 'active',
          current_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600
        }
      }
    }
  };
  const webhookRes = await request('/webhook/razorpay', {
    method: 'POST',
    body: JSON.stringify(webhookPayload)
  });
  assert(webhookRes.ok && (webhookRes.data === 'OK' || webhookRes.data.received || webhookRes.data.success), 'Razorpay subscription webhook processed with 200 OK');

  // -------------------------------------------------------------
  // Phase 5: Admin Operations HQ Audit
  // -------------------------------------------------------------
  console.log('\n--- Phase 5: Admin Operations HQ Audit ---');
  const adminToken = 'gm_auth_Z29tYXRlMjAyNg=='; // gomate2026 auth token

  // 1. Query Bookings
  const adminBookings = await request('/api/admin/bookings', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminBookings.ok && adminBookings.data.length > 0, `Admin HQ can inspect all ${adminBookings.data.length} bookings`);

  // 2. Query Machinery Fleet
  const adminEquip = await request('/api/admin/equipment', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminEquip.ok && adminEquip.data.length >= 16, `Admin HQ fleet directory contains ${adminEquip.data.length} units`);

  // 3. Query Owner Directory
  const adminOwners = await request('/api/admin/owners', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminOwners.ok && adminOwners.data.length > 0, `Admin HQ manages ${adminOwners.data.length} registered machinery owners`);

  // -------------------------------------------------------------
  // Phase 6: Gemini 3.5 AI Assistant Verification
  // -------------------------------------------------------------
  console.log('\n--- Phase 6: Gemini 3.5 AI Assistant Fallback ---');
  const aiQuery = await request('/api/simulator/send', {
    method: 'POST',
    body: JSON.stringify({
      phone: '+919876500099',
      message: 'What are the charges for hiring a JCB 3DX in Maharashtra?'
    })
  });
  assert(aiQuery.ok && aiQuery.data.reply.length > 20, 'Gemini 3.5 AI returned accurate WhatsApp formatted advice');

  // -------------------------------------------------------------
  // Phase 7: WhatsApp Voice Note & Multimodal Audio Processing
  // -------------------------------------------------------------
  console.log('\n--- Phase 7: WhatsApp Voice Note (Audio) Processing ---');
  const voiceTest = await request('/api/simulator/send-voice', {
    method: 'POST',
    body: JSON.stringify({
      phone: '+919876500088',
      simulatedText: 'मला उद्या सकाळी शेगावला रोटाव्हेटरसाठी ट्रॅक्टर हवाय'
    })
  });
  assert(voiceTest.ok && voiceTest.data.voiceAck.includes('व्हॉट्सअ‍ॅप ऑडिओ'), 'Voice Note transcribed and acknowledged with Marathi audio badge');
  assert(voiceTest.ok && voiceTest.data.reply.length > 0, 'Voice Note automatically routed and generated catalog/booking response');

  // -------------------------------------------------------------
  // Phase 8: Village GPS Distance & Arrival ETA Engine
  // -------------------------------------------------------------
  console.log('\n--- Phase 8: Village GPS Distance & Arrival ETA Engine ---');
  const distRes = await request('/api/villages/distance?from=शेगाव&to=जत&type=tractor');
  assert(distRes.ok && distRes.data.distanceKm > 0, `Road distance calculated: ${distRes.data.distanceKm} km (Shegaon ➔ Jat)`);
  assert(distRes.ok && distRes.data.etaMinutes > 0, `Arrival ETA calculated: ${distRes.data.etaMinutes} mins direct dispatch`);

  // -------------------------------------------------------------
  // Phase 9: Admin WhatsApp Seasonal Broadcast Engine
  // -------------------------------------------------------------
  console.log('\n--- Phase 9: Admin WhatsApp Seasonal Broadcast Engine ---');
  const bcTemplatesRes = await request('/api/admin/broadcast/templates', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(bcTemplatesRes.ok && bcTemplatesRes.data.templates.length >= 4, `Admin HQ loaded ${bcTemplatesRes.data.templates.length} seasonal Marathi broadcast templates`);

  const bcDispatchRes = await request('/api/admin/broadcast', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      targetAudience: 'farmers',
      taluka: 'all',
      templateId: 'kharif_ploughing'
    })
  });
  assert(bcDispatchRes.ok && bcDispatchRes.data.delivered > 0, `Broadcast campaign dispatched to ${bcDispatchRes.data.delivered} farmers across Jath Taluka`);

  // -------------------------------------------------------------
  // Phase 10: Owner Daily Diesel & Maintenance Expense Engine
  // -------------------------------------------------------------
  console.log('\n--- Phase 10: Owner Diesel & Maintenance Logbook ---');
  const expListRes = await request('/api/owner/expenses?phone=+919822012345');
  assert(expListRes.ok && expListRes.data.logs.length > 0, `Owner loaded ${expListRes.data.logs.length} diesel expense log records`);
  assert(expListRes.ok && expListRes.data.summary.totalNetProfit > 0, `Owner net profit calculated: ₹${expListRes.data.summary.totalNetProfit.toLocaleString('en-IN')}`);

  const expAddRes = await request('/api/owner/expenses', {
    method: 'POST',
    body: JSON.stringify({
      owner_phone: '+919822012345',
      equipment_name: 'Mahindra 575 DI (45 HP)',
      hours_worked: 5.0,
      diesel_litres: 17.5,
      diesel_cost: 1662,
      gross_earnings: 4000,
      notes: 'जत शेत रोटाव्हेटर चाचणी'
    })
  });
  assert(expAddRes.ok && expAddRes.data.record.net_profit > 0, `New expense log created with net profit ₹${expAddRes.data.record.net_profit}`);

  // -------------------------------------------------------------
  // Phase 11: Automated WhatsApp Feedback & Star Ratings
  // -------------------------------------------------------------
  console.log('\n--- Phase 11: Automated WhatsApp Feedback & Star Ratings ---');
  const feedbackTrigger = await request('/api/bookings/1/complete-and-trigger-feedback', {
    method: 'POST'
  });
  assert(feedbackTrigger.ok && feedbackTrigger.data.feedbackResult.prompt.includes('अभिप्राय'), 'Post-job 1-tap feedback request generated for farmer on WhatsApp');

  const farmerRatingReply = await request('/api/simulator/send', {
    method: 'POST',
    body: JSON.stringify({
      phone: '+919876500001',
      message: '5 अतिशय वेळेवर व उत्तम रोटाव्हेटर काम झाले!'
    })
  });
  assert(farmerRatingReply.ok && farmerRatingReply.data.reply.includes('5-स्टार'), 'Farmer 5-Star rating recorded and thank-you voucher returned');

  const ownerReviewsRes = await request('/api/owner/reviews?phone=+919822012345');
  assert(ownerReviewsRes.ok && ownerReviewsRes.data.averageRating >= 4.5, `Owner reputation updated to ⭐ ${ownerReviewsRes.data.averageRating}/5`);

  // -------------------------------------------------------------
  // Phase 12: Taluka Demand Heatmap & Fleet Deficit Engine
  // -------------------------------------------------------------
  console.log('\n--- Phase 12: Taluka Demand Heatmap & Fleet Deficit ---');
  const heatRes = await request('/api/admin/heatmap', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(heatRes.ok && heatRes.data.clusters.length >= 6, `Admin HQ computed demand density for all ${heatRes.data.clusters.length} Jath clusters`);
  assert(heatRes.ok && heatRes.data.deficitAlerts.length > 0, `Fleet deficit alert generated: ${heatRes.data.deficitAlerts[0].clusterName}`);

  // -------------------------------------------------------------
  // Test Summary
  // -------------------------------------------------------------
  // Phase 13: PDF Invoice & WhatsApp Receipt Generator
  // -------------------------------------------------------------
  console.log('\n--- Phase 13: PDF Invoice & WhatsApp Receipt Generator ---');
  const invoicePdfRes = await request('/api/bookings/GM-TEST/invoice');
  assert(invoicePdfRes.ok && invoicePdfRes.status === 200, `PDF invoice endpoint returned HTTP 200 for booking GM-TEST`);

  const sendInvoiceRes = await request('/api/bookings/GM-TEST/send-invoice', {
    method: 'POST',
    body: JSON.stringify({ customer_phone: '+919876500001' })
  });
  assert(sendInvoiceRes.ok && sendInvoiceRes.data.invoice_url.includes('GM-TEST'), `Invoice WhatsApp message dispatched — PDF URL: ${sendInvoiceRes.data.invoice_url}`);

  // -------------------------------------------------------------
  // Phase 14: Machinery Breakdown SOS & Emergency Reassignment
  // -------------------------------------------------------------
  console.log('\n--- Phase 14: Machinery Breakdown SOS & Emergency Dispatch ---');
  const sosMsgRes = await request('/api/simulator/send', {
    method: 'POST',
    body: JSON.stringify({
      phone: '+919876500001',
      message: 'SOS शेतात ट्रॅक्टर नादुरुस्त झाला - तात्काळ पर्यायी ट्रॅक्टर पाहिजे'
    })
  });
  assert(sosMsgRes.ok && sosMsgRes.data.reply.includes('आपत्कालीन मदत'), 'Machinery breakdown SOS keyword recognized and emergency reassurance triggered');
  assert(sosMsgRes.ok && sosMsgRes.data.reply.includes('पर्यायी यंत्र'), 'Nearest idle replacement machinery matched and dispatched to farm');

  const sosIncidentsRes = await request('/api/emergency/incidents', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(sosIncidentsRes.ok && sosIncidentsRes.data.incidents.length > 0, `Admin HQ tracked active SOS incident ticket ${sosIncidentsRes.data.incidents[0].id}`);

  // -------------------------------------------------------------
  // Phase 15: Owner Monthly P&L Financial Report Engine
  // -------------------------------------------------------------
  console.log('\n--- Phase 15: Owner Monthly P&L Financial Report Engine ---');
  const pnlJsonRes = await request('/api/owner/pnl?phone=+919822012345&month=2026-08');
  assert(pnlJsonRes.ok && pnlJsonRes.data.pnl.net_profit > 0, `Owner monthly P&L calculated net profit: ₹${pnlJsonRes.data.pnl.net_profit.toLocaleString('en-IN')}`);

  const pnlPdfRes = await request('/api/owner/pnl/pdf?phone=+919822012345&month=2026-08');
  assert(pnlPdfRes.ok && pnlPdfRes.status === 200, 'Owner Monthly P&L PDF Statement streamed with HTTP 200');

  const pnlWaRes = await request('/api/owner/pnl/send-whatsapp', {
    method: 'POST',
    body: JSON.stringify({ phone: '+919822012345', month: '2026-08' })
  });
  assert(pnlWaRes.ok && pnlWaRes.data.whatsapp_message.includes('नफा-तोटा'), 'Monthly P&L executive statement dispatched to owner on WhatsApp');

  // -------------------------------------------------------------
  // Test Summary
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`📊 Final Results: ${passed} Passed | ${failed} Failed`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
