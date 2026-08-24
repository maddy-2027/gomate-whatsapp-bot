const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { getSession } = require('./session');

let waClient = null;
let currentQrDataUrl = null;
let isReady = false;

function initWhatsAppWeb(onQrCallback, onReadyCallback) {
  const isWindows = process.platform === 'win32';
  const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
    (isWindows ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/chromium');

  waClient = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1014587000-alpha.html',
    },
    puppeteer: {
      executablePath: chromePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--mute-audio',
        '--no-default-browser-check',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=Translate,BackForwardCache,AcceptCHFrame,MediaRouter,OptimizationHints',
        '--js-flags=--max-old-space-size=256'
      ]
    }
  });

  waClient.on('qr', async (qr) => {
    console.log('⚡ WhatsApp Web QR Code generated!');
    try {
      currentQrDataUrl = await qrcode.toDataURL(qr);
      if (onQrCallback) onQrCallback(currentQrDataUrl);
    } catch (e) {
      console.error('Error generating QR code data URL:', e);
    }
  });

  waClient.on('ready', () => {
    console.log('✅ WhatsApp Web Client is READY and CONNECTED to your phone!');
    isReady = true;
    currentQrDataUrl = null;
    if (onReadyCallback) onReadyCallback();
  });

  waClient.on('authenticated', () => {
    console.log('🔐 WhatsApp Web Authenticated successfully!');
  });

  waClient.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp Web Auth failure:', msg);
    isReady = false;
  });

  waClient.on('disconnected', async (reason) => {
    console.log('⚠️ WhatsApp Web Disconnected:', reason);
    isReady = false;
    currentQrDataUrl = null;
    try {
      await waClient.destroy();
    } catch (e) {}
    setTimeout(() => {
      console.log('🔄 Launching fresh QR pairing for new WhatsApp number...');
      initWhatsAppWeb(onQrCallback, onReadyCallback);
    }, 3000);
  });

  const recentReplies = new Set();

  async function handleIncomingMessage(msg) {
    if (!msg || msg.isStatus || msg.broadcast) return;
    if (msg.from && msg.from.includes('@g.us')) return; // ignore group chats

    // Anti-loop protection: ignore if body was sent by bot itself
    const body = (msg.body || '').trim();
    if (!body) return;

    if (recentReplies.has(body)) {
      recentReplies.delete(body);
      return;
    }

    // If message is fromMe, only process if user is chatting in self-chat (to itself)
    if (msg.fromMe) {
      if (msg.to && msg.from && msg.to !== msg.from) {
        // Message sent from bot to someone else - ignore
        return;
      }
    }

    // Clean sender phone number
    const from = msg.fromMe ? (msg.to || msg.from) : msg.from;
    const phone = '+' + from.replace('@c.us', '').replace(/@lid$/, '');

    let textPayload = body;

    // Check if this is a WhatsApp Location Pin
    if (msg.type === 'location' || (msg.location && msg.location.latitude)) {
      const lat = msg.location.latitude;
      const lng = msg.location.longitude;
      textPayload = `GPS_LOCATION:${lat},${lng}`;
      console.log(`📍 Real WhatsApp GPS Location received from ${phone}: Lat ${lat}, Lng ${lng}`);
    }

    console.log(`📱 Real WhatsApp message received from ${phone} (fromMe: ${msg.fromMe}): "${textPayload}"`);

    try {
      const { routeMessage } = require('../handlers/router');
      const session = getSession(phone);
      const replyText = await routeMessage(phone, textPayload, session);
      if (replyText) {
        console.log(`💬 Sending WhatsApp reply to ${phone}: "${replyText.substring(0, 50)}..."`);
        recentReplies.add(replyText.trim());
        // Auto-cleanup reply set after 30s
        setTimeout(() => recentReplies.delete(replyText.trim()), 30000);
        
        await msg.reply(replyText);
      }
    } catch (err) {
      console.error('Error processing real WhatsApp message:', err);
      try {
        await msg.reply('Sorry, something went wrong processing your request. Reply "0" to return to the menu.');
      } catch (e) {}
    }
  }

  // Listen to both message (from others) and message_create (for self-chat testing)
  waClient.on('message', handleIncomingMessage);
  waClient.on('message_create', (msg) => {
    if (msg.fromMe && msg.to === msg.from) {
      // User is typing to themselves in self-chat!
      handleIncomingMessage(msg);
    }
  });

  waClient.initialize().catch((err) => {
    console.error('Failed to initialize WhatsApp Web client:', err);
  });

  return waClient;
}

function getWhatsAppStatus() {
  return {
    isReady,
    qrDataUrl: currentQrDataUrl
  };
}

async function sendWhatsAppDirect(phone, text) {
  if (!waClient || !isReady) return false;
  try {
    let chatId = phone;
    if (chatId.includes('@')) {
      // already a valid whatsapp chatId
    } else {
      const rawNumber = phone.replace(/[^0-9]/g, '');
      chatId = `${rawNumber}@c.us`;
    }
    
    try {
      const numberId = await waClient.getNumberId(chatId.replace('@c.us', ''));
      if (numberId && numberId._serialized) {
        chatId = numberId._serialized;
      }
    } catch (e) {}

    await waClient.sendMessage(chatId, text);
    console.log(`✅ Direct alert message dispatched to ${chatId}`);
    return true;
  } catch (err) {
    console.error('Error sending direct WhatsApp:', err.message || err);
    return false;
  }
}

module.exports = { initWhatsAppWeb, getWhatsAppStatus, sendWhatsAppDirect };
