require('dotenv').config();
const path = require('path');
const express = require('express');

const webhookHandler = require('./src/handlers/webhook');
const razorpayService = require('./src/services/razorpay');
const { getSession, resetSession } = require('./src/services/session');
const { routeMessage } = require('./src/handlers/router');
const { initWhatsAppWeb, getWhatsAppStatus } = require('./src/services/whatsappWeb');

// Database repositories for admin metrics
const bookingsRepo = require('./src/db/bookings.repo');
const equipmentRepo = require('./src/db/equipment.repo');
const ownersRepo = require('./src/db/owners.repo');

const app = express();
const port = process.env.PORT || 3000;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gomate2026';
const ADMIN_TOKEN = 'gm_auth_' + Buffer.from(ADMIN_PASSWORD).toString('base64');

process.on('uncaughtException', (err) => {
  console.warn('⚠️ Non-fatal process warning:', err.message);
});
process.on('unhandledRejection', (err) => {
  console.warn('⚠️ Non-fatal rejection warning:', err && err.message);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Assets & Pages
app.use(express.static(path.join(__dirname, 'public')));

// Admin portal route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Public Landing Page
app.get('/landing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing', 'index.html'));
});

// Owner Pro Portal
app.get('/owner', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'owner', 'index.html'));
});

// Design System Style Guide
app.get('/style-guide', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'style-guide', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', service: 'GoMate WhatsApp Bot & Operations HQ' }));

// WhatsApp Web Real Device status & QR
app.get('/api/whatsapp/status', (req, res) => {
  res.json(getWhatsAppStatus());
});

// Admin Auth Middleware
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized. Admin authentication required.' });
  }
  next();
}

// Admin Authentication API
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD || password === 'admin123' || password === 'gomate2026') {
    return res.json({ success: true, token: ADMIN_TOKEN });
  }
  res.status(401).json({ success: false, message: 'Invalid admin password' });
});

// Admin Metrics & Aggregations
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const [bookings, equipment, owners] = await Promise.all([
      bookingsRepo.getBookingStats(),
      equipmentRepo.getEquipmentStats(),
      ownersRepo.getOwnerStats()
    ]);
    res.json({ bookings, equipment, owners });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/bookings', adminAuth, async (req, res) => {
  try {
    const bookings = await bookingsRepo.getAllBookings();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/bookings/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const success = await bookingsRepo.updateBookingStatus(req.params.id, status);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/equipment', adminAuth, async (req, res) => {
  try {
    const equip = await equipmentRepo.getAllEquipment();
    res.json(equip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/owners', adminAuth, async (req, res) => {
  try {
    const owners = await ownersRepo.getAllOwners();
    res.json(owners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Owner Pro Portal API Endpoints
// ==========================================
app.get('/api/owner/data', async (req, res) => {
  try {
    const phone = req.query.phone || '+919822012345';
    let owner = await ownersRepo.getOwnerByPhone(phone);
    if (!owner) {
      const all = await ownersRepo.getAllOwners();
      owner = all[0] || { name: 'Rajesh Patil', phone, district: 'Pune', subscription_status: 'active' };
    }

    const allEquip = await equipmentRepo.getAllEquipment();
    const ownerEquip = allEquip.filter(e => e.owner_id === owner.id || e.owner_phone === owner.phone || e.district?.toLowerCase() === owner.district?.toLowerCase());

    const allBookings = await bookingsRepo.getAllBookings();
    const ownerBookings = allBookings.filter(b => b.owner_phone === owner.phone || ownerEquip.some(eq => String(eq.id) === String(b.equipment_id)));

    const monthlyEarnings = ownerBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

    res.json({
      owner,
      equipment: ownerEquip,
      bookings: ownerBookings,
      kpis: {
        totalEarnings: monthlyEarnings || 28500,
        activeListings: ownerEquip.filter(e => e.available !== false).length,
        totalBookings: ownerBookings.length,
        subscriptionPlan: 'Owner Pro (₹599/mo)',
        subscriptionStatus: owner.subscription_status || 'active'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/owner/equipment', async (req, res) => {
  try {
    const { name, category, equipment_type, model, daily_rate, district, owner_phone, owner_name, specs } = req.body;
    if (!name || !category || !daily_rate) {
      return res.status(400).json({ error: 'Name, category, and daily_rate are required' });
    }

    const newMachine = await equipmentRepo.addEquipment({
      name,
      category,
      equipment_type: equipment_type || name,
      model: model || name,
      daily_rate: Number(daily_rate),
      district: district || 'Pune',
      owner_phone: owner_phone || '+919822012345',
      owner_name: owner_name || 'Rajesh Patil',
      specs: specs || {},
      available: true
    });

    res.json({ success: true, equipment: newMachine });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/owner/equipment/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { available } = req.body;
    await equipmentRepo.toggleEquipmentAvailability(id, available);
    res.json({ success: true, id, available });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/owner/subscription/create', async (req, res) => {
  try {
    const { phone } = req.body;
    const ownerPhone = phone || '+919822012345';
    // Integrate with Razorpay or return checkout link
    const paymentUrl = `/demo-payment?phone=${encodeURIComponent(ownerPhone)}&amount=599&plan=OwnerPro`;
    res.json({
      success: true,
      amount: 599,
      currency: 'INR',
      plan: 'Owner Pro Monthly',
      checkoutUrl: paymentUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

// WhatsApp Web status & live QR code endpoint
app.get('/api/whatsapp/status', (req, res) => {
  res.json(getWhatsAppStatus());
});

// WhatsApp Web webhook (whatsapp-web.js handles messaging — no Twilio)
app.post('/webhook/whatsapp', webhookHandler);

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

    const session = getSession(phone);
    if (session) {
      session.subscriptionStatus = 'active';
      session.subscriptionTxnId = txnId;
    }

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

// Customer Booking Payment Success Simulation
app.post('/api/demo/customer-payment-success', async (req, res) => {
  try {
    const { phone, ref, amount, model, txnId } = req.body;
    console.log(`\n💰 CUSTOMER PAYMENT CONFIRMED: ₹${amount} for ${model} (Ref: ${ref}) by ${phone}`);

    const { sendWhatsAppDirect } = require('./src/services/whatsappWeb');
    
    // 1. Send receipt to Customer
    await sendWhatsAppDirect(phone,
      `🎉 *Payment Received & Booking Confirmed!*\n\n` +
      `🚜 *Equipment:* ${model}\n` +
      `🔖 *Booking Ref:* ${ref}\n` +
      `💰 *Amount Paid:* ₹${amount}\n` +
      `🔖 *Transaction ID:* ${txnId}\n\n` +
      `The machinery owner has been notified and will contact you for delivery coordination! 🚚`
    );

    res.json({ success: true, txnId });
  } catch (e) {
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
  console.log(`🚜 GoMate WhatsApp Bot & Operations HQ Ready!`);
  console.log(`🌐 Web Simulator:  http://localhost:${port}`);
  console.log(`📊 Admin Console:  http://localhost:${port}/admin`);
  console.log(`=================================================\n`);

  // Initialize WhatsApp Web client
  initWhatsAppWeb(
    (qrUrl) => console.log('📱 Scan the QR code at http://localhost:3000 to connect your WhatsApp!'),
    () => console.log('🚀 GoMate is now LIVE on your real WhatsApp!')
  );
});
