const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { getSession } = require('./session');
const { routeMessage } = require('../handlers/router');

let waClient = null;
let currentQrDataUrl = null;
let isReady = false;

function initWhatsAppWeb(onQrCallback, onReadyCallback) {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

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

  waClient.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp Web Disconnected:', reason);
    isReady = false;
  });

  async function handleIncomingMessage(msg) {
    if (msg.isStatus || msg.from.includes('@g.us') || msg.broadcast) return;

    // Determine clean sender phone
    const from = msg.from;
    const phone = '+' + from.replace('@c.us', '').replace(/@lid$/, '');
    const body = (msg.body || '').trim();

    if (!body) return;

    console.log(`📱 Real WhatsApp message received from ${phone}: "${body}"`);

    try {
      const session = getSession(phone);
      const replyText = await routeMessage(phone, body, session);
      if (replyText) {
        console.log(`💬 Sending WhatsApp reply to ${phone}: "${replyText.substring(0, 50)}..."`);
        await msg.reply(replyText);
      }
    } catch (err) {
      console.error('Error processing real WhatsApp message:', err);
      await msg.reply('Sorry, something went wrong processing your request. Reply "menu" to return to the menu.');
    }
  }

  waClient.on('message', handleIncomingMessage);
  waClient.on('message_create', async (msg) => {
    // If user sends message from the linked phone to itself or tests from bot phone
    if (msg.fromMe && msg.to && msg.to.endsWith('@c.us')) {
      // Don't loop bot replies
      if (msg.body && (msg.body.startsWith('Welcome to GoMate') || msg.body.startsWith('*') || msg.body.startsWith('✅'))) return;
      console.log(`📱 Self message detected: "${msg.body}"`);
      await handleIncomingMessage(msg);
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
    const rawNumber = phone.replace(/[^0-9]/g, '');
    const chatId = `${rawNumber}@c.us`;
    await waClient.sendMessage(chatId, text);
    return true;
  } catch (err) {
    console.error('Error sending direct WhatsApp:', err);
    return false;
  }
}

module.exports = { initWhatsAppWeb, getWhatsAppStatus, sendWhatsAppDirect };

