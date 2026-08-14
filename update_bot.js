const fs = require('fs');
const path = require('path');

const projectDir = 'C:\\Users\\udayp\\.gemini\\antigravity\\scratch\\gomate-whatsapp-bot';

const files = {
  'server.js': `require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const { handleIncomingMessage } = require('./src/handlers/webhook');
const razorpayService = require('./src/services/razorpay');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.status(200).json({ status: 'ok', service: 'GoMate WhatsApp Bot' }));

const twilioMiddleware = process.env.NODE_ENV === 'production' ? twilio.webhook({ validate: true }) : (req, res, next) => next();

app.post('/webhook/whatsapp', twilioMiddleware, async (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();
  res.type('text/xml').send(twiml.toString());
  try { await handleIncomingMessage(req.body); } catch (e) { console.error(e); }
});

app.post('/webhook/razorpay', async (req, res) => {
  try {
    await razorpayService.handleWebhookEvent(req.body);
    res.status(200).send('OK');
  } catch (e) { res.status(500).send('Error'); }
});

app.use((err, req, res, next) => res.status(500).send('Something broke!'));

app.listen(port, () => console.log(\`GoMate started on \${port}\`));`,

  'supabase/migrations/001_initial_schema.sql': "-- Initial Schema for GoMate\n\nCREATE TABLE users (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  phone VARCHAR(20) UNIQUE NOT NULL,\n  name VARCHAR(100),\n  role VARCHAR(20),\n  language VARCHAR(5),\n  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\nCREATE TABLE owners (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  phone VARCHAR(20) UNIQUE NOT NULL,\n  name VARCHAR(100),\n  district VARCHAR(100),\n  language VARCHAR(5),\n  subscription_status VARCHAR(20) DEFAULT 'trial',\n  subscription_expires_at TIMESTAMP WITH TIME ZONE,\n  razorpay_subscription_id VARCHAR(100),\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\nCREATE TABLE equipment (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  owner_id UUID REFERENCES owners(id),\n  category VARCHAR(50),\n  type VARCHAR(50),\n  model VARCHAR(100),\n  district VARCHAR(100),\n  taluka VARCHAR(100),\n  price_per_day DECIMAL(10,2),\n  available BOOLEAN DEFAULT true,\n  rating DECIMAL(3,2) DEFAULT 0,\n  description TEXT,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\nCREATE TABLE bookings (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  booking_ref VARCHAR(20) UNIQUE NOT NULL,\n  equipment_id UUID REFERENCES equipment(id),\n  customer_phone VARCHAR(20),\n  customer_name VARCHAR(100),\n  start_date DATE,\n  duration_days INTEGER,\n  total_amount DECIMAL(10,2),\n  status VARCHAR(20) DEFAULT 'pending',\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\nCREATE TABLE sessions (\n  phone VARCHAR(20) PRIMARY KEY,\n  flow_state JSONB,\n  conversation_history JSONB,\n  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  expires_at TIMESTAMP WITH TIME ZONE\n);\n",

  'README.md': "# GoMate WhatsApp Bot\n\nA WhatsApp chatbot for equipment rental in Maharashtra.\n\n## Tech Stack\nNode.js, Express, Twilio, Supabase, Razorpay, Google GenAI\n\n## Setup\n1. `npm install`\n2. Copy `.env.example` to `.env` and configure variables\n3. Run `npm start`\n"
};

async function writeFiles() {
  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(projectDir, relPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content);
    console.log("Wrote " + relPath);
  }
}
writeFiles().catch(console.error);
