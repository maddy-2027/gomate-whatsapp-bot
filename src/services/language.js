const en = require('../i18n/en');
const mr = require('../i18n/mr');
const hi = require('../i18n/hi');

const strings = { en, mr, hi };

function getText(lang = 'en', key, vars = {}) {
  const selectedLang = (lang === 'mr' || lang === 'hi' || lang === 'en') ? lang : 'en';
  const dictionary = strings[selectedLang] || strings['en'];
  let text = dictionary[key] || strings['en'][key] || key;
  
  if (typeof text === 'string') {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`{${k}}`, 'g'), v);
    }
  }
  return text;
}

/**
 * Intelligent Language Detector
 * Detects Marathi, Hindi, or English from Devanagari script, Marathi specific particles, or Romanized words.
 */
function detectLanguage(text) {
  if (!text || typeof text !== 'string') return null;
  const t = text.trim();
  const lower = t.toLowerCase();

  // 1. Check for explicit language requests
  if (lower === '1' || lower.includes('मराठी') || lower.includes('marathi')) return 'mr';
  if (lower === '3' || lower.includes('हिंदी') || lower.includes('hindi')) return 'hi';
  if (lower === '2' || lower.includes('english')) return 'en';

  // 2. Devanagari Script Analysis
  const devanagariRegex = /[\u0900-\u097F]/;
  if (devanagariRegex.test(t)) {
    // Marathi specific markers in Devanagari
    const marathiDevanagariWords = ['आहे', 'पाहिजे', 'नाही', 'करा', 'काय', 'कधी', 'कुठे', 'कसा', 'किती', 'द्या', 'घेणे', 'भाड्याने', 'होय', 'शेतकरी', 'ऊस', 'नांगरणी', 'पेरणी', 'ट्रॅक्टर', 'उपकरणे', 'नमस्कार'];
    for (const w of marathiDevanagariWords) {
      if (t.includes(w)) return 'mr';
    }

    // Hindi specific markers in Devanagari
    const hindiDevanagariWords = ['है', 'चाहिए', 'नहीं', 'करो', 'क्या', 'कब', 'कहाँ', 'कैसे', 'कितना', 'दो', 'लेना', 'किराया', 'हाँ', 'किसान', 'नमस्ते', 'धन्यवाद', 'उपकरण'];
    for (const w of hindiDevanagariWords) {
      if (t.includes(w)) return 'hi';
    }

    // Default Devanagari fallback: in Maharashtra, Devanagari defaults to Marathi
    return 'mr';
  }

  // 3. Romanized Marathi / Marathish keywords
  const marathiRoman = [
    'pahije', 'paahije', 'ahe', 'aahe', 'nahit', 'nahi', 'kiti', 'sheti', 'bhav', 'bhada', 
    'bhadyane', 'us', 'toadni', 'kasa', 'kas', 'sangli', 'kolhapur', 'satara', 'pune', 
    'nashik', 'aurangabad', 'solapur', 'nagpur', 'rotavator', 'kay', 'kadhi', 'kuthe', 'namaskar'
  ];
  for (const w of marathiRoman) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) return 'mr';
  }

  // 4. Romanized Hindi / Hinglish keywords
  const hindiRoman = [
    'chahiye', 'chaahiye', 'hai', 'hain', 'kitna', 'kya', 'kaise', 'kab', 'kahan', 'batao', 
    'chahiye tha', 'rent pe', 'kiraya', 'kisaan', 'kheti', 'namaste', 'bhai'
  ];
  for (const w of hindiRoman) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) return 'hi';
  }

  return null;
}

module.exports = { getText, detectLanguage };
