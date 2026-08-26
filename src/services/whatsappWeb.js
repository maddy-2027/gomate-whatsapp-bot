const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');
const { getSession } = require('./session');

let waSocket = null;
let currentQrDataUrl = null;
let rawQrCode = null;
let isReady = false;
let connectedUser = null;
const AUTH_DIR = path.join(process.cwd(), '.baileys_auth');

// In-memory debounce set to prevent loop replies
const recentReplies = new Set();

/**
 * Initialize Baileys WhatsApp Web Multi-Device Client
 */
async function initWhatsAppWeb(onQrCallback, onReadyCallback) {
  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    let version = [2, 3000, 1015901307];
    try {
      const v = await fetchLatestBaileysVersion();
      if (v && v.version) version = v.version;
    } catch (e) {}

    waSocket = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['GoMate 24x7 Server', 'Chrome', '126.0.0.0'],
      syncFullHistory: false,
      generateHighQualityLinkPreview: true,
      markOnlineOnConnect: true,
    });

    waSocket.ev.on('creds.update', saveCreds);

    waSocket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        rawQrCode = qr;
        try {
          currentQrDataUrl = await qrcode.toDataURL(qr);
          console.log('\n======================================================');
          console.log('⚡ Scan this WhatsApp QR code to link your phone number:');
          console.log('🌐 Web Dashboard: http://localhost:3000/qr');
          console.log('======================================================\n');
          qrcodeTerminal.generate(qr, { small: true });
          if (onQrCallback) onQrCallback(currentQrDataUrl);
        } catch (err) {
          console.error('Failed to generate QR data URL:', err);
        }
      }

      if (connection === 'open') {
        isReady = true;
        currentQrDataUrl = null;
        rawQrCode = null;
        connectedUser = waSocket.user ? (waSocket.user.name || waSocket.user.id) : 'Connected';
        const cleanPhone = waSocket.user?.id ? '+' + waSocket.user.id.split(':')[0] : 'Your Phone';
        console.log('\n🎉 ======================================================');
        console.log(`🚀 GoMate WhatsApp Bot is LIVE & CONNECTED on ${cleanPhone}!`);
        console.log(`📱 24x7 Real SIM Messaging is ACTIVE without Twilio.`);
        console.log('======================================================\n');
        if (onReadyCallback) onReadyCallback();
      }

      if (connection === 'close') {
        isReady = false;
        currentQrDataUrl = null;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`⚠️ WhatsApp connection closed (Reason: ${statusCode || 'Unknown'}). Reconnecting: ${shouldReconnect}`);

        if (shouldReconnect) {
          setTimeout(() => {
            initWhatsAppWeb(onQrCallback, onReadyCallback);
          }, 3000);
        } else {
          console.log('🔒 WhatsApp logged out. Cleaning session and waiting for new QR scan...');
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          } catch (e) {}
          setTimeout(() => {
            initWhatsAppWeb(onQrCallback, onReadyCallback);
          }, 2000);
        }
      }
    });

    // Listen for incoming WhatsApp messages
    waSocket.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        try {
          if (!msg.message) continue;
          const from = msg.key.remoteJid;

          // Ignore status broadcasts and group messages
          if (!from || from === 'status@broadcast' || from.endsWith('@g.us')) continue;

          // Ignore bot's own outbound messages unless it's testing in self-chat
          if (msg.key.fromMe) continue;

          // Extract message text content
          const msgType = Object.keys(msg.message)[0];
          let body = '';

          if (msgType === 'conversation') {
            body = msg.message.conversation;
          } else if (msgType === 'extendedTextMessage') {
            body = msg.message.extendedTextMessage?.text || '';
          } else if (msgType === 'imageMessage') {
            body = msg.message.imageMessage?.caption || '';
          } else if (msgType === 'locationMessage') {
            const lat = msg.message.locationMessage?.degreesLatitude;
            const lng = msg.message.locationMessage?.degreesLongitude;
            body = `GPS_LOCATION:${lat},${lng}`;
            console.log(`📍 Real GPS location received: ${lat}, ${lng}`);
          }

          body = (body || '').trim();
          if (!body) continue;

          // Anti-loop protection
          if (recentReplies.has(body)) {
            recentReplies.delete(body);
            continue;
          }

          const rawNumber = from.replace('@s.whatsapp.net', '').replace(/:\d+/, '');
          const phone = '+' + rawNumber;

          console.log(`📱 Real WhatsApp Inbound from ${phone}: "${body}"`);

          const { routeMessage } = require('../handlers/router');
          const session = getSession(phone);
          const replyText = await routeMessage(phone, body, session);

          if (replyText) {
            recentReplies.add(replyText.trim());
            setTimeout(() => recentReplies.delete(replyText.trim()), 30000);

            console.log(`💬 Replying to ${phone}: "${replyText.substring(0, 50)}..."`);
            await waSocket.sendMessage(from, { text: replyText });
          }
        } catch (err) {
          console.error('Error handling Baileys message:', err);
        }
      }
    });

  } catch (err) {
    console.error('Failed to initialize Baileys:', err);
  }
}

/**
 * Get current connection status and QR code
 */
function getWhatsAppStatus() {
  const cleanPhone = waSocket?.user?.id ? '+' + waSocket.user.id.split(':')[0] : null;
  return {
    isReady,
    status: isReady ? 'connected' : (currentQrDataUrl ? 'qr_ready' : 'connecting'),
    qrDataUrl: currentQrDataUrl,
    phone: cleanPhone,
    user: connectedUser
  };
}

/**
 * Send an outbound WhatsApp message directly using Baileys
 */
async function sendWhatsAppDirect(phone, text) {
  if (!waSocket || !isReady) {
    console.warn(`[Baileys] Cannot send message to ${phone}: WhatsApp is not connected.`);
    return false;
  }
  try {
    const rawNumber = phone.replace(/[^0-9]/g, '');
    const jid = `${rawNumber}@s.whatsapp.net`;

    await waSocket.sendMessage(jid, { text });
    console.log(`✅ Direct message sent to ${phone}`);
    return true;
  } catch (err) {
    console.error(`Error sending message to ${phone}:`, err.message || err);
    return false;
  }
}

/**
 * Disconnect and logout current session
 */
async function logoutWhatsApp() {
  try {
    if (waSocket) {
      await waSocket.logout();
    }
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    isReady = false;
    currentQrDataUrl = null;
    return { success: true, message: 'Logged out successfully' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = {
  initWhatsAppWeb,
  initBaileys: initWhatsAppWeb,
  getWhatsAppStatus,
  sendWhatsAppDirect,
  logoutWhatsApp
};
