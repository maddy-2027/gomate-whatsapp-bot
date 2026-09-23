/**
 * GoMate Push Notification Manager
 * Version: 1.0.0
 *
 * Handles:
 *  - Requesting notification permission
 *  - Subscribing to Web Push via the Service Worker
 *  - Sending the subscription to the server
 *  - Providing a UI toggle for the owner portal
 */

(function () {
  'use strict';

  // The VAPID public key is fetched from the server at runtime
  let VAPID_PUBLIC_KEY = null;

  // ─── Utility ─────────────────────────────────────────────────────────────────

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(ch => ch.charCodeAt(0)));
  }

  function getOwnerPhone() {
    // Try localStorage (set at login time in owner.js)
    return localStorage.getItem('gm_owner_phone') ||
           (window.currentOwnerPhone) ||
           null;
  }

  function showPushToast(message, type = 'info') {
    if (typeof showToast === 'function') {
      showToast(message, type);
    } else {
      console.log(`[GoMate Push] ${message}`);
    }
  }

  // ─── Core ────────────────────────────────────────────────────────────────────

  /**
   * Fetch VAPID public key from server.
   */
  async function fetchVapidKey() {
    if (VAPID_PUBLIC_KEY) return VAPID_PUBLIC_KEY;
    try {
      const res = await fetch('/api/push/vapid-key');
      const data = await res.json();
      VAPID_PUBLIC_KEY = data.publicKey;
      return VAPID_PUBLIC_KEY;
    } catch (err) {
      console.warn('[GoMate Push] Could not fetch VAPID key:', err.message);
      return null;
    }
  }

  /**
   * Subscribe this browser to push notifications.
   * Returns the PushSubscription or null on failure.
   */
  async function subscribeToPush(ownerPhone) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      showPushToast('तुमचा ब्राउझर Push Notifications सपोर्ट करत नाही.', 'error');
      return null;
    }

    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      showPushToast('सूचना परवानगी नाकारली. Settings मधून परवानगी द्या.', 'error');
      return null;
    }

    // 2. Get SW registration
    const reg = await navigator.serviceWorker.ready;

    // 3. Fetch VAPID key
    const vapidKey = await fetchVapidKey();
    if (!vapidKey) return null;

    // 4. Subscribe
    let subscription;
    try {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });
    } catch (err) {
      console.error('[GoMate Push] Subscribe error:', err);
      showPushToast('Subscription अयशस्वी झाली: ' + err.message, 'error');
      return null;
    }

    // 5. Send to server
    const phone = ownerPhone || getOwnerPhone();
    if (phone) {
      try {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerPhone: phone, subscription: subscription.toJSON() })
        });
        localStorage.setItem('gm_push_subscribed', '1');
        localStorage.setItem('gm_push_phone', phone);
        showPushToast('🔔 बुकिंग सूचना चालू झाल्या!', 'success');
      } catch (err) {
        console.warn('[GoMate Push] Could not register with server:', err.message);
      }
    }

    return subscription;
  }

  /**
   * Unsubscribe this browser from push notifications.
   */
  async function unsubscribeFromPush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const phone = getOwnerPhone() || localStorage.getItem('gm_push_phone');
        await sub.unsubscribe();
        localStorage.removeItem('gm_push_subscribed');
        if (phone) {
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ownerPhone: phone, endpoint: sub.endpoint })
          }).catch(() => {});
        }
        showPushToast('🔕 बुकिंग सूचना बंद झाल्या.', 'info');
        return true;
      }
    } catch (err) {
      console.warn('[GoMate Push] Unsubscribe error:', err);
    }
    return false;
  }

  /**
   * Check current subscription state and update the toggle button UI.
   */
  async function refreshPushButtonState(btn) {
    if (!btn) return;
    if (!('PushManager' in window)) {
      btn.style.display = 'none';
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      const granted = Notification.permission === 'granted';
      const active  = !!sub && granted;
      updatePushButton(btn, active);
    } catch (_) {}
  }

  function updatePushButton(btn, isActive) {
    if (!btn) return;
    if (isActive) {
      btn.textContent = '🔔 सूचना चालू आहेत';
      btn.style.background      = '#DCFCE7';
      btn.style.borderColor     = '#22C55E';
      btn.style.color           = '#166534';
      btn.dataset.pushActive    = '1';
    } else {
      btn.textContent = '🔕 बुकिंग सूचना चालू करा';
      btn.style.background      = '#F1F5F9';
      btn.style.borderColor     = '#CBD5E1';
      btn.style.color           = '#475569';
      btn.dataset.pushActive    = '0';
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  window.GomatePush = {
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
    refreshButtonState: refreshPushButtonState,

    /**
     * Attach to a button element — toggles push on/off on click.
     * @param {HTMLButtonElement} btn
     * @param {string} ownerPhone
     */
    attachToggle(btn, ownerPhone) {
      if (!btn) return;
      refreshPushButtonState(btn);
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = '⏳ ...';
        const isActive = btn.dataset.pushActive === '1';
        if (isActive) {
          await unsubscribeFromPush();
        } else {
          await subscribeToPush(ownerPhone);
        }
        await refreshPushButtonState(btn);
        btn.disabled = false;
      });
    }
  };

  // Auto-init: if on owner page and push is expected, refresh button state
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('pushToggleBtn');
    if (btn) {
      const phone = getOwnerPhone();
      window.GomatePush.attachToggle(btn, phone);
    }
  });

})();
