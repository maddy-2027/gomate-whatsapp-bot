const fs = require('fs');
const path = require('path');

const files = {
  'package.json': `{
  "name": "gomate-whatsapp-bot",
  "version": "1.0.0",
  "description": "GoMate WhatsApp chatbot for equipment rental marketplace",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node src/data/seed.js"
  },
  "dependencies": {
    "@google/genai": "^0.1.1",
    "@supabase/supabase-js": "^2.42.0",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "razorpay": "^2.9.3",
    "twilio": "^5.0.4",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}`,
  '.env.example': `PORT=3000
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret`,
  '.gitignore': `node_modules/
.env`,
  'server.js': `const express = require('express');
const config = require('./src/config');
const webhookHandler = require('./src/handlers/webhook');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/webhook', webhookHandler);

app.listen(config.port, () => {
  console.log(\`GoMate WhatsApp bot server running on port \${config.port}\`);
});`,
  'README.md': `# GoMate WhatsApp Chatbot

Equipment rental marketplace bot for WhatsApp.
Tech Stack: Node.js, Express, Twilio, Gemini AI, Supabase, Razorpay.
`,
  'src/config/index.js': `require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || 'dummy_sid',
    authToken: process.env.TWILIO_AUTH_TOKEN || 'dummy_token',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'dummy_key'
  },
  supabase: {
    url: process.env.SUPABASE_URL || 'https://dummy.supabase.co',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || 'dummy_key'
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret'
  }
};`,
  'supabase/migrations/001_initial_schema.sql': `CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    role VARCHAR(20) CHECK (role IN ('customer', 'owner')),
    language VARCHAR(10) CHECK (language IN ('en', 'mr', 'hi')),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    district VARCHAR(100),
    language VARCHAR(10) CHECK (language IN ('en', 'mr', 'hi')),
    subscription_status VARCHAR(20) CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')) DEFAULT 'trial',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    razorpay_subscription_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
    category VARCHAR(50),
    type VARCHAR(50),
    model VARCHAR(100),
    district VARCHAR(100),
    taluka VARCHAR(100),
    price_per_day DECIMAL(10, 2),
    available BOOLEAN DEFAULT true,
    rating DECIMAL(3, 2) DEFAULT 0.0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_ref VARCHAR(20) UNIQUE NOT NULL,
    equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(100),
    start_date DATE NOT NULL,
    duration_days INTEGER NOT NULL,
    total_amount DECIMAL(10, 2),
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`,
  'src/db/supabase.js': `const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

let supabase = null;
if (config.supabase.url !== 'https://dummy.supabase.co') {
  supabase = createClient(config.supabase.url, config.supabase.serviceKey);
} else {
  console.warn('Supabase not configured. Using dummy client.');
  supabase = {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }), limit: () => ({ data: [], error: null }) }) }),
      insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
      update: () => ({ eq: () => ({ data: null, error: null }) }),
      upsert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) })
    })
  };
}

module.exports = supabase;`,
  'src/db/users.repo.js': `const supabase = require('./supabase');

async function getUser(phone) {
  const { data, error } = await supabase.from('users').select('*').eq('phone', phone).single();
  return data;
}

async function upsertUser(userData) {
  const { data, error } = await supabase.from('users').upsert(userData).select().single();
  if (error) console.error('Error upserting user:', error);
  return data;
}

module.exports = { getUser, upsertUser };`,
  'src/db/owners.repo.js': `const supabase = require('./supabase');

async function getOwner(phone) {
  const { data, error } = await supabase.from('owners').select('*').eq('phone', phone).single();
  return data;
}

async function upsertOwner(ownerData) {
  const { data, error } = await supabase.from('owners').upsert(ownerData).select().single();
  if (error) console.error('Error upserting owner:', error);
  return data;
}

module.exports = { getOwner, upsertOwner };`,
  'src/db/equipment.repo.js': `const supabase = require('./supabase');

async function searchEquipment(criteria) {
  let query = supabase.from('equipment').select('*, owners(phone, name)');
  if (criteria.category) query = query.eq('category', criteria.category);
  if (criteria.district) query = query.eq('district', criteria.district);
  query = query.eq('available', true).limit(10);
  const { data, error } = await query;
  if (error) console.error('Error searching equipment:', error);
  return data || [];
}

async function addEquipment(equipmentData) {
  const { data, error } = await supabase.from('equipment').insert([equipmentData]).select().single();
  if (error) console.error('Error adding equipment:', error);
  return data;
}

module.exports = { searchEquipment, addEquipment };`,
  'src/db/bookings.repo.js': `const supabase = require('./supabase');

async function createBooking(bookingData) {
  const { data, error } = await supabase.from('bookings').insert([bookingData]).select().single();
  if (error) console.error('Error creating booking:', error);
  return data;
}

async function getBookingStatus(ref) {
  const { data, error } = await supabase.from('bookings').select('*, equipment(*)').eq('booking_ref', ref).single();
  return data;
}

module.exports = { createBooking, getBookingStatus };`,
  'src/i18n/en.js': `module.exports = {
  welcome: "Welcome to GoMate! Please select your language:\\n1. English\\n2. मराठी\\n3. हिन्दी",
  role_select: "Are you a Customer or an Equipment Owner?\\n1. Customer\\n2. Owner",
  customer_menu: "Customer Menu:\\n1. Search Equipment\\n2. Check Booking Status",
  owner_menu: "Owner Menu:\\n1. List Equipment\\n2. My Dashboard\\n3. Manage Subscription",
  search_prompt: "What type of equipment are you looking for? (e.g., Tractors, Excavators)"
};`,
  'src/i18n/mr.js': `module.exports = {
  welcome: "गोमेटमध्ये आपले स्वागत आहे! कृपया आपली भाषा निवडा:\\n1. English\\n2. मराठी\\n3. हिन्दी",
  role_select: "तुम्ही ग्राहक आहात की उपकरण मालक?\\n1. ग्राहक\\n2. मालक",
  customer_menu: "ग्राहक मेनू:\\n1. उपकरण शोधा\\n2. बुकिंग स्थिती तपासा",
  owner_menu: "मालक मेनू:\\n1. उपकरणे सूचीबद्ध करा\\n2. माझा डॅशबोर्ड\\n3. सदस्यता व्यवस्थापित करा",
  search_prompt: "तुम्ही कोणत्या प्रकारचे उपकरण शोधत आहात? (उदा. ट्रॅक्टर, जेसीबी)"
};`,
  'src/i18n/hi.js': `module.exports = {
  welcome: "गोमेट में आपका स्वागत है! कृपया अपनी भाषा चुनें:\\n1. English\\n2. मराठी\\n3. हिन्दी",
  role_select: "क्या आप ग्राहक हैं या उपकरण के मालिक?\\n1. ग्राहक\\n2. मालिक",
  customer_menu: "ग्राहक मेनू:\\n1. उपकरण खोजें\\n2. बुकिंग स्थिति जांचें",
  owner_menu: "मालिक मेनू:\\n1. उपकरण सूचीबद्ध करें\\n2. मेरा डैशबोर्ड\\n3. सदस्यता प्रबंधित करें",
  search_prompt: "आप किस प्रकार का उपकरण ढूंढ रहे हैं? (उदा. ट्रैक्टर, खुदाई करने वाली मशीन)"
};`,
  'src/services/twilio.js': `const twilio = require('twilio');
const config = require('../config');

let client = null;
if (config.twilio.accountSid !== 'dummy_sid') {
  client = twilio(config.twilio.accountSid, config.twilio.authToken);
} else {
  console.warn('Twilio not configured. Using mock client.');
  client = { messages: { create: async (msg) => console.log('Mock WhatsApp Message sent:', msg) } };
}

async function sendWhatsApp(to, body) {
  try {
    await client.messages.create({
      body: body,
      from: config.twilio.whatsappNumber,
      to: to
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}

module.exports = { sendWhatsApp };`,
  'src/services/gemini.js': `const { GoogleGenAI } = require('@google/genai');
const config = require('../config');

let ai = null;
if (config.gemini.apiKey !== 'dummy_key') {
  ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
}

async function getChatResponse(prompt, context) {
  if (!ai) return 'AI response placeholder (Gemini not configured). Context: ' + JSON.stringify(context);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt + '\\nContext:\\n' + JSON.stringify(context),
      config: {
        systemInstruction: "You are GoMate's WhatsApp assistant — an equipment rental marketplace in Maharashtra, India. You help CUSTOMERS find and book agricultural, transport, and infrastructure equipment, and OWNERS list equipment and manage subscriptions. Respond in the user's language. Keep replies under 200 words, formatted for WhatsApp (*bold*, _italic_, bullets). Never invent equipment — only reference database results passed as context. Be warm, professional, and helpful. Use ₹ for prices."
      }
    });
    return response.text;
  } catch (error) {
    console.error('Error with Gemini:', error);
    return 'Sorry, I am having trouble processing your request right now.';
  }
}

module.exports = { getChatResponse };`,
  'src/services/session.js': `const sessions = new Map();

function getSession(phone) {
  let session = sessions.get(phone);
  if (!session || (Date.now() - session.lastActive > 30 * 60 * 1000)) {
    session = { state: 'INIT', data: {}, lastActive: Date.now() };
    sessions.set(phone, session);
  } else {
    session.lastActive = Date.now();
  }
  return session;
}

function updateSession(phone, updates) {
  const session = getSession(phone);
  Object.assign(session, updates);
  sessions.set(phone, session);
}

module.exports = { getSession, updateSession };`,
  'src/services/razorpay.js': `const Razorpay = require('razorpay');
const config = require('../config');

let rzp = null;
if (config.razorpay.keyId !== 'dummy_key_id') {
  rzp = new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });
} else {
  console.warn('Razorpay not configured. Using mock client.');
}

async function createSubscription(phone) {
  if (!rzp) return { id: 'sub_dummy123', short_url: 'https://rzp.io/dummy' };
  try {
    // simplified for example
    return { id: 'sub_live123', short_url: 'https://rzp.io/live' };
  } catch (error) {
    console.error('Razorpay Error:', error);
    return null;
  }
}

module.exports = { createSubscription };`,
  'src/services/language.js': `const en = require('../i18n/en');
const mr = require('../i18n/mr');
const hi = require('../i18n/hi');

function getText(lang, key) {
  const dict = lang === 'mr' ? mr : lang === 'hi' ? hi : en;
  return dict[key] || en[key] || key;
}

module.exports = { getText };`,
  'src/utils/formatter.js': `function formatEquipmentList(items, lang) {
  if (!items || items.length === 0) return 'No equipment found.';
  return items.map((item, i) => \`\${i + 1}. *\${item.type}* - \${item.model}\\n₹\${item.price_per_day}/day | \${item.district}\`).join('\\n\\n');
}

module.exports = { formatEquipmentList };`,
  'src/utils/validators.js': `function isValidDistrict(district) {
  const districts = ['Pune', 'Mumbai', 'Nashik', 'Nagpur', 'Aurangabad', 'Kolhapur', 'Solapur'];
  return districts.includes(district);
}

module.exports = { isValidDistrict };`,
  'src/handlers/webhook.js': `const router = require('./router');

module.exports = async (req, res) => {
  // ASYNC reply pattern: return 200 immediately
  res.status(200).send('');
  
  const from = req.body.From;
  const body = req.body.Body;
  if (!from || !body) return;

  try {
    await router.handleIncomingMessage(from, body);
  } catch (err) {
    console.error('Webhook error:', err);
  }
};`,
  'src/handlers/router.js': `const { getSession, updateSession } = require('../services/session');
const usersRepo = require('../db/users.repo');
const { sendWhatsApp } = require('../services/twilio');
const { getText } = require('../services/language');
const menuHandler = require('./customer/menuHandler');

async function handleIncomingMessage(phone, text) {
  const session = getSession(phone);
  
  if (session.state === 'INIT') {
    const user = await usersRepo.getUser(phone);
    if (!user) {
      updateSession(phone, { state: 'LANG_SELECT' });
      await sendWhatsApp(phone, getText('en', 'welcome'));
      return;
    }
    updateSession(phone, { lang: user.language, role: user.role, state: 'MENU' });
    await menuHandler.showMenu(phone, user.language, user.role);
    return;
  }
  
  if (session.state === 'LANG_SELECT') {
    const lang = text.includes('1') ? 'en' : text.includes('2') ? 'mr' : 'hi';
    updateSession(phone, { lang, state: 'ROLE_SELECT' });
    await sendWhatsApp(phone, getText(lang, 'role_select'));
    return;
  }
  
  if (session.state === 'ROLE_SELECT') {
    const role = text.includes('1') ? 'customer' : 'owner';
    const lang = session.lang;
    await usersRepo.upsertUser({ phone, role, language: lang });
    updateSession(phone, { role, state: 'MENU' });
    await menuHandler.showMenu(phone, lang, role);
    return;
  }

  // Route to other handlers based on state or AI
  await sendWhatsApp(phone, \`I received: \${text}. This bot is under construction.\`);
}

module.exports = { handleIncomingMessage };`,
  'src/handlers/customer/menuHandler.js': `const { sendWhatsApp } = require('../../services/twilio');
const { getText } = require('../../services/language');

async function showMenu(phone, lang, role) {
  const text = role === 'customer' ? getText(lang, 'customer_menu') : getText(lang, 'owner_menu');
  await sendWhatsApp(phone, text);
}

module.exports = { showMenu };`,
  'src/handlers/customer/searchHandler.js': `// search handler placeholder
module.exports = {};`,
  'src/handlers/customer/bookingFlow.js': `// booking flow placeholder
module.exports = {};`,
  'src/handlers/customer/statusHandler.js': `// status handler placeholder
module.exports = {};`,
  'src/handlers/owner/onboardingFlow.js': `// onboarding flow placeholder
module.exports = {};`,
  'src/handlers/owner/listingFlow.js': `// listing flow placeholder
module.exports = {};`,
  'src/handlers/owner/dashboardHandler.js': `// dashboard handler placeholder
module.exports = {};`,
  'src/handlers/owner/subscriptionHandler.js': `// subscription handler placeholder
module.exports = {};`,
  'src/data/seed.js': `const supabase = require('../db/supabase');
console.log('Seeding database with sample equipment...');
// To be implemented
console.log('Done.');`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content);
  console.log(\`Created \${filepath}\`);
}
