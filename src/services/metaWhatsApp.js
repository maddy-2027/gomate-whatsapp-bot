/**
 * GoMate - Meta WhatsApp Cloud API Service (Official Meta Graph API)
 * Direct, high-speed, zero-middleman integration for WhatsApp Business API.
 */

const https = require('https');

const GRAPH_API_VERSION = process.env.META_GRAPH_VERSION || 'v22.0';

/**
 * Format phone number to Meta's required format (digits only, no '+' or spaces)
 * e.g., '+91 98765 43210' -> '919876543210'
 */
function formatMetaPhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Send a plain text message via Meta WhatsApp Cloud API
 * @param {string} to - Recipient phone number (e.g. '+919876543210' or '919876543210')
 * @param {string} text - Message text (supports WhatsApp markdown: *bold*, _italic_, etc.)
 * @returns {Promise<object>}
 */
async function sendTextMessage(to, text) {
  const recipient = formatMetaPhone(to);
  if (!recipient || !text) {
    console.warn('⚠️ Meta WhatsApp: Missing recipient or text');
    return { success: false, error: 'Missing recipient or text' };
  }

  const phoneId = process.env.META_PHONE_NUMBER_ID;
  const token = process.env.META_ACCESS_TOKEN;

  if (!phoneId || !token) {
    console.log(`[Meta WhatsApp Mock] To: ${recipient} | Msg: ${text.substring(0, 80)}...`);
    return { success: true, mock: true };
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'text',
    text: {
      preview_url: true,
      body: text
    }
  };

  return await makeGraphApiCall(phoneId, token, payload);
}

/**
 * Send Quick-Reply Interactive Buttons (up to 3 buttons)
 * @param {string} to - Recipient phone
 * @param {string} bodyText - Main text body
 * @param {Array<{id: string, title: string}>} buttons - Array of button objects (max 3)
 * @param {string} [headerText] - Optional header
 * @param {string} [footerText] - Optional footer
 */
async function sendInteractiveButtons(to, bodyText, buttons = [], headerText = '', footerText = 'GoMate 🚜') {
  const recipient = formatMetaPhone(to);
  const phoneId = process.env.META_PHONE_NUMBER_ID;
  const token = process.env.META_ACCESS_TOKEN;

  if (!phoneId || !token) {
    return await sendTextMessage(to, bodyText);
  }

  const formattedButtons = buttons.slice(0, 3).map(btn => ({
    type: 'reply',
    reply: {
      id: btn.id.substring(0, 256),
      title: btn.title.substring(0, 20)
    }
  }));

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: { buttons: formattedButtons }
    }
  };

  if (headerText) payload.interactive.header = { type: 'text', text: headerText.substring(0, 60) };
  if (footerText) payload.interactive.footer = { text: footerText.substring(0, 60) };

  return await makeGraphApiCall(phoneId, token, payload);
}

/**
 * Low-level Graph API POST request
 */
function makeGraphApiCall(phoneId, token, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/${GRAPH_API_VERSION}/${phoneId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: parsed });
          } else {
            console.error('❌ Meta Graph API Error response:', JSON.stringify(parsed));
            resolve({ success: false, error: parsed.error || parsed });
          }
        } catch (e) {
          resolve({ success: false, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Meta Graph API Network Error:', err.message);
      resolve({ success: false, error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

module.exports = {
  sendTextMessage,
  sendInteractiveButtons,
  formatMetaPhone
};
