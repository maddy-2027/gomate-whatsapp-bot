const en = require('../i18n/en');
const mr = require('../i18n/mr');
const hi = require('../i18n/hi');

const strings = { en, mr, hi };

function getText(lang = 'en', key, vars = {}) {
  const dictionary = strings[lang] || strings['en'];
  let text = dictionary[key] || strings['en'][key] || key;
  
  if (typeof text === 'string') {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`{${k}}`, 'g'), v);
    }
  }
  return text;
}

function detectLanguage(text) {
  const devanagariRegex = /[\u0900-\u097F]/;
  if (devanagariRegex.test(text)) {
    if (text.includes('आहे') || text.includes('मराठी')) return 'mr';
    return 'hi';
  }
  return 'en';
}

module.exports = { getText, detectLanguage };
