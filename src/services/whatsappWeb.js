// Ensure TLS connections succeed across all network environments
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const {
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  initAuthCreds,
  BufferJSON,
  proto,
  makeCacheableSignalKeyStore
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

// Fallback local auth dir (used for local dev / file cache)
const AUTH_DIR = path.join(process.cwd(), '.baileys_auth');

// In-memory debounce set to prevent loop replies
const recentReplies = new Set();

// ──────────────────────────────────────────────────────────────────────────
// Supabase-backed Persistent Signal Auth State Engine
// Stores creds + all cryptographic signal keys in Supabase so they survive
// all cloud server restarts, container rebuilds, and code redeploys.
// ──────────────────────────────────────────────────────────────────────────

/**
 * Check if Supabase is a real client (not the mock fallback)
 */
function isSupabaseReal() {
  try {
    return typeof supabase.auth !== 'undefined' || (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
  } catch {
    return false;
  }
}

/**
 * Load full auth state (creds + keys) from Supabase
 */
async function loadSessionFromSupabase() {
  try {
    // 1. Primary check in whatsapp_session table
    let { data, error } = await supabase
      .from('whatsapp_session')
      .select('creds, keys')
      .eq('id', 'main')
      .single();

    // 2. Backup check in sessions table if whatsapp_session returned nothing
    if (error || !data || !data.creds) {
      const fallback = await supabase
        .from('sessions')
        .select('flow_state')
        .eq('phone', 'whatsapp_auth_main')
        .single();
      if (fallback.data && fallback.data.flow_state && fallback.data.flow_state.creds) {
        data = fallback.data.flow_state;
      }
    }

    if (!data || !data.creds) return null;

    const creds = typeof data.creds === 'string'
      ? JSON.parse(data.creds, BufferJSON.reviver)
      : data.creds;

    const keys = typeof data.keys === 'string'
      ? JSON.parse(data.keys, BufferJSON.reviver)
      : (data.keys || {});

    return { creds, keys };
  } catch (err) {
    console.warn('⚠️ [Session] Could not load from Supabase:', err.message);
    return null;
  }
}

/**
 * Save full auth state (creds + all signal keys) to Supabase with dual-table redundancy
 */
async function saveSessionToSupabase(creds, keys) {
  try {
    const credsJson = JSON.parse(JSON.stringify(creds, BufferJSON.replacer));
    const keysJson = JSON.parse(JSON.stringify(keys, BufferJSON.replacer));

    // 1. Primary save to whatsapp_session
    const { error } = await supabase
      .from('whatsapp_session')
      .upsert(
        { id: 'main', creds: credsJson, keys: keysJson, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );

    // 2. Redundant backup save to sessions table
    await supabase
      .from('sessions')
      .upsert(
        { phone: 'whatsapp_auth_main', flow_state: { creds: credsJson, keys: keysJson }, last_message_at: new Date().toISOString() },
        { onConflict: 'phone' }
      ).catch(() => {});

    if (!error) {
      // Also backup to local disk cache if writable
      try {
        if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
        fs.writeFileSync(path.join(AUTH_DIR, 'session_backup.json'), JSON.stringify({ creds: credsJson, keys: keysJson }), 'utf8');
      } catch (e) {}
    }
  } catch (err) {
    console.warn('⚠️ [Session] Could not save to Supabase:', err.message);
  }
}

/**
 * Delete session row from Supabase (only on explicit user logout)
 */
async function deleteSessionFromSupabase() {
  try {
    await supabase.from('whatsapp_session').delete().eq('id', 'main');
    await supabase.from('sessions').delete().eq('phone', 'whatsapp_auth_main');
    try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch (e) {}
    console.log('🗑️ [Session] Cleared WhatsApp session from database.');
  } catch (err) {
    console.warn('⚠️ [Session] Could not delete from Supabase:', err.message);
  }
}

/**
 * Full Baileys AuthenticationState backed by Supabase with SignalKeyStore
 */
async function useSupabaseAuthState() {
  const loaded = await loadSessionFromSupabase();

  let creds;
  const keyCache = new Map();

  if (loaded && loaded.creds) {
    creds = loaded.creds;
    if (loaded.keys) {
      for (const [k, v] of Object.entries(loaded.keys)) {
        keyCache.set(k, v);
      }
    }
    console.log('✅ [Session] Restored active WhatsApp session from Supabase — no QR scan needed!');
  } else {
    creds = initAuthCreds();
    console.log('ℹ️ [Session] No previous WhatsApp session found in database — QR scan required.');
  }

  let saveTimer = null;
  const scheduleSave = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const keysObj = {};
      for (const [k, v] of keyCache.entries()) {
        keysObj[k] = v;
      }
      await saveSessionToSupabase(creds, keysObj);
    }, 400); // 400ms debounce
  };

  const keys = {
    get: async (type, ids) => {
      const data = {};
      for (const id of ids) {
        const fileKey = `${type}-${id}`;
        let value = keyCache.get(fileKey);
        if (value && type === 'app-state-sync-key') {
          value = proto.Message.AppStateSyncKeyData.fromObject(value);
        }
        data[id] = value || null;
      }
      return data;
    },
    set: async (data) => {
      for (const category in data) {
        for (const id in data[category]) {
          const fileKey = `${category}-${id}`;
          const value = data[category][id];
          if (value) {
            keyCache.set(fileKey, value);
          } else {
            keyCache.delete(fileKey);
          }
        }
      }
      scheduleSave();
    }
  };

  const state = {
    creds,
    keys: makeCacheableSignalKeyStore(keys, pino({ level: 'silent' }))
  };

  const saveCreds = async () => {
    scheduleSave();
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

// ──────────────────────────────────────────────────────────────────────────
// Main WhatsApp Initialization & Lifecycle Management
// ──────────────────────────────────────────────────────────────────────────

/**
 * Initialize Baileys WhatsApp Web Multi-Device Client.
 * Session is persisted to Supabase automatically — survives all redeploys.
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
      console.warn('⚠️ [Session] Supabase unavailable — using local filesystem (session will reset on deploy).');
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
          console.log('⚡ Scan this WhatsApp QR code to link your phone number:');
          console.log('🌐 Web Dashboard: https://gomate-whatsapp-bot.onrender.com/qr');
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
        isInitializing = false;
        connectedUser = waSocket.user ? (waSocket.user.name || waSocket.user.id) : 'Connected';
        const cleanPhone = waSocket.user?.id ? '+' + waSocket.user.id.split(':')[0] : 'Your Phone';
        console.log('\n🎉 ======================================================');
        console.log(`🚀 GoMate WhatsApp Bot is LIVE & CONNECTED on ${cleanPhone}!`);
        console.log(`📱 Session saved to Supabase — auto-reconnects after any deploy.`);
        console.log('======================================================\n');
        if (onReadyCallback) onReadyCallback();
      }

      if (connection === 'close') {
        isReady = false;
        isInitializing = false;
        currentQrDataUrl = null;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`⚠️ WhatsApp connection closed (Reason: ${statusCode || 'Unknown'}). Reconnecting: ${shouldReconnect}`);

        if (shouldReconnect) {
          setTimeout(() => {
            initWhatsAppWeb(onQrCallback, onReadyCallback);
          }, 3000);
        } else {
          // User explicitly logged out from WhatsApp on their phone — clear Supabase session too
          console.log('🔒 WhatsApp logged out from phone. Clearing Supabase session...');
          await deleteSessionFromSupabase();
          setTimeout(() => {
            initWhatsAppWeb(onQrCallback, onReadyCallback);
          }, 2000);
        }
      }
    });

    // Handle Incoming Messages
    waSocket.ev.on('messages.upsert', async (m) => {
      if (m.type !== 'notify') return;

      for (const msg of m.messages) {
        if (msg.key.fromMe) continue;
        if (!msg.message) continue;

        const senderJid = msg.key.remoteJid;
        if (!senderJid || senderJid.endsWith('@g.us') || senderJid.includes('status@broadcast')) continue;

        const cleanPhone = '+' + senderJid.replace('@s.whatsapp.net', '');
        const messageId = msg.key.id;

        // Debounce recent message IDs to prevent duplicate processing
        if (recentReplies.has(messageId)) continue;
        recentReplies.add(messageId);
        setTimeout(() => recentReplies.delete(messageId), 30000);

        let incomingText = '';
        let isAudioMessage = false;

        if (msg.message.conversation) {
          incomingText = msg.message.conversation;
        } else if (msg.message.extendedTextMessage?.text) {
          incomingText = msg.message.extendedTextMessage.text;
        } else if (msg.message.audioMessage) {
          isAudioMessage = true;
          incomingText = '[VOICE_NOTE_AUDIO]';
        } else if (msg.message.locationMessage) {
          const loc = msg.message.locationMessage;
          incomingText = `GPS_LOCATION:${loc.degreesLatitude},${loc.degreesLongitude}`;
        }

        if (!incomingText && !isAudioMessage) continue;

        console.log(`📩 [WhatsApp Web] From ${cleanPhone}: ${incomingText}`);

        try {
          const session = getSession(cleanPhone);
          const { routeMessage } = require('../handlers/router');
          const replyText = await routeMessage(cleanPhone, incomingText, session);

          if (replyText) {
            await waSocket.sendMessage(senderJid, { text: replyText });
            console.log(`📤 [WhatsApp Web] Replied to ${cleanPhone}`);
          }
        } catch (err) {
          console.error(`❌ [WhatsApp Web] Error handling message from ${cleanPhone}:`, err);
        }
      }
    });

  } catch (err) {
    isInitializing = false;
    console.error('❌ Failed to initialize Baileys WhatsApp client:', err);
  }
}

/**
 * Send WhatsApp text message directly
 */
async function sendWhatsAppDirect(phone, text) {
  if (!waSocket || !isReady) {
    console.warn(`⚠️ WhatsApp Web socket not connected. Could not send message to ${phone}`);
    return false;
  }
  try {
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const jid = `${cleanNumber}@s.whatsapp.net`;
    await waSocket.sendMessage(jid, { text });
    return true;
  } catch (err) {
    console.error(`❌ Error sending direct WhatsApp to ${phone}:`, err.message);
    return false;
  }
}

/**
 * Log out from current WhatsApp session
 */
async function logoutWhatsApp() {
  if (waSocket) {
    try {
      await waSocket.logout();
    } catch (e) {}
    waSocket = null;
  }
  await deleteSessionFromSupabase();
  isReady = false;
  connectedUser = null;
  currentQrDataUrl = null;
  rawQrCode = null;
  isInitializing = false;
}

/**
 * Get current status of WhatsApp Web connection
 */
function getWhatsAppStatus() {
  return {
    isReady,
    connectedUser,
    hasQr: !!currentQrDataUrl,
    qrDataUrl: currentQrDataUrl,
    rawQr: rawQrCode
  };
}

module.exports = {
  initWhatsAppWeb,
  getWhatsAppStatus,
  sendWhatsAppDirect,
  logoutWhatsApp
};
