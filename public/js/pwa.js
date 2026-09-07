/**
 * GoMate Progressive Web App (PWA) Client Controller
 * Version: 2.0.0
 * Features:
 * - Service Worker Registration & Live Updates
 * - Native beforeinstallprompt capture & triggers
 * - Universal UI Install Buttons (Header button, Floating Button & Modal guide)
 * - Desktop Chrome / Edge & Mobile Android / iOS Safari installation guidance
 * - Online / Offline network toast banners
 */

(function () {
  'use strict';

  // 1. Service Worker Lifecycle
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('✅ [GoMate PWA] Service Worker registered (scope:', reg.scope, ')');

          // Listen for new worker updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 [GoMate PWA] New app update available.');
                  showToast('GoMate अपडेट उपलब्ध आहे (App updated)', 'info');
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('⚠️ [GoMate PWA] SW registration skipped:', err.message);
        });
    });
  }

  // 2. Online / Offline Status Toast
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
      toast.innerHTML = `<span style="color: #fbbf24;">📡</span> <span>ऑफलाइन मोड (Offline Mode Active)</span>`;
    } else if (type === 'online') {
      toast.style.borderColor = 'rgba(34, 197, 94, 0.4)';
      toast.style.background = '#064e3b';
      toast.innerHTML = `<span style="color: #4ade80;">🟢</span> <span>इंटरनेट जोडले (Back Online!)</span>`;
    } else {
      toast.style.borderColor = 'rgba(37, 99, 235, 0.4)';
      toast.style.background = '#0f172a';
      toast.innerHTML = `<span>ℹ️</span> <span>${message}</span>`;
    }

    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 50);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(100px)';
    }, 3500);
  }

  window.addEventListener('offline', () => showToast('', 'offline'));
  window.addEventListener('online', () => showToast('', 'online'));

  // 3. PWA Installation Management
  let deferredPrompt = null;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // Check if iOS device
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Render or activate UI Install Triggers
  function setupInstallUI() {
    if (isStandalone) {
      console.log('📱 [GoMate PWA] Already running in standalone app mode.');
      return;
    }

    // A. Sync any existing declared install buttons (like in navbar or header)
    const pageButtons = document.querySelectorAll('.gm-pwa-install-trigger, [data-action="install-pwa"]');
    pageButtons.forEach(btn => {
      btn.style.display = 'inline-flex';
      btn.addEventListener('click', handleInstallClick);
    });

    // B. Inject Floating Install Pill if not already installed and not dismissed
    if (!document.getElementById('gomate-install-pill')) {
      const pill = document.createElement('div');
      pill.id = 'gomate-install-pill';
      pill.setAttribute('role', 'banner');
      pill.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 9998;
        display: flex;
        align-items: center;
        gap: 10px;
        background: #0A1F44;
        border: 1.5px solid #22C55E;
        box-shadow: 0 12px 30px rgba(10, 31, 68, 0.5), 0 4px 12px rgba(34, 197, 94, 0.3);
        border-radius: 50px;
        padding: 6px 8px 6px 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #FFFFFF;
        animation: gm-pill-pop 0.4s ease-out;
      `;

      pill.innerHTML = `
        <img src="/icons/favicon-32x32.png" alt="GoMate" width="26" height="26" style="border-radius: 6px; display: block;">
        <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.15;">
          <span style="font-size: 12.5px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.2px;">Install GoMate App</span>
          <span style="font-size: 10.5px; color: #86EFAC; font-weight: 600;">जलद बुकिंग • Offline Support</span>
        </div>
        <button id="gm-pill-action-btn" type="button" style="
          background: #22C55E;
          color: #FFFFFF;
          border: none;
          border-radius: 50px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-left: 4px;
          transition: background 0.15s, transform 0.1s;
        ">
          <span>📲 Install</span>
        </button>
        <button id="gm-pill-close-btn" type="button" aria-label="Dismiss install banner" style="
          background: transparent;
          color: #94A3B8;
          border: none;
          font-size: 16px;
          cursor: pointer;
          padding: 4px 8px;
          line-height: 1;
        ">✕</button>
      `;

      // Animation style
      if (!document.getElementById('gm-pwa-styles')) {
        const style = document.createElement('style');
        style.id = 'gm-pwa-styles';
        style.textContent = `
          @keyframes gm-pill-pop {
            0% { transform: translateY(60px) scale(0.9); opacity: 0; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
          }
          #gm-pill-action-btn:hover { background: #16A34A !important; transform: scale(1.03); }
          #gm-pill-close-btn:hover { color: #FFFFFF !important; }
          @media (max-width: 600px) {
            #gomate-install-pill {
              left: 12px;
              right: 12px;
              bottom: 80px;
              justify-content: space-between;
              border-radius: 12px;
              padding: 8px 12px;
            }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(pill);

      document.getElementById('gm-pill-action-btn').addEventListener('click', handleInstallClick);
      document.getElementById('gm-pill-close-btn').addEventListener('click', () => {
        pill.style.display = 'none';
        sessionStorage.setItem('gm_install_pill_dismissed', '1');
      });

      if (sessionStorage.getItem('gm_install_pill_dismissed') === '1') {
        pill.style.display = 'none';
      }
    }
  }

  // Handle Install Action (Prompt or Guide Modal)
  async function handleInstallClick(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (deferredPrompt) {
      // Trigger native browser install dialog
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('Installation prompt outcome:', outcome);
      if (outcome === 'accepted') {
        removeInstallUI();
      }
      deferredPrompt = null;
    } else {
      // Show polite guide modal for Desktop Chrome/Edge or iOS Safari
      showInstallInstructionsModal();
    }
  }

  // Instructions Modal for browsers without active beforeinstallprompt
  function showInstallInstructionsModal() {
    let modal = document.getElementById('gm-install-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'gm-install-modal';
      modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(6px);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      `;

      let instructionBody = '';
      if (isIOS) {
        instructionBody = `
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px; margin: 16px 0; text-align: left; font-size: 13px; line-height: 1.6; color: #1E293B;">
            <p style="margin: 0 0 8px;"><strong>iOS Safari वर इन्स्टॉल करण्यासाठी:</strong></p>
            <ol style="margin: 0; padding-left: 20px;">
              <li>Safari च्या तळाशी असलेल्या <strong>Share (शेअर)</strong> बटनावर टॅप करा (<span style="font-size: 16px;">⎋</span>).</li>
              <li>खाली स्क्रोल करून <strong>"Add to Home Screen"</strong> (होम स्क्रीनवर जोडा) निवडा.</li>
              <li>वरच्या उजव्या कोपऱ्यात <strong>"Add"</strong> वर टॅप करा.</li>
            </ol>
          </div>
        `;
      } else {
        instructionBody = `
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px; margin: 16px 0; text-align: left; font-size: 13px; line-height: 1.6; color: #1E293B;">
            <p style="margin: 0 0 8px;"><strong>ब्राउझरवरून थेट इन्स्टॉल करण्यासाठी:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Chrome / Edge Browser:</strong> URL बारच्या उजव्या बाजूला असलेल्या <strong>Install (अ‍ॅप इंस्टॉल करा)</strong> आयकॉनवर क्लिक करा (🖥️ / ⬇️).</li>
              <li>किंवा ब्राउझरच्या तीन टिंबांच्या मेनूवर (<strong style="font-size: 15px;">⋮</strong>) क्लिक करून <strong>"Save and share" / "Apps" $\\to$ "Install GoMate"</strong> निवडा.</li>
            </ul>
          </div>
        `;
      }

      modal.innerHTML = `
        <div style="
          background: #FFFFFF;
          border-radius: 16px;
          max-width: 440px;
          width: 100%;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          border: 1px solid #CBD5E1;
          text-align: center;
          position: relative;
        ">
          <button id="gm-close-install-modal" style="
            position: absolute;
            top: 14px;
            right: 14px;
            background: #F1F5F9;
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            font-size: 14px;
            cursor: pointer;
            color: #64748B;
          ">✕</button>

          <img src="/icons/icon-192x192.png" alt="GoMate Logo" width="68" height="68" style="border-radius: 16px; box-shadow: 0 8px 16px rgba(10,31,68,0.2); margin: 0 auto 12px; display: block;">
          
          <h3 style="font-size: 19px; font-weight: 800; color: #0A1F44; margin: 0 0 4px;">GoMate App Install करा</h3>
          <p style="font-size: 13px; color: #64748B; margin: 0;">अधिक जलद ट्रॅक्टर व मशिनरी बुकिंगसाठी GoMate अ‍ॅप इन्स्टॉल करा.</p>

          ${instructionBody}

          <button id="gm-dismiss-install-modal" style="
            width: 100%;
            background: #0A1F44;
            color: #FFFFFF;
            font-weight: 700;
            padding: 12px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            cursor: pointer;
          ">समजले (Got it)</button>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('gm-close-install-modal').addEventListener('click', () => {
        modal.style.display = 'none';
      });
      document.getElementById('gm-dismiss-install-modal').addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    modal.style.display = 'flex';
  }

  function removeInstallUI() {
    const pill = document.getElementById('gomate-install-pill');
    if (pill) pill.remove();
    const modal = document.getElementById('gm-install-modal');
    if (modal) modal.style.display = 'none';
    const buttons = document.querySelectorAll('.gm-pwa-install-trigger');
    buttons.forEach(btn => {
      btn.innerHTML = '<span>✅ Installed</span>';
      btn.disabled = true;
    });
  }

  // Listen for browser's beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('⚡ [GoMate PWA] beforeinstallprompt event captured!');
    e.preventDefault();
    deferredPrompt = e;
    setupInstallUI();
  });

  // App installed event
  window.addEventListener('appinstalled', () => {
    console.log('🎉 [GoMate PWA] App was successfully installed!');
    deferredPrompt = null;
    removeInstallUI();
    showToast('GoMate अ‍ॅप यशस्वीरित्या इन्स्टॉल झाले! (App Installed)', 'online');
  });

  // Initialize UI on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupInstallUI);
  } else {
    setupInstallUI();
  }

  // Expose helper globally
  window.GoMatePWA = {
    install: handleInstallClick,
    isInstalled: () => isStandalone
  };

})();
