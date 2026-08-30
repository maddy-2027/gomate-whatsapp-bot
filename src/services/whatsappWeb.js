// Ensure TLS connections succeed across local Windows network environments
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const {
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  initAuthCreds,
  BufferJSON,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');
const { getSession } = require('./session');
const supabase = require('../db/supabase');

let waSocket = null;
let currentQrDataUrl = null;
let rawQrCode = null;
let isReady = false;
let connectedUser = null;
let isInitializing = false;

// Fallback local auth dir (used only when Supabase is unavailable)
const AUTH_DIR = path.join(process.cwd(), '.baileys_auth');

// In-memory debounce set to prevent loop replies
const recentReplies = new Set();

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Supabase-backed Auth State
// Stores creds + keys in the `whatsapp_session` table so they survive deploys.
// Falls back to local filesystem if Supabase is not available.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Check if Supabase is a real client (not the mock fallback)
 */
function isSupabaseReal() {
  try {
    return typeof supabase.auth !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Load session row from Supabase
 */
async function loadSessionFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('whatsapp_session')
      .select('creds, keys')
      .eq('id', 'main')
      .single();
    if (error || !data) return null;
    return data;
  } catch (err) {
    console.warn('âš ï¸ [Session] Could not load from Supabase:', err.message);
    return null;
  }
}

/**
 * Save session data back to Supabase
 */
async function saveSessionToSupabase(creds, keys) {
  try {
    await supabase
      .from('whatsapp_session')
      .upsert(
        { id: 'main', creds, keys, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
  } catch (err) {
    console.warn('âš ï¸ [Session] Could not save to Supabase:', err.message);
  }
}

/**
 * Delete session row from Supabase (on logout)
 */
async function deleteSessionFromSupabase() {
  try {
    await supabase.from('whatsapp_session').delete().eq('id', 'main');
  } catch (err) {
    console.warn('âš ï¸ [Session] Could not delete from Supabase:', err.message);
  }
}

/**
 * Custom auth state backed by Supabase.
 * Compatible with the same interface as useMultiFileAuthState.
 */
async function useSupabaseAuthState() {
  const existing = await loadSessionFromSupabase();

  let creds;
  let keys = {};

  if (existing && existing.creds) {
    try {
      creds = typeof existing.creds === 'string'
        ? JSON.parse(existing.creds, BufferJSON.reviver)
        : existing.creds;
      keys = typeof existing.keys === 'string'
        ? JSON.parse(existing.keys, BufferJSON.reviver)
        : (existing.keys || {});
      console.log('âœ… [Session] WhatsApp session loaded from Supabase â€” no QR needed!');
    } catch (e) {
      console.warn('âš ï¸ [Session] Corrupt Supabase session, starting fresh:', e.message);
      creds = initAuthCreds();
      keys = {};
    }
  } else {
    creds = initAuthCreds();
    keys = {};
    console.log('â„¹ï¸ [Session] No saved session found â€” QR scan required.');
  }

  const state = { creds, keys };

  const saveCreds = async () => {
    try {
      const credsJson = JSON.parse(JSON.stringify(state.creds, BufferJSON.replacer));
      const keysJson = JSON.parse(JSON.stringify(state.keys, BufferJSON.replacer));
      await saveSessionToSupabase(credsJson, keysJson);
    } catch (e) {
      console.warn('âš ï¸ [Session] saveCreds error:', e.message);
    }
  };

  return { state, saveCreds };
}

/**
 * Local filesystem fallback auth state (for local dev without Supabase)
 */
async function useLocalAuthState() {
  const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
  return await useMultiFileAuthState(AUTH_DIR);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Main WhatsApp Initialization
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Initialize Baileys WhatsApp Web Multi-Device Client.
 * Session is persisted to Supabase automatically â€” survives all redeploys.
 */
async function initWhatsAppWeb(onQrCallback, onReadyCallback) {
  if (isInitializing) return;
  isInitializing = true;

  try {
    const useSupabase = isSupabaseReal();
    const { state, saveCreds } = useSupabase
      ? await useSupabaseAuthState()
      : await useLocalAuthState();

    if (!useSupabase) {
      console.warn('âš ï¸ [Session] Supabase unavailable â€” using local filesystem (session will reset on deploy).');
    }

    let version = undefined;
    try {
      const v = await fetchLatestBaileysVersion();
      if (v && v.version) version = v.version;
    } catch (e) {
      // Fallback to Baileys default built-in version
    }

    waSocket = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['GoMate Platform', 'Chrome', '126.0.0.0'],
      syncFullHistory: false,
      generateHighQualityLinkPreview: true,
      markOnlineOnConnect: true,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
    });

    // Save creds to Supabase on every update
    waSocket.ev.on('creds.update', saveCreds);

    waSocket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        rawQrCode = qr;
        try {
          currentQrDataUrl = await qrcode.toDataURL(qr);
          console.log('\n======================================================');
          console.log('âš¡ Scan this WhatsApp QR code to link your phone number:');
          console.log('ðŸŒ Web Dashboard: https://gomate-whatsapp-bot.onrender.com/qr');
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
        console.log('\nðŸŽ‰ ======================================================');
        console.log(`ðŸš€ GoMate WhatsApp Bot is LIVE & CONNECTED on ${cleanPhone}!`);
        console.log(`ðŸ“± Session saved to Supabase â€” auto-reconnects after any deploy.`);
        console.log('======================================================\n');
        if (onReadyCallback) onReadyCallback();
      }

      if (connection === 'close') {
        isReady = false;
        isInitializing = false;
        currentQrDataUrl = null;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`âš ï¸ WhatsApp connection closed (Reason: ${statusCode || 'Unknown'}). Reconnecting: ${shouldReconnect}`);

        if (shouldReconnect) {
          setTimeout(() => {
            initWhatsAppWeb(onQrCallback, onReadyCallback);
          }, 3000);
        } else {
          // User explicitly logged out â€” clear Supabase session too
          console.log('ðŸ”’ WhatsApp logged out. Clearing Supabase session...');
          await deleteSessionFromSupabase();
          try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch (e) {}
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

          // Ignore bot's own outbound messages
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
            console.log(`ðŸ“ Real GPS location received: ${lat}, ${lng}`);
          } else if (msgType === 'audioMessage') {
            console.log(`ðŸŽ™ï¸ Real WhatsApp Voice Note received from ${from}`);
            const { processVoiceNote, formatVoiceAcknowledgment } = require('./voiceService');
            try {
              const buffer = await downloadMediaMessage(msg, 'buffer', {});
              const mimeType = msg.message.audioMessage?.mimetype || 'audio/ogg';
              const rawNumber = from.replace('@s.whatsapp.net', '').replace(/:\d+/, '');
              const userPhone = '+' + rawNumber;
              const session = getSession(userPhone);

              const voiceResult = await processVoiceNote(buffer, mimeType, userPhone, session);
              if (voiceResult && voiceResult.transcript) {
                const ackMsg = formatVoiceAcknowledgment(voiceResult);
                await waSocket.sendMessage(from, { text: ackMsg });
                body = voiceResult.action_text || voiceResult.transcript;
              }
            } catch (audioErr) {
              console.warn('âš ï¸ [Baileys] Voice note download error:', audioErr.message);
            }
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

          console.log(`ðŸ“± Real WhatsApp Inbound from ${phone}: "${body}"`);

          const { routeMessage } = require('../handlers/router');
          const session = getSession(phone);
          const replyText = await routeMessage(phone, body, session);

          if (replyText) {
            recentReplies.add(replyText.trim());
            setTimeout(() => recentReplies.delete(replyText.trim()), 30000);

            console.log(`ðŸ’¬ Replying to ${phone}: "${replyText.substring(0, 50)}..."`);
            await waSocket.sendMessage(from, { text: replyText });
          }
        } catch (err) {
          console.error('Error handling Baileys message:', err);
        }
      }
    });

  } catch (err) {
    console.error('Failed to initialize Baileys:', err);
    isInitializing = false;
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Public API
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

async function sendWhatsAppDirect(phone, text) {
  if (!waSocket || !isReady) {
    console.warn(`[Baileys] Cannot send message to ${phone}: WhatsApp is not connected.`);
    return false;
  }
  try {
    const rawNumber = phone.replace(/[^0-9]/g, '');
    const jid = `${rawNumber}@s.whatsapp.net`;
    await waSocket.sendMessage(jid, { text });
    console.log(`âœ… Direct message sent to ${phone}`);
    return true;
  } catch (err) {
    console.error(`Error sending message to ${phone}:`, err.message || err);
    return false;
  }
}

async function logoutWhatsApp() {
  try {
    if (waSocket) await waSocket.logout();
    await deleteSessionFromSupabase();
    try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch (e) {}
    isReady = false;
    currentQrDataUrl = null;
    waSocket = null;
    isInitializing = false;
    return { success: true, message: 'Logged out and session cleared from Supabase' };
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
