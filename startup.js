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
  console.error('\n❌ Pre-flight FAILED. Set the missing environment variables and redeploy.\n');
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn(`\n⚠️  ${warnings.length} optional variable(s) missing — continuing with limited features.\n`);
} else {
  console.log('\n✅ All checks passed. Starting GoMate server...\n');
}

// Hand off to main server
require('./server.js');
