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
        '--disable-gpu'
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

  async function handleIncomingMessage(msg) {
    // 1. Strict self-loop protection: Ignore any outgoing message sent by the bot itself
    if (!msg || msg.fromMe || msg.isStatus || msg.broadcast) return;
    if (msg.from && msg.from.includes('@g.us')) return; // ignore group chats

    // 2. Clean sender phone number
    const from = msg.from;
    const phone = '+' + from.replace('@c.us', '').replace(/@lid$/, '');
    let body = (msg.body || '').trim();

    // 3. Check if this is a WhatsApp Location Pin
    if (msg.type === 'location' || (msg.location && msg.location.latitude)) {
      const lat = msg.location.latitude;
      const lng = msg.location.longitude;
      body = `GPS_LOCATION:${lat},${lng}`;
      console.log(`📍 Real WhatsApp GPS Location received from ${phone}: Lat ${lat}, Lng ${lng}`);
    }

    if (!body) return;

    console.log(`📱 Real WhatsApp message received from ${phone}: "${body}"`);

    try {
      const { routeMessage } = require('../handlers/router');
      const session = getSession(phone);
      const replyText = await routeMessage(phone, body, session);
      if (replyText) {
        console.log(`💬 Sending WhatsApp reply to ${phone}: "${replyText.substring(0, 50)}..."`);
        await msg.reply(replyText);
      }
    } catch (err) {
      console.error('Error processing real WhatsApp message:', err);
      try {
        await msg.reply('Sorry, something went wrong processing your request. Reply "0" to return to the menu.');
      } catch (e) {}
    }
  }

  // Handle ONLY incoming messages from external senders (never message_create)
  waClient.on('message', handleIncomingMessage);

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
