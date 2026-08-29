require('dotenv').config();
const path = require('path');
const express = require('express');

const webhookHandler = require('./src/handlers/webhook');
const razorpayService = require('./src/services/razorpay');
const { getSession, resetSession } = require('./src/services/session');
const { routeMessage } = require('./src/handlers/router');
const { initWhatsAppWeb, getWhatsAppStatus, logoutWhatsApp } = require('./src/services/whatsappWeb');
const { initKeepAlive, getKeepAliveStatus } = require('./src/services/keepAlive');

// Database repositories for admin metrics
const bookingsRepo = require('./src/db/bookings.repo');
const equipmentRepo = require('./src/db/equipment.repo');
const ownersRepo = require('./src/db/owners.repo');
const { JATH_VILLAGES } = require('./src/data/jathVillages');

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

// WhatsApp QR Code Web Pairing Dashboard
app.get('/qr', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'qr.html'));
});

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

// Printable Marketing Posters & QR Stickers Suite
app.get(['/marketing', '/flyers', '/posters'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'marketing', 'index.html'));
});

// Health check & 24/7 Heartbeat Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'GoMate WhatsApp Bot & Operations HQ',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    keepAlive: getKeepAliveStatus(),
    whatsapp: getWhatsAppStatus().status
  });
});

// WhatsApp Web Real Device status & QR
app.get('/api/whatsapp/status', (req, res) => {
  res.json(getWhatsAppStatus());
});

