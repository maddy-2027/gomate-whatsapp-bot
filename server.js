require('dotenv').config();
const path = require('path');
const express = require('express');
const twilio = require('twilio');
const webhookHandler = require('./src/handlers/webhook');
const razorpayService = require('./src/services/razorpay');
const { getSession, resetSession } = require('./src/services/session');
const { routeMessage } = require('./src/handlers/router');
const { initWhatsAppWeb, getWhatsAppStatus } = require('./src/services/whatsappWeb');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Simulator
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', service: 'GoMate WhatsApp Bot & Simulator' }));

// WhatsApp Web Real Device status & QR
app.get('/api/whatsapp/status', (req, res) => {
  res.json(getWhatsAppStatus());
});

// Simulator API endpoints
app.post('/api/simulator/send', async (req, res) => {

  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone and message are required' });
    }
    const session = getSession(phone);
    const reply = await routeMessage(phone, message, session);
    res.json({
      success: true,
      phone,
      reply,
      session: {
        state: session.state,
        language: session.language,
        role: session.role,
        data: session.data
      }
    });
  } catch (error) {
    console.error('Simulator error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/simulator/reset', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone is required' });
  const session = resetSession(phone);
  res.json({ success: true, session });
});

app.get('/api/simulator/session', (req, res) => {
  const phone = req.query.phone;
  if (!phone) return res.status(400).json({ error: 'Phone is required' });
  const session = getSession(phone);
  res.json({ session });
});

// Real Twilio Webhook (for production / Twilio connection)
const twilioMiddleware = process.env.NODE_ENV === 'production' 
  ? twilio.webhook({ validate: true }) 
  : (req, res, next) => next();

app.post('/webhook/whatsapp', twilioMiddleware, webhookHandler);

// Razorpay Webhook
app.post('/webhook/razorpay', async (req, res) => {
  try {
    await razorpayService.handleWebhookEvent(req.body);
    res.status(200).send('OK');
  } catch (e) { res.status(500).send('Error'); }
});

// Demo Payment Page
app.get('/demo-payment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'demo-payment.html'));
});

// Demo Payment Success Simulation (fires after demo payment is clicked)
app.post('/api/demo/payment-success', async (req, res) => {
  try {
    const { phone, txnId, amount } = req.body;
    console.log(`\n💰 DEMO: ₹${amount} payment confirmed for ${phone} | TxnID: ${txnId}`);

    // Update session to mark subscription as ACTIVE
    const session = getSession(phone);
    if (session) {
      session.subscriptionStatus = 'active';
      session.subscriptionTxnId = txnId;
    }

    // If WhatsApp is connected, send a real WhatsApp confirmation message
    const { sendWhatsAppDirect } = require('./src/services/whatsappWeb');
    await sendWhatsAppDirect(phone,
      `✅ *Payment Successful!*\n\n` +
      `*GoMate Owner Pro* subscription activated!\n` +
      `💰 Amount: ₹${amount}\n` +
      `🔖 Transaction ID: ${txnId}\n` +
      `📅 Valid for: 30 days\n\n` +
      `Your machinery is now LIVE on GoMate. Farmers across Maharashtra can find and book your tractors and equipment! 🚜`
    );

    res.json({ success: true, message: 'Payment demo confirmed', txnId });

  } catch (e) {
    console.error('Demo payment error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Payment success landing page
app.get('/payment-success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'demo-payment.html'));
});

app.use((err, req, res, next) => { console.error(err.stack); res.status(500).send('Something broke!'); });

app.listen(port, () => {
  console.log(`\n=================================================`);
  console.log(`🚜 GoMate WhatsApp Bot & Web Simulator Ready!`);
  console.log(`🌐 Open http://localhost:${port} in your browser`);
  console.log(`=================================================\n`);

  // Initialize WhatsApp Web client
  initWhatsAppWeb(
    (qrUrl) => console.log('📱 Scan the QR code at http://localhost:3000 to connect your WhatsApp!'),
    () => console.log('🚀 GoMate is now LIVE on your real WhatsApp!')
  );
});


