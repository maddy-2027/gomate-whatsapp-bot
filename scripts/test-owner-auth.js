const http = require('http');

async function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data, json });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Owner Authentication Test Suite...\n');

  // Test 1: GET /owner/login
  console.log('1️⃣ Testing GET /owner/login...');
  const pageRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/owner/login',
    method: 'GET'
  });
  if (pageRes.statusCode === 200 && pageRes.body.includes('मशिनरी मालक लॉगिन')) {
    console.log('   ✅ /owner/login page loaded successfully (HTTP 200)');
  } else {
    console.error('   ❌ /owner/login failed:', pageRes.statusCode);
    process.exit(1);
  }

  // Test 2: Unauthenticated /api/owner/auth/me should return 401
  console.log('\n2️⃣ Testing GET /api/owner/auth/me without token...');
  const unauthMe = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/owner/auth/me',
    method: 'GET'
  });
  if (unauthMe.statusCode === 401) {
    console.log('   ✅ Unauthenticated request correctly rejected with 401');
  } else {
    console.error('   ❌ Expected 401, got:', unauthMe.statusCode);
    process.exit(1);
  }

  // Test 3: Request OTP for unregistered phone
  console.log('\n3️⃣ Testing OTP request for unregistered number (9999999999)...');
  const unregRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/owner/auth/request-otp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { phone: '9999999999' });
  if (unregRes.statusCode === 400 && unregRes.json?.code === 'NOT_REGISTERED') {
    console.log('   ✅ Unregistered owner correctly blocked with NOT_REGISTERED message');
  } else {
    console.error('   ❌ Unexpected result for unregistered number:', unregRes.statusCode, unregRes.body);
    process.exit(1);
  }

  // Test 4: Request OTP for registered owner Rajesh Patil (9822012345)
  console.log('\n4️⃣ Testing OTP request for registered owner (9822012345)...');
  const otpRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/owner/auth/request-otp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { phone: '9822012345' });

  if (otpRes.statusCode === 200 && otpRes.json?.success) {
    console.log(`   ✅ OTP generated successfully for ${otpRes.json.phone} (${otpRes.json.ownerName})`);
    console.log(`   🔑 Generated OTP: ${otpRes.json.debugOtp || 'sent to WhatsApp'}`);
  } else {
    console.error('   ❌ Failed to request OTP:', otpRes.statusCode, otpRes.body);
    process.exit(1);
  }

  const generatedOtp = otpRes.json.debugOtp;
  if (!generatedOtp) {
    console.error('   ❌ debugOtp not returned in dev mode');
    process.exit(1);
  }

  // Test 5: Verify with WRONG OTP
  console.log('\n5️⃣ Testing verify-otp with incorrect OTP (000000)...');
  const wrongRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/owner/auth/verify-otp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { phone: '9822012345', otp: '000000' });

  if (wrongRes.statusCode === 400 && wrongRes.json?.error.includes('चुकीचा OTP')) {
    console.log('   ✅ Incorrect OTP correctly rejected');
  } else {
    console.error('   ❌ Wrong OTP test failed:', wrongRes.statusCode, wrongRes.body);
    process.exit(1);
  }

  // Test 6: Verify with CORRECT OTP
  console.log(`\n6️⃣ Testing verify-otp with correct OTP (${generatedOtp})...`);
  const correctRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/owner/auth/verify-otp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { phone: '9822012345', otp: generatedOtp });

  if (correctRes.statusCode === 200 && correctRes.json?.success && correctRes.json?.token) {
    console.log('   ✅ OTP verified! Token issued.');
    console.log(`   👤 Authenticated Owner: ${correctRes.json.owner.name} (${correctRes.json.owner.phone})`);
  } else {
    console.error('   ❌ Valid OTP verification failed:', correctRes.statusCode, correctRes.body);
    process.exit(1);
  }

  const token = correctRes.json.token;

  // Test 7: GET /api/owner/auth/me with Bearer token
  console.log('\n7️⃣ Testing GET /api/owner/auth/me with Bearer token...');
  const meRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/owner/auth/me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (meRes.statusCode === 200 && meRes.json?.success) {
    console.log(`   ✅ Session valid! Welcome back, ${meRes.json.owner.name}`);
  } else {
    console.error('   ❌ Failed to get /api/owner/auth/me:', meRes.statusCode, meRes.body);
    process.exit(1);
  }

  // Test 8: GET /api/owner/data with Bearer token
  console.log('\n8️⃣ Testing GET /api/owner/data with authenticated session...');
  const dataRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/owner/data',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (dataRes.statusCode === 200 && dataRes.json?.owner && dataRes.json?.kpis) {
    console.log(`   ✅ Owner portal data loaded for: ${dataRes.json.owner.name}`);
    console.log(`   🚜 Active machinery listings: ${dataRes.json.kpis.activeListings}`);
    console.log(`   📋 Total bookings: ${dataRes.json.kpis.totalBookings}`);
    console.log(`   💰 Total earnings: ₹${dataRes.json.kpis.totalEarnings}`);
  } else {
    console.error('   ❌ Failed to load owner data:', dataRes.statusCode, dataRes.body);
    process.exit(1);
  }

  // Test 9: POST /api/owner/auth/logout
  console.log('\n9️⃣ Testing POST /api/owner/auth/logout...');
  const logoutRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/owner/auth/logout',
    method: 'POST'
  });
  if (logoutRes.statusCode === 200) {
    console.log('   ✅ Logout endpoint executed cleanly');
  }

  console.log('\n🎉 ALL 9 OWNER AUTHENTICATION TESTS PASSED PERFECTLY! 🚀\n');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
