const https = require('https');
const http = require('http');

let keepAliveInterval = null;
let lastPingTime = null;
let lastPingStatus = null;

/**
 * Initializes automatic keep-alive self-pinging every 8 minutes
 * to ensure Render / cloud instances stay warm and never go to sleep.
 */
function initKeepAlive(appUrl, intervalMinutes = 8) {
  if (keepAliveInterval) clearInterval(keepAliveInterval);

  const targetUrl = appUrl || process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;

  if (!targetUrl) {
    console.log('ℹ️ [KeepAlive] No external URL configured. Skipping self-ping.');
    return;
  }

  const pingUrl = targetUrl.endsWith('/') ? `${targetUrl}api/health` : `${targetUrl}/api/health`;
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`⏱️ [KeepAlive] Initialized 24/7 keep-alive pinger for: ${pingUrl} (every ${intervalMinutes}m)`);

  const doPing = () => {
    try {
      const client = pingUrl.startsWith('https') ? https : http;
      const req = client.get(pingUrl, (res) => {
        lastPingTime = new Date().toISOString();
        lastPingStatus = res.statusCode === 200 ? 'OK' : `HTTP ${res.statusCode}`;
        console.log(`💓 [KeepAlive Heartbeat] Self-ping successful: ${lastPingStatus} at ${lastPingTime}`);
      });

      req.on('error', (err) => {
        lastPingTime = new Date().toISOString();
        lastPingStatus = `Error: ${err.message}`;
        console.warn(`⚠️ [KeepAlive Heartbeat] Self-ping warning: ${err.message}`);
      });

      req.setTimeout(10000, () => {
        req.destroy();
      });
    } catch (e) {
      console.warn(`⚠️ [KeepAlive] Execution error:`, e.message);
    }
  };

  // Run first ping after 30 seconds, then every 8 minutes
  setTimeout(doPing, 30000);
  keepAliveInterval = setInterval(doPing, intervalMs);
}

function getKeepAliveStatus() {
  return {
    active: !!keepAliveInterval,
    lastPingTime,
    lastPingStatus
  };
}

module.exports = { initKeepAlive, getKeepAliveStatus };