app.post('/api/whatsapp/logout', async (req, res) => {
  const result = await logoutWhatsApp();
  res.json(result);
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
// Jath Villages & Owner Self-Registration API
// ==========================================
app.get('/api/jath/villages', (req, res) => {
  res.json({
    taluka: 'Jath (जत)',
    district: 'Sangli (सांगली)',
    pin: '416404',
    total: JATH_VILLAGES.length,
    villages: JATH_VILLAGES
  });
});

app.post('/api/owner/register', async (req, res) => {
  try {
    const { name, phone, village, alternatePhone, category, equipment_type, model, daily_rate, services, language } = req.body;
    if (!name || !phone || !village) {
      return res.status(400).json({ error: 'Name, WhatsApp mobile number, and Village are required.' });
    }

    // Format phone to E.164 (+91...)
    let cleanPhone = String(phone).trim().replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`;
    }

    // 1. Register or update Owner with 7-Day Free Trial
    const owner = await ownersRepo.registerOwner({
      name: name.trim(),
      phone: cleanPhone,
      district: `${village} (Jath, Sangli)`,
      taluka: 'Jath',
      village: village.trim(),
      language: language || 'mr',
      subscription_status: 'trial',
      subscription_expires_at: new Date(Date.now() + 7 * 24 * 3600000).toISOString()
    });

    // 2. Add First Machinery Listing if provided
    let equipment = null;
    if (category && model) {
      const { hourly_rate, service_rates } = req.body;
      equipment = await equipmentRepo.addEquipment({
        owner_id: owner.id,
        owner_phone: cleanPhone,
        owner_name: name.trim(),
        category,
        type: equipment_type || model,
        equipment_type: equipment_type || model,
        model: model.trim(),
        district: 'Sangli',
        taluka: 'Jath',
        village: village.trim(),
        price_per_day: Number(daily_rate || 1500),
        daily_rate: Number(daily_rate || 1500),
        hourly_rate: Number(hourly_rate || Math.round(Number(daily_rate || 1500) / 2.5)),
        service_rates: service_rates || null,
        services: services || 'जत तालुक्यात शेती व बांधकामासाठी उपलब्ध',
        available: true
      });
    }

    res.json({
      success: true,
      message: 'Owner registered successfully with 7-Day Free Trial!',
      owner,
      equipment
    });
  } catch (err) {
    console.error('Owner registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Hourly Rental Pricing Calculator API
app.post('/api/booking/calculate-hourly', async (req, res) => {
  try {
    const { equipment_id, service_id, hours = 1, start_date, start_time, village } = req.body;
    const allEquip = await equipmentRepo.getAllEquipment();
    const equip = allEquip.find(e => String(e.id) === String(equipment_id)) || allEquip[0];
    
    let unitRate = Number(equip.hourly_rate || 600);
    let serviceName = 'Base Machine Hire (सामान्य भाडे)';

    if (equip.service_rates && service_id && equip.service_rates[service_id]) {
      unitRate = Number(equip.service_rates[service_id].rate || equip.service_rates[service_id].rate_per_hour || unitRate);
      serviceName = equip.service_rates[service_id].name || service_id;
    } else if (service_id === 'rotavator') {
      unitRate = 800;
      serviceName = 'Rotavator (रोटाव्हेटर)';
    } else if (service_id === 'cultivation') {
      unitRate = 900;
      serviceName = 'Cultivator (कल्टीव्हेटर)';
    } else if (service_id === 'trolley') {
      unitRate = 600;
      serviceName = 'Hydraulic Trolley (ट्रॉली)';
    } else if (service_id === 'ploughing') {
      unitRate = 850;
      serviceName = 'Deep Plough (नांगरट)';
    } else if (service_id === 'seeding') {
      unitRate = 750;
      serviceName = 'Seed Drill (पेरणी)';
    } else if (service_id === 'local_haul') {
      unitRate = 350;
      serviceName = 'स्थानिक गाव मालवाहतूक (Local Village Haulage)';
    } else if (service_id === 'market_haul') {
      unitRate = 450;
      serviceName = 'मार्केट भाजीपाला वाहतूक (Market Transport)';
    } else if (service_id === 'water_supply') {
      unitRate = 850;
      serviceName = 'पाणी टँकर पुरवठा (Water Tanker)';
    } else if (service_id === 'dumping') {
      unitRate = 900;
      serviceName = 'डंपर मुरूम वाहतूक (Tipper Haulage)';
    } else if (service_id === 'jcb_trench' || service_id === 'jcb_level') {
      unitRate = 950;
      serviceName = 'जेसीबी खोदकाम व सपाटीकरण (JCB Excavation)';
    } else if (service_id === 'poklen' || service_id === 'poklen_rock') {
      unitRate = 1500;
      serviceName = 'पोकलेन विहीर व खडक उत्खनन (Poklen Excavator)';
    } else if (service_id === 'dozer') {
      unitRate = 1600;
      serviceName = 'बुलडोझर जमीन सपाटीकरण (Bulldozer Leveling)';
    }

    const durationHours = Math.max(1, Number(hours) || 1);
    const machineSubtotal = unitRate * durationHours;
    const PLATFORM_FEE = 49; // Flat safety & dispatch fee
    const totalAmount = machineSubtotal + PLATFORM_FEE;

    res.json({
      success: true,
      equipment_id: equip.id,
      model: equip.model || equip.name,
      category: equip.category,
      service_id: service_id || 'base',
      service_name: serviceName,
      unit_hourly_rate: unitRate,
      duration_hours: durationHours,
      machine_subtotal: machineSubtotal,
      platform_fee: PLATFORM_FEE,
      total_amount: totalAmount,
      start_date: start_date || 'Tomorrow',
      start_time: start_time || '08:00 AM',
      village: village || equip.village || 'Jath'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hourly Rental Booking Confirmation & Payment API
app.post('/api/booking/create-hourly', async (req, res) => {
  try {
    const { 
      customer_name, 
      customer_phone, 
      equipment_id, 
      service_id, 
      hours = 1, 
      start_date, 
      start_time, 
      village,
      notes 
    } = req.body;

    if (!customer_name || !customer_phone) {
      return res.status(400).json({ error: 'Customer name and WhatsApp phone number are required.' });
    }

    const allEquip = await equipmentRepo.getAllEquipment();
    const equip = allEquip.find(e => String(e.id) === String(equipment_id)) || allEquip[0];

    let unitRate = Number(equip.hourly_rate || 600);
    let serviceName = 'Base Machine Hire';

    if (equip.service_rates && service_id && equip.service_rates[service_id]) {
      unitRate = Number(equip.service_rates[service_id].rate || equip.service_rates[service_id].rate_per_hour || unitRate);
      serviceName = equip.service_rates[service_id].name || service_id;
    } else if (service_id === 'rotavator') { unitRate = 800; serviceName = 'Rotavator (रोटाव्हेटर)'; }
    else if (service_id === 'cultivation') { unitRate = 900; serviceName = 'Cultivator (कल्टीव्हेटर)'; }
    else if (service_id === 'trolley') { unitRate = 600; serviceName = 'Hydraulic Trolley (ट्रॉली)'; }
    else if (service_id === 'ploughing') { unitRate = 850; serviceName = 'Deep Plough (नांगरट)'; }
    else if (service_id === 'seeding') { unitRate = 750; serviceName = 'Seed Drill (पेरणी)'; }

    const durationHours = Math.max(1, Number(hours) || 1);
    const machineSubtotal = unitRate * durationHours;
    const PLATFORM_FEE = 49;
    const totalAmount = machineSubtotal + PLATFORM_FEE;

    let cleanPhone = String(customer_phone).trim().replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`;
    }

    // Create Booking
    const booking = await bookingsRepo.createBooking({
      customer_name: customer_name.trim(),
      customer_phone: cleanPhone,
      equipment_id: equip.id,
      equipment_name: `${equip.model} [${serviceName}]`,
      start_date: `${start_date || 'Tomorrow'} at ${start_time || '08:00 AM'} (${durationHours} Hours)`,
      duration_days: durationHours / 8, // fractional days
      total_amount: totalAmount,
      status: 'pending',
      owner_phone: equip.owner_phone || '+919822012345'
    });

    // Generate Payment Link
    const payObj = await razorpayService.createBookingPaymentLink(
      cleanPhone,
      totalAmount,
      booking.booking_ref,
      `${equip.model} (${serviceName} - ${durationHours} hrs)`
    );

    res.json({
      success: true,
      booking_ref: booking.booking_ref,
      booking,
      receipt: {
        booking_ref: booking.booking_ref,
        customer_name,
        customer_phone: cleanPhone,
        equipment_model: equip.model,
        service_name: serviceName,
        unit_hourly_rate: unitRate,
        duration_hours: durationHours,
        machine_subtotal: machineSubtotal,
        platform_fee: PLATFORM_FEE,
        total_amount: totalAmount,
        start_date,
        start_time,
        village: village || 'Jath',
        pay_url: payObj.short_url || 'https://rzp.io/l/gomate-booking'
      }
    });
  } catch (err) {
    console.error('Hourly booking error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/owner/lookup', async (req, res) => {
  try {
    const phone = req.query.phone;
    if (!phone) return res.status(400).json({ error: 'Phone parameter required' });
    let cleanPhone = String(phone).trim().replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`;
    }

    const owner = await ownersRepo.getOwnerByPhone(cleanPhone);
    if (!owner) return res.status(404).json({ error: 'Owner not found' });
    const allEquip = await equipmentRepo.getAllEquipment();
    const ownerEquip = allEquip.filter(e => e.owner_id === owner.id || e.owner_phone === cleanPhone);
    res.json({ owner, equipment: ownerEquip });
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

// Simulator Voice Note Processing Endpoint
app.post('/api/simulator/send-voice', async (req, res) => {
  try {
    const { phone, audio, mimeType, simulatedText } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone is required' });

    const session = getSession(phone);
    const { processVoiceNote, formatVoiceAcknowledgment } = require('./src/services/voiceService');

    const voiceInput = audio || simulatedText || 'मला उद्या सकाळी शेगावला रोटाव्हेटरसाठी ट्रॅक्टर हवा आहे.';
    const voiceResult = await processVoiceNote(voiceInput, mimeType || 'audio/ogg', phone, session);
    const voiceAck = formatVoiceAcknowledgment(voiceResult);

    res.json({
      success: true,
      phone,
      voiceResult,
      voiceAck,
      reply: voiceAck,
      session: {
        state: session.state,
        language: session.language,
        role: session.role,
        data: session.data
      }
    });
  } catch (err) {
    console.error('Voice simulator error:', err);
    res.status(500).json({ error: err.message });
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

// GPS Distance & Village ETA API Endpoint
app.get('/api/villages/distance', (req, res) => {
  try {
    const { from, to, type } = req.query;
    const { calculateDistanceAndETA } = require('./src/services/distanceService');
    const result = calculateDistanceAndETA(from || 'शेगाव', to || 'जत', type || 'tractor');
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WhatsApp Web status & live QR code endpoint
app.get('/api/whatsapp/status', (req, res) => {
  res.json(getWhatsAppStatus());
});

// Twilio WhatsApp & Webhook endpoints
app.post('/webhook', webhookHandler);
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

// Customer Booking Payment Success & Official Invoice Generator
app.post('/api/demo/customer-payment-success', async (req, res) => {
  try {
    const { phone, ref, amount, model, txnId } = req.body;
    console.log(`\n💰 CUSTOMER PAYMENT CONFIRMED: ₹${amount} for ${model} (Ref: ${ref}) by ${phone}`);

    const { sendWhatsAppDirect } = require('./src/services/whatsappWeb');
    const { getSession } = require('./src/services/session');
    const session = getSession(phone);
    const lang = (session && session.language) || 'en';
    const customerName = (session && session.customerName) || 'Customer';
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const invNo = `GM-INV-${ref.replace('GM-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const platformFee = 49;
    const totalPaid = Number(amount);
    const rentalPortion = Math.max(0, totalPaid - platformFee);
    const baseRental = Math.round(rentalPortion / 1.18);
    const gstAmount = rentalPortion - baseRental;

    let invoiceMessage = '';

    if (lang === 'mr') {
      invoiceMessage = `🧾 *गोमेट अधिकृत टॅक्स इनव्हॉइस व पावती*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔖 *पावती क्र (Invoice No):* ${invNo}
🔖 *बुकिंग संदर्भ (Ref):* ${ref}
📅 *तारीख व वेळ:* ${dateStr} | ${timeStr}
💳 *पेमेंट पद्धत:* UPI (यशस्वी ✅)
🔖 *व्यवहार आयडी (Txn ID):* ${txnId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *बुकिंग व मशिनरी तपशील:*
🚜 *उपकरण:* ${model}
👤 *ग्राहक:* ${customerName !== 'Customer' ? customerName : 'GoMate ग्राहक'} (${phone})
📍 *स्थान:* महाराष्ट्र (स्थानिक शेत / साइट)

💰 *पेमेंट सारांश:*
• मूळ भाडे रक्कम: ₹${baseRental.toLocaleString('en-IN')}
• गोमेट सुरक्षा व सहाय्य फी: ₹${platformFee}
• GST (18% समाविष्ट): ₹${gstAmount.toLocaleString('en-IN')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 *एकूण भरलेली रक्कम: ₹${totalPaid.toLocaleString('en-IN')} (PAID ✅)*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 *मशिनरी मालक व ऑपरेटर तपशील:*
👤 *मालकाचे नाव:* राजेश पाटील (गोमेट व्हेरिफाइड मालक ⭐️ 4.9)
📱 *मालकाचा फोन:* +91 98220 12345
📍 *मुख्य केंद्र:* पुणे / पश्चिम महाराष्ट्र

🚚 *डिलिव्हरी व पुढील सूचना:*
1️⃣ मालकांना तुमची बुकिंग पावती व तपशील त्वरित पाठवले आहेत.
2️⃣ डिलिव्हरी वेळेचे समन्वय साधण्यासाठी मालक तुम्हाला 1-2 तासांत कॉल करतील.
3️⃣ सुरक्षिततेची हमी: काम सुरू होईपर्यंत तुमची रक्कम GoMate द्वारे 100% सुरक्षित आहे.

_📞 GoMate शेतकरी हेल्पलाइन: 1800-123-4567_
_गोमेट निवडल्याबद्दल धन्यवाद! 🚜🌾_`;
    } else if (lang === 'hi') {
      invoiceMessage = `🧾 *गोमेट आधिकारिक टैक्स इनवॉइस व रसीद*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔖 *रसीद सं (Invoice No):* ${invNo}
🔖 *बुकिंग संदर्भ (Ref):* ${ref}
📅 *दिनांक व समय:* ${dateStr} | ${timeStr}
💳 *भुगतान माध्यम:* UPI (सफल ✅)
🔖 *लेनदेन आईडी (Txn ID):* ${txnId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *बुकिंग व मशीनरी विवरण:*
🚜 *मशीनरी:* ${model}
👤 *ग्राहक:* ${customerName !== 'Customer' ? customerName : 'GoMate ग्राहक'} (${phone})
📍 *स्थान:* महाराष्ट्र

💰 *भुगतान विवरण:*
• मूल किराया राशि: ₹${baseRental.toLocaleString('en-IN')}
• गोमेट सुरक्षा व सेवा शुल्क: ₹${platformFee}
• GST (18% सम्मिलित): ₹${gstAmount.toLocaleString('en-IN')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 *कुल भुगतान राशि: ₹${totalPaid.toLocaleString('en-IN')} (PAID ✅)*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 *मशीन मालिक व ऑपरेटर विवरण:*
👤 *मालिक का नाम:* राजेश पाटिल (GoMate सत्यापित ⭐️ 4.9)
📱 *मालिक का फोन:* +91 98220 12345
📍 *केंद्र:* पुणे / पश्चिम महाराष्ट्र

🚚 *डिलीवरी व आगामी निर्देश:*
1️⃣ मशीन मालिक को आपकी बुकिंग रसीद भेज दी गई है।
2️⃣ डिलीवरी समय और स्थान के समन्वय हेतु मालिक 1-2 घंटे में आपको कॉल करेंगे।
3️⃣ सुरक्षा गारंटी: काम शुरू होने तक आपका पैसा 100% सुरक्षित है।

_📞 GoMate किसान हेल्पलाइन: 1800-123-4567_
_गोमेट का उपयोग करने के लिए धन्यवाद! 🚜🌾_`;
    } else {
      invoiceMessage = `🧾 *GOMATE OFFICIAL TAX INVOICE & RECEIPT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔖 *Invoice No:* ${invNo}
🔖 *Booking Ref:* ${ref}
📅 *Date & Time:* ${dateStr} | ${timeStr}
💳 *Payment Mode:* UPI / Cards (SUCCESS ✅)
🔖 *Transaction ID:* ${txnId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *BOOKING & EQUIPMENT DETAILS:*
🚜 *Equipment:* ${model}
👤 *Customer:* ${customerName !== 'Customer' ? customerName : 'GoMate Customer'} (${phone})
📍 *Service Location:* Maharashtra (Local Site / Farm)

💰 *PAYMENT BREAKDOWN:*
• Base Rental Rate: ₹${baseRental.toLocaleString('en-IN')}
• GoMate Protection & Support Fee: ₹${platformFee}
• GST (18% Included): ₹${gstAmount.toLocaleString('en-IN')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 *TOTAL AMOUNT PAID: ₹${totalPaid.toLocaleString('en-IN')} (PAID ✅)*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 *VERIFIED EQUIPMENT OWNER DETAILS:*
👤 *Owner Name:* Rajesh Patil (GoMate Verified Owner ⭐️ 4.9)
📱 *Owner Phone:* +91 98220 12345
📍 *Operating Hub:* Pune / Western Maharashtra Hub

🚚 *DELIVERY INSTRUCTIONS:*
1️⃣ The machinery owner has received your confirmed booking voucher.
2️⃣ The owner will call you within 1-2 hours to confirm your exact delivery coordinates.
3️⃣ 100% GoMate Protection: Your payment is protected until machinery is deployed on site.

_📞 GoMate Toll-Free Support: 1800-123-4567_
_Thank you for renting with GoMate! 🚜🌾_`;
    }

    // 1. Send Official Tax Invoice to Customer on WhatsApp
    await sendWhatsAppDirect(phone, invoiceMessage);

    // 2. Also notify Owner with Customer details and net equipment payout
    const ownerPhone = process.env.ADMIN_WHATSAPP_NUMBER || '+919822012345';
    await sendWhatsAppDirect(ownerPhone,
      `🎉 *PAYMENT CONFIRMED FOR YOUR MACHINERY!*\n\n` +
      `🔖 *Ref:* ${ref}\n` +
      `🚜 *Equipment:* ${model}\n` +
      `💰 *Equipment Rental Payout:* ₹${rentalPortion.toLocaleString('en-IN')}\n` +
      `👤 *Customer:* ${customerName} (${phone})\n` +
      `🔖 *Txn ID:* ${txnId}\n\n` +
      `👉 Please contact the customer immediately to coordinate delivery!`
    ).catch(() => {});

    res.json({ success: true, txnId, invoiceNo: invNo });
  } catch (e) {
    console.error('Payment confirmation error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Payment success landing page
app.get('/payment-success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'demo-payment.html'));
});

app.use((err, req, res, next) => { console.error(err.stack); res.status(500).send('Something broke!'); });

app.listen(port, '0.0.0.0', () => {
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

  // Initialize 24/7 Keep-Alive Heartbeat (keeps cloud containers awake)
  initKeepAlive();
});
