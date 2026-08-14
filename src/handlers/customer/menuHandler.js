const { sendWhatsApp } = require('../../services/twilio');
const { getText } = require('../../services/language');

async function showMenu(phone, lang, role) {
  const text = role === 'customer' ? getText(lang, 'customer_menu') : getText(lang, 'owner_menu');
  await sendWhatsApp(phone, text);
}

module.exports = { showMenu };
