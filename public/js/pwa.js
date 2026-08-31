/**
 * GoMate PWA Client Integration
 * Handles Service Worker registration and Offline/Online Toasts.
 */

(function () {
  'use strict';

  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('✅ [GoMate PWA] Service Worker registered with scope:', reg.scope);

          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 [GoMate PWA] New update available.');
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('⚠️ [GoMate PWA] Service Worker registration skipped:', err.message);
        });
    });
  }

  // 2. Online / Offline Toast Notifications
  function showToast(message, type = 'info') {
    let toast = document.getElementById('gomate-net-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'gomate-net-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: calc(84px + env(safe-area-inset-bottom, 0px));
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: #0f172a;
        color: #f8fafc;
        border: 1px solid #334155;
        border-radius: 9999px;
        padding: 10px 20px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
        opacity: 0;
        pointer-events: none;
        max-width: 90vw;
        text-align: center;
      `;
      document.body.appendChild(toast);
    }

    if (type === 'offline') {
      toast.style.borderColor = 'rgba(245, 158, 11, 0.4)';
      toast.style.background = '#1e1b4b';
      toast.innerHTML = `<span style="color: #fbbf24;">📡</span> <span>ऑफलाइन मोड सक्रिय आहे (Offline Mode Active)</span>`;
    } else if (type === 'online') {
      toast.style.borderColor = 'rgba(34, 197, 94, 0.4)';
      toast.style.background = '#064e3b';
      toast.innerHTML = `<span style="color: #4ade80;">🟢</span> <span>इंटरनेट जोडले (Back Online!)</span>`;
    }

    // Show toast
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 50);

    // Hide after 3.5 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(100px)';
    }, 3500);
  }

  window.addEventListener('offline', () => showToast('', 'offline'));
  window.addEventListener('online', () => showToast('', 'online'));

})();

