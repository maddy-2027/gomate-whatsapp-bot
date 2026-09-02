process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
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

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_MAX_ATTEMPTS = 5;
const adminLoginAttempts = new Map();

function adminConfigurationReady() {
  return Boolean(ADMIN_PASSWORD && ADMIN_SESSION_SECRET && ADMIN_SESSION_SECRET.length >= 32);
}

function signAdminSession(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function verifyAdminSession(token) {
  if (!token || !adminConfigurationReady()) return false;
  const [encodedPayload, suppliedSignature] = token.split('.');
  if (!encodedPayload || !suppliedSignature) return false;
  const expectedSignature = crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(encodedPayload).digest('base64url');
  const expected = Buffer.from(expectedSignature);
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    return payload.scope === 'admin' && Number.isFinite(payload.exp) && payload.exp > Date.now();
  } catch (_) {
    return false;
  }
}

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
  if (!adminConfigurationReady()) {
    return res.status(503).json({ error: 'Admin access is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET.' });
  }
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!verifyAdminSession(token)) {
    return res.status(401).json({ error: 'Unauthorized. Admin authentication required.' });
  }
  next();
}

// Admin Authentication API
app.post('/api/admin/login', (req, res) => {
  if (!adminConfigurationReady()) {
    return res.status(503).json({ success: false, message: 'Admin access has not been configured. Contact the service owner.' });
  }
  const clientKey = req.ip || 'unknown';
  const priorAttempt = adminLoginAttempts.get(clientKey);
  if (priorAttempt && priorAttempt.count >= ADMIN_LOGIN_MAX_ATTEMPTS && Date.now() - priorAttempt.firstAttempt < ADMIN_LOGIN_WINDOW_MS) {
    return res.status(429).json({ success: false, message: 'Too many attempts. Please wait 15 minutes and try again.' });
  }
  const password = String(req.body?.password || '');
  const expected = Buffer.from(ADMIN_PASSWORD);
  const supplied = Buffer.from(password);
  if (expected.length === supplied.length && crypto.timingSafeEqual(expected, supplied)) {
    adminLoginAttempts.delete(clientKey);
    const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
    return res.json({ success: true, token: signAdminSession({ scope: 'admin', exp: expiresAt }), expiresAt });
  }
  if (!priorAttempt || Date.now() - priorAttempt.firstAttempt >= ADMIN_LOGIN_WINDOW_MS) {
    adminLoginAttempts.set(clientKey, { count: 1, firstAttempt: Date.now() });
  } else {
    adminLoginAttempts.set(clientKey, { ...priorAttempt, count: priorAttempt.count + 1 });
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

// Admin WhatsApp Broadcast Endpoints
app.get('/api/admin/broadcast/templates', adminAuth, (req, res) => {
  const { getBroadcastTemplates, getBroadcastHistory } = require('./src/services/broadcastService');
  res.json({
    templates: getBroadcastTemplates(),
    history: getBroadcastHistory()
  });
});

app.post('/api/admin/broadcast', adminAuth, async (req, res) => {
  try {
    const { targetAudience, taluka, templateId, customMessage } = req.body;
    const { executeBroadcast } = require('./src/services/broadcastService');
    const result = await executeBroadcast({ targetAudience, taluka, templateId, customMessage });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Taluka Demand Heatmap & Deficit Endpoint
app.get('/api/admin/heatmap', adminAuth, async (req, res) => {
  try {
    const { getTalukaHeatmapMetrics } = require('./src/services/heatmapService');
    const metrics = await getTalukaHeatmapMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PDF Invoice Generation Endpoints
// ==========================================

// GET /api/bookings/:ref/invoice — stream PDF invoice for a booking
app.get('/api/bookings/:ref/invoice', async (req, res) => {
  try {
    const { generateInvoicePDF, normaliseBooking } = require('./src/services/invoiceService');
    const ref = req.params.ref;

    // Try to find real booking, fallback to demo booking
    let rawBooking = null;
    try {
      const all = await bookingsRepo.getAllBookings();
      rawBooking = all.find(b => b.booking_ref === ref || String(b.id) === String(ref));
    } catch (_) {}

    if (!rawBooking) {
      rawBooking = {
        booking_ref: ref,
        status: 'confirmed',
        customer_name: 'Ramesh Patil',
        customer_phone: '+919876500001',
        owner_name: 'Rajesh Patil',
        owner_phone: '+919822012345',
        equipment_name: 'Mahindra 575 DI (45 HP)',
        attachment: 'Rotavator (6-ft)',
        village: 'Shegaon',
        hours_booked: 6,
        hourly_rate: 800,
        created_at: new Date().toISOString()
      };
    }

    const booking = normaliseBooking(rawBooking);
    const pdfBuffer = await generateInvoicePDF(booking);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="GoMate-Invoice-${booking.booking_ref}.pdf"`,
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Invoice generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings/:ref/send-invoice — generate and "send" PDF link on WhatsApp
app.post('/api/bookings/:ref/send-invoice', adminAuth, async (req, res) => {
  try {
    const ref = req.params.ref;
    const customerPhone = req.body.customer_phone || '+919876500001';
    const baseUrl = process.env.BASE_URL || `https://gomate-whatsapp-bot.onrender.com`;
    const invoiceUrl = `${baseUrl}/api/bookings/${ref}/invoice`;

    const whatsappMsg = `🧾 *GoMate — बुकिंग पावती (Invoice)*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
नमस्कार! आपल्या बुकिंग *${ref}* ची अधिकृत PDF पावती तयार आहे.

📄 *Invoice Download करा:*
${invoiceUrl}

✅ GoMate Quality Guarantee सह
💳 UPI द्वारे पेमेंट करा: gomate@upi
📞 तक्रार / मदत: +91 98220 12345`;

    try {
      const { sendWhatsAppDirect } = require('./src/services/whatsappWeb');
      await sendWhatsAppDirect(customerPhone, whatsappMsg);
    } catch (_) {
      // Non-blocking: WhatsApp send may fail in dev
    }

    res.json({
      success: true,
      booking_ref: ref,
      invoice_url: invoiceUrl,
      whatsapp_message: whatsappMsg,
      sent_to: customerPhone
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Machinery Breakdown SOS & Emergency Reassignment
// ==========================================
app.get('/api/emergency/incidents', adminAuth, (req, res) => {
  try {
    const { getSosIncidents } = require('./src/services/sosService');
    res.json({ success: true, incidents: getSosIncidents() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/emergency/sos', adminAuth, async (req, res) => {
  try {
    const { triggerEmergencySos } = require('./src/services/sosService');
    const { senderPhone, rawText, bookingRef } = req.body;
    const result = await triggerEmergencySos({ senderPhone, rawText, bookingRef });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/emergency/incidents/:id/resolve', adminAuth, (req, res) => {
  try {
    const { resolveSosIncident } = require('./src/services/sosService');
    const inc = resolveSosIncident(req.params.id);
    res.json({ success: !!inc, incident: inc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Owner Monthly P&L Report Endpoints
// ==========================================
app.get('/api/owner/pnl', async (req, res) => {
  try {
    const { getOwnerMonthlyPnl } = require('./src/services/monthlyPnlService');
    const phone = req.query.phone || '+919822012345';
    const month = req.query.month || '2026-08';
    const pnl = await getOwnerMonthlyPnl(phone, month);
    res.json({ success: true, pnl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/owner/pnl/pdf', async (req, res) => {
  try {
    const { getOwnerMonthlyPnl, generateMonthlyPnlPDF } = require('./src/services/monthlyPnlService');
    const phone = req.query.phone || '+919822012345';
    const month = req.query.month || '2026-08';
    const pnl = await getOwnerMonthlyPnl(phone, month);
    const pdfBuffer = await generateMonthlyPnlPDF(pnl);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="GoMate-Monthly-PnL-${month}.pdf"`,
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/owner/pnl/send-whatsapp', async (req, res) => {
  try {
    const { getOwnerMonthlyPnl, formatMonthlyPnlWhatsApp } = require('./src/services/monthlyPnlService');
    const { phone, month } = req.body;
    const targetPhone = phone || '+919822012345';
    const pnl = await getOwnerMonthlyPnl(targetPhone, month || '2026-08');
    const msg = formatMonthlyPnlWhatsApp(pnl);

    try {
      const { sendWhatsAppDirect } = require('./src/services/whatsappWeb');
      await sendWhatsAppDirect(targetPhone, msg);
    } catch (_) {}

    res.json({
      success: true,
      phone: targetPhone,
      month: pnl.month,
      whatsapp_message: msg
    });
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

// Owner Diesel & Expense Logbook Endpoints
app.get('/api/owner/expenses', async (req, res) => {
  try {
    const phone = req.query.phone || '+919822012345';
    const expensesRepo = require('./src/db/expenses.repo');
    const result = await expensesRepo.getOwnerExpenses(phone);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/owner/expenses', async (req, res) => {
  try {
    const expensesRepo = require('./src/db/expenses.repo');
    const record = await expensesRepo.addExpenseRecord(req.body);
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/owner/expenses/:id', async (req, res) => {
  try {
    const expensesRepo = require('./src/db/expenses.repo');
    const success = await expensesRepo.deleteExpenseRecord(req.params.id);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Owner Machinery Preventive Maintenance Endpoints
app.get('/api/owner/maintenance', async (req, res) => {
  try {
    const phone = req.query.phone || '+919822012345';
    const { getOwnerMaintenanceSchedule } = require('./src/services/maintenanceService');
    const schedule = await getOwnerMaintenanceSchedule(phone);
    res.json({ success: true, schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/owner/maintenance/send-alert', async (req, res) => {
  try {
    const { phone } = req.body;
    const { sendMaintenanceWhatsAppAlert } = require('./src/services/maintenanceService');
    const result = await sendMaintenanceWhatsAppAlert(phone || '+919822012345');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/owner/maintenance/log-service', async (req, res) => {
  try {
    const { phone, service_id } = req.body;
    const { markServiceCompleted } = require('./src/services/maintenanceService');
    const result = markServiceCompleted(phone || '+919822012345', service_id || 'engine_oil');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Automated WhatsApp Feedback & Reviews Endpoints
app.post('/api/bookings/:id/complete-and-trigger-feedback', async (req, res) => {
  try {
    const bookingId = req.params.id;
    const allBookings = await bookingsRepo.getAllBookings();
    const booking = allBookings.find(b => String(b.id) === String(bookingId) || b.booking_ref === bookingId) || {
      id: bookingId,
      booking_ref: 'GM-J39Z',
      customer_phone: '+919876500001',
      customer_name: 'Ramesh Patil',
      owner_phone: '+919822012345',
      owner_name: 'Rajesh Patil',
      equipment_name: 'Mahindra 575 DI (45 HP) [रोटाव्हेटर]',
      village: 'Shegaon'
    };

    await bookingsRepo.updateBookingStatus(bookingId, 'completed');
    const { triggerFeedbackRequest } = require('./src/services/feedbackService');
    const feedbackResult = await triggerFeedbackRequest(booking);

    res.json({
      success: true,
      booking_id: bookingId,
      status: 'completed',
      feedbackResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/owner/reviews', async (req, res) => {
  try {
    const phone = req.query.phone || '+919822012345';
    const reviewsRepo = require('./src/db/reviews.repo');
    const result = await reviewsRepo.getOwnerReviews(phone);
    res.json({ success: true, ...result });
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

// =============================================================
// Admin Fleet Route Optimizer & Dispatch Endpoints
// =============================================================
const fleetRouteService = require('./src/services/fleetRouteService');

/** GET /api/admin/fleet/pending — all bookings needing a machine assignment */
app.get('/api/admin/fleet/pending', adminAuth, async (req, res) => {
  try {
    const bookings = await fleetRouteService.getPendingUnassignedBookings();
    res.json({ success: true, bookings, count: bookings.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/admin/fleet/nearest — top-4 nearest idle machines to a location */
app.get('/api/admin/fleet/nearest', adminAuth, async (req, res) => {
  try {
    const { location, equipment_type } = req.query;
    if (!location) return res.status(400).json({ error: 'location query param required' });
    const machines = await fleetRouteService.findNearestIdleMachines(location, equipment_type || 'tractor');
    res.json({ success: true, machines, nearest_machine: machines[0] || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/admin/fleet/assign — assign a machine + driver and send WhatsApp dispatch */
app.post('/api/admin/fleet/assign', adminAuth, async (req, res) => {
  try {
    const { booking_ref, machine_id, machine_model, driver_name, driver_phone, farmer_phone, farmer_village, eta_minutes, distance_km, equipment_type } = req.body;
    if (!booking_ref || !machine_model) return res.status(400).json({ error: 'booking_ref and machine_model required' });
    const result = await fleetRouteService.assignMachineToBooking({
      bookingRef: booking_ref, machineId: machine_id, machineModel: machine_model,
      driverName: driver_name, driverPhone: driver_phone, farmerPhone: farmer_phone,
      farmerVillage: farmer_village, etaMinutes: eta_minutes, distanceKm: distance_km,
      equipmentType: equipment_type
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/admin/fleet/log — full assignment audit log */
app.get('/api/admin/fleet/log', adminAuth, (req, res) => {
  const log = fleetRouteService.getAssignmentLog();
  res.json({ success: true, log, count: log.length });
});

// =============================================================
// Owner Monthly Booking & Earnings Calendar Endpoint
// =============================================================
const calendarService = require('./src/services/calendarService');

/** GET /api/owner/calendar — owner monthly schedule, booked days, and net profits */
app.get('/api/owner/calendar', async (req, res) => {
  try {
    const { phone, month } = req.query;
    const calendar = await calendarService.getOwnerMonthlyCalendar(phone || '+919822012345', month || '2026-08');
    res.json({ success: true, calendar });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================
// Farmer Loyalty & Village Referral Program Endpoints
// =============================================================
const loyaltyService = require('./src/services/loyaltyService');

/** GET /api/farmer/loyalty — farmer loyalty tier, reward points, and referral link */
app.get('/api/farmer/loyalty', async (req, res) => {
  try {
    const { phone } = req.query;
    const profile = await loyaltyService.getFarmerLoyaltyProfile(phone || '+919876543210');
    res.json({ success: true, profile });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/farmer/loyalty/send-whatsapp — dispatch loyalty balance and referral invite on WhatsApp */
app.post('/api/farmer/loyalty/send-whatsapp', async (req, res) => {
  try {
    const { phone } = req.body;
    const result = await loyaltyService.sendLoyaltyWhatsApp(phone || '+919876543210');
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/farmer/loyalty/apply-referral — redeem village referral code */
app.post('/api/farmer/loyalty/apply-referral', async (req, res) => {
  try {
    const { phone, referral_code } = req.body;
    const result = await loyaltyService.applyReferralCode(phone, referral_code);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================
// Jath APMC Krishi Mandi Live Crop Rates Endpoints
// =============================================================
const mandiService = require('./src/services/mandiService');

/** GET /api/mandi/prices — get live Jath APMC crop market rates */
app.get('/api/mandi/prices', (req, res) => {
  try {
    const { crop } = req.query;
    const data = mandiService.getJathMandiPrices(crop);
    res.json({ success: true, ...data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/mandi/send-whatsapp — dispatch mandi rates to farmer on WhatsApp */
app.post('/api/mandi/send-whatsapp', async (req, res) => {
  try {
    const { phone, crop } = req.body;
    const result = await mandiService.sendMandiWhatsAppAlert(phone || '+919876543210', crop || '');
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================
// Jath Taluka Hyperlocal Weather & Spraying Advisory Endpoints
// =============================================================
const weatherService = require('./src/services/weatherService');

/** GET /api/weather/forecast — village weather & chemical spraying window index */
app.get('/api/weather/forecast', (req, res) => {
  try {
    const { village } = req.query;
    const data = weatherService.getVillageWeatherForecast(village || 'शेगाव');
    res.json({ success: true, ...data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/weather/send-whatsapp — dispatch weather advisory to farmer on WhatsApp */
app.post('/api/weather/send-whatsapp', async (req, res) => {
  try {
    const { phone, village } = req.body;
    const result = await weatherService.sendWeatherWhatsAppAlert(phone || '+919876543210', village || 'शेगाव');
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
