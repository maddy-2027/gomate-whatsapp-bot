/**
 * GoMate Progressive Web App (PWA) Service Worker
 * Version: gomate-pwa-v1.1.0
 * Features:
 *  - Offline caching (shell + static assets)
 *  - Web Push notifications with booking alert sound
 *  - notificationclick → opens /owner tab
 */

const CACHE_NAME = 'gomate-pwa-v1.1.0';

// Critical static assets pre-cached on install
const PRECACHE_ASSETS = [
  '/',
  '/landing',
  '/owner',
  '/qr',
  '/hourly-booking.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32x32.png',
  '/js/pwa.js',
  '/js/push-manager.js',
  '/assets/brand/logo.svg',
  '/assets/brand/logo-white.svg',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap'
];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚡ [GoMate PWA] Pre-caching offline shell...');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('⚠️ [GoMate PWA] Non-fatal precache item skipped:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('🧹 [GoMate PWA] Removing legacy cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extensions
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // 1. API Requests: Network Only with JSON fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'Network unavailable. Operating in offline mode.',
            offline: true,
            timestamp: new Date().toISOString()
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 2. Navigation / Page Requests (HTML): Network-First → Cache → /offline.html
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const offlinePage = await caches.match('/offline.html');
          return offlinePage || new Response('GoMate Offline Mode. Please connect to internet.', {
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  // 3. Static Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// ─── Push Notification ───────────────────────────────────────────────────────

/**
 * Synthesize a tractor chime / horn alert using the Web Audio API.
 * Runs inside the SW using an AudioContext on the client via postMessage.
 * Actually, SW can't use AudioContext directly — we postMessage to the page.
 * The sound is played on the client side via the visible page or a BroadcastChannel.
 */
function playBookingChime() {
  // Broadcast to all open clients — they'll play the sound
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'GOMATE_BOOKING_CHIME' });
    });
  });
}

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: '🚜 GoMate', body: event.data ? event.data.text() : 'नवीन बुकिंग आली!' };
  }

  const title   = data.title  || '🚜 नवीन बुकिंग आली!';
  const options = {
    body:    data.body   || 'GoMate Owner Pro — तुमच्या मशिनरीसाठी नवीन बुकिंग आहे.',
    icon:    data.icon   || '/icons/icon-192x192.png',
    badge:   data.badge  || '/icons/favicon-32x32.png',
    tag:     data.tag    || 'gomate-booking',
    vibrate: data.vibrate || [200, 100, 200, 100, 400],
    data:    data.data   || { url: '/owner' },
    requireInteraction: true,    // stays visible until owner taps it
    actions: [
      { action: 'view',    title: '📋 बुकिंग पहा' },
      { action: 'dismiss', title: '✕ नंतर पाहतो' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // Play chime on all open owner portal windows
      playBookingChime();
    })
  );
});

// ─── Notification Click ──────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  if (action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || '/owner';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Focus existing owner tab if open
      for (const client of clients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname.startsWith('/owner') && 'focus' in client) {
          client.postMessage({ type: 'GOMATE_BOOKING_CHIME' });
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
