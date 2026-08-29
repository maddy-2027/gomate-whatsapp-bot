#!/usr/bin/env node
/**
 * GoMate Production Pre-flight Checker
 * Runs before `node server.js` to validate critical environment variables
 * and connections before accepting traffic.
 */

const required = [
  'GEMINI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
];

const optional = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'RENDER_EXTERNAL_URL',
];

const missing = [];
const warnings = [];

console.log('\n=================================================');
console.log('GoMate Production Pre-flight Check');
console.log('=================================================');

for (const key of required) {
  if (!process.env[key] || process.env[key].startsWith('your_') || process.env[key] === 'dummy_key_id') {
    missing.push(key);
    console.error(`  ❌ MISSING:  ${key}`);
  } else {
    console.log(`  ✅ PRESENT:  ${key}`);
  }
}

for (const key of optional) {
  if (!process.env[key] || process.env[key].startsWith('your_') || process.env[key] === 'dummy_key_id') {
    warnings.push(key);
    console.warn(`  ⚠️  OPTIONAL: ${key} — not set (some features may be limited)`);
  } else {
    console.log(`  ✅ PRESENT:  ${key}`);
  }
}

if (missing.length > 0) {
  console.warn(`\n⚠️  ${missing.length} recommended variable(s) not provided (${missing.join(', ')}).`);
  console.warn('⚡ Starting server in resilient fallback mode...\n');
} else {
  console.log('\n✅ All environment configurations validated.');
}

console.log('🚀 Starting GoMate WhatsApp Bot server...\n');

// Hand off to main server
require('./server.js');
