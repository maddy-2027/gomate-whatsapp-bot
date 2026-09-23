/**
 * pushService.js
 * Web Push Notification service for GoMate owner alerts.
 *
 * VAPID keys are read from env (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).
 * If not set, keys are generated once at startup and logged — copy them to your .env.
 *
 * Subscriptions are stored in memory (Map<ownerPhone, PushSubscription[]>).
 * For Supabase persistence, add a `push_subscriptions` table with columns:
 *   owner_phone TEXT, endpoint TEXT, keys JSONB, created_at TIMESTAMPTZ
 */

const webpush = require('web-push');
const supabase = require('../db/supabase');

// ─── VAPID key bootstrap ─────────────────────────────────────────────────────
let VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY;
let VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  const keys = webpush.generateVAPIDKeys();
  VAPID_PUBLIC_KEY  = keys.publicKey;
  VAPID_PRIVATE_KEY = keys.privateKey;
  console.log('\n⚠️  [GoMate Push] VAPID keys not in env — generated for this session.');
  console.log('   Add these to .env to persist across restarts:\n');
  console.log(`   VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}`);
  console.log(`   VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}\n`);
}

webpush.setVapidDetails(
  'mailto:support@gomate.in',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// ─── In-memory subscription store ────────────────────────────────────────────
// Map<string (ownerPhone), Set<string (endpoint)> + full sub objects>
const subscriptionsByPhone = new Map(); // phone → PushSubscription[]

/**
 * Persist a push subscription for the given owner.
 * Deduplicates by endpoint so we never double-send.
 */
async function saveSubscription(ownerPhone, subscription) {
  if (!ownerPhone || !subscription || !subscription.endpoint) return;

  // Memory store
  if (!subscriptionsByPhone.has(ownerPhone)) {
    subscriptionsByPhone.set(ownerPhone, []);
  }
  const existing = subscriptionsByPhone.get(ownerPhone);
  const alreadyStored = existing.some(s => s.endpoint === subscription.endpoint);
  if (!alreadyStored) existing.push(subscription);

  // Optional Supabase persistence
  try {
    await supabase.from('push_subscriptions').upsert(
      [{
        owner_phone: ownerPhone,
        endpoint: subscription.endpoint,
        keys: subscription.keys || {},
        created_at: new Date().toISOString()
      }],
      { onConflict: 'endpoint' }
    );
  } catch (_) {
    // Table may not exist yet — memory store suffices
  }
}

/**
 * Remove a push subscription (owner unsubscribed or endpoint expired).
 */
async function removeSubscription(ownerPhone, endpoint) {
  if (subscriptionsByPhone.has(ownerPhone)) {
    const filtered = subscriptionsByPhone.get(ownerPhone).filter(s => s.endpoint !== endpoint);
    subscriptionsByPhone.set(ownerPhone, filtered);
  }
  try {
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  } catch (_) {}
}

/**
 * Load subscriptions from Supabase into memory (called at server startup).
 */
async function loadSubscriptionsFromDB() {
  try {
    const { data, error } = await supabase.from('push_subscriptions').select('*');
    if (error || !data) return;
    for (const row of data) {
      if (!subscriptionsByPhone.has(row.owner_phone)) {
        subscriptionsByPhone.set(row.owner_phone, []);
      }
      const existing = subscriptionsByPhone.get(row.owner_phone);
      const alreadyStored = existing.some(s => s.endpoint === row.endpoint);
      if (!alreadyStored) {
        existing.push({ endpoint: row.endpoint, keys: row.keys });
      }
    }
    console.log(`📲 [GoMate Push] Loaded ${data.length} push subscriptions from Supabase.`);
  } catch (_) {}
}

/**
 * Send a push notification to all devices registered for this owner.
 * @param {string} ownerPhone  - e.g. '+919822012345'
 * @param {Object} payload     - { title, body, icon, badge, tag, data }
 */
async function sendBookingPush(ownerPhone, payload) {
  const subs = subscriptionsByPhone.get(ownerPhone) || [];
  if (!subs.length) {
    console.log(`📲 [GoMate Push] No subscriptions for ${ownerPhone}`);
    return;
  }

  const notification = JSON.stringify({
    title:  payload.title  || '🚜 नवीन बुकिंग आली!',
    body:   payload.body   || 'GoMate वर तुमच्या मशिनरीसाठी नवीन बुकिंग आहे.',
    icon:   payload.icon   || '/icons/icon-192x192.png',
    badge:  payload.badge  || '/icons/favicon-32x32.png',
    tag:    payload.tag    || 'gomate-booking',
    data:   payload.data   || { url: '/owner' },
    vibrate: [200, 100, 200, 100, 400],
    sound: true   // client SW will synthesize the chime
  });

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(sub, notification).catch(async err => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription expired — clean up
          await removeSubscription(ownerPhone, sub.endpoint);
          console.log(`📲 [GoMate Push] Removed stale subscription for ${ownerPhone}`);
        }
        throw err;
      })
    )
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  console.log(`📲 [GoMate Push] Sent ${sent}/${subs.length} notifications to ${ownerPhone}`);
}

/**
 * Broadcast a push to ALL registered owners (e.g. system announcements).
 */
async function broadcastPush(payload) {
  for (const [phone] of subscriptionsByPhone) {
    await sendBookingPush(phone, payload).catch(() => {});
  }
}

module.exports = {
  VAPID_PUBLIC_KEY: () => VAPID_PUBLIC_KEY,
  saveSubscription,
  removeSubscription,
  loadSubscriptionsFromDB,
  sendBookingPush,
  broadcastPush
};
