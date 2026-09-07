const crypto = require('crypto');
const ownersRepo = require('../db/owners.repo');
const { sendWhatsAppDirect } = require('./whatsappWeb');

const OWNER_SESSION_SECRET = process.env.OWNER_SESSION_SECRET || 'gomate_owner_portal_jwt_secret_2026_jath_auth_token_key';
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_VERIFY_ATTEMPTS = 5;

// In-memory OTP store: phone -> { otp, expiresAt, attempts, requestedAt }
const otpStore = new Map();

/**
 * Normalize Indian phone numbers to canonical E.164 (+91XXXXXXXXXX)
 */
function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/[^0-9]/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length > 10 && !digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
}

/**
 * Sign owner session token (HMAC-SHA256)
 */
function signOwnerSession(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', OWNER_SESSION_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

/**
 * Verify owner session token
 */
function verifyOwnerSession(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, suppliedSignature] = parts;

  const expectedSignature = crypto.createHmac('sha256', OWNER_SESSION_SECRET).update(encodedPayload).digest('base64url');
  const expected = Buffer.from(expectedSignature);
  const supplied = Buffer.from(suppliedSignature);

  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.scope !== 'owner' || !payload.exp || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch (_) {
    return null;
  }
}

/**
 * Request OTP via WhatsApp
 */
async function requestOtp(rawPhone) {
  const phone = normalizePhone(rawPhone);
  if (!phone || phone.length < 12) {
    return { success: false, error: 'अवैध मोबाईल क्रमांक. कृपया १० अंकी क्रमांक प्रविष्ट करा.' };
  }

  // Verify owner is registered in database
  const owner = await ownersRepo.getOwnerByPhone(phone);
  if (!owner) {
    return {
      success: false,
      code: 'NOT_REGISTERED',
      error: 'हा मोबाईल क्रमांक नोंदणीकृत मालक म्हणून आढळला नाही. कृपया प्रथम गोमेट व्हॉट्सअॅपवर (+91 86054 70552) नोंदणी करा.'
    };
  }

  // Rate limiting check
  const existing = otpStore.get(phone);
  if (existing && (Date.now() - existing.requestedAt < OTP_RESEND_COOLDOWN_MS)) {
    const waitSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - existing.requestedAt)) / 1000);
    return {
      success: false,
      error: `कृपया नवीन OTP मागण्यापूर्वी ${waitSec} सेकंद प्रतीक्षा करा.`
    };
  }

  // Generate 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
    requestedAt: Date.now()
  });

  const ownerName = owner.name || 'शेतकरी/मालक';
  const message = `🚜 *GoMate मालक पोर्टल (Owner Pro)*\n\n` +
    `नमस्कार *${ownerName}*,\n\n` +
    `तुमचा GoMate मालक पोर्टल लॉगिन OTP आहे:\n` +
    `🔐 *${otp}*\n\n` +
    `⏱️ हा OTP पुढील *१० मिनिटांसाठी* वैध आहे.\n` +
    `सुरक्षिततेसाठी हा कोड कोणाशीही शेअर करू नका.\n\n` +
    `_GoMate — शेती व मशिनरीचे डिजिटल साथीदार_`;

  console.log(`🔑 [Owner Auth] OTP generated for ${phone} (${ownerName}): ${otp}`);

  // Send WhatsApp message if connected
  let sent = false;
  try {
    sent = await sendWhatsAppDirect(phone, message);
  } catch (err) {
    console.warn(`⚠️ [Owner Auth] Failed to dispatch OTP to ${phone}:`, err.message);
  }

  return {
    success: true,
    message: sent
      ? 'OTP तुमच्या व्हॉट्सअॅपवर पाठवण्यात आला आहे.'
      : 'OTP तयार केला आहे. (व्हॉट्सअॅप कनेक्ट नसल्यास विकास मोड OTP वापरा)',
    phone,
    ownerName,
    // Return debug OTP in non-production or if WhatsApp dispatch was offline so testing never stalls
    debugOtp: (process.env.NODE_ENV !== 'production' || !sent) ? otp : undefined
  };
}

/**
 * Verify OTP and issue JWT session token
 */
async function verifyOtp(rawPhone, inputOtp) {
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return { success: false, error: 'मोबाईल क्रमांक आवश्यक आहे.' };
  }

  const cleanOtp = String(inputOtp || '').trim();
  if (!cleanOtp || cleanOtp.length !== 6) {
    return { success: false, error: 'कृपया ६ अंकी वैध OTP प्रविष्ट करा.' };
  }

  const record = otpStore.get(phone);
  if (!record || Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return {
      success: false,
      error: 'OTP कालबाह्य झाला आहे किंवा विनंती केली नाही. कृपया नवीन OTP मागवा.'
    };
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(phone);
    return {
      success: false,
      error: 'खूप जास्त चुकीचे प्रयत्न. सुरक्षेसाठी हा OTP रद्द केला आहे. कृपया नवीन OTP मागवा.'
    };
  }

  if (record.otp !== cleanOtp) {
    record.attempts += 1;
    const remaining = MAX_VERIFY_ATTEMPTS - record.attempts;
    return {
      success: false,
      error: `चुकीचा OTP. उर्वरित प्रयत्न: ${remaining}`
    };
  }

  // OTP is valid - clean up
  otpStore.delete(phone);

  // Fetch full owner profile
  const owner = await ownersRepo.getOwnerByPhone(phone);
  if (!owner) {
    return { success: false, error: 'मालक माहिती लोड करण्यात त्रुटी.' };
  }

  // 7-day valid session token
  const tokenPayload = {
    phone: owner.phone,
    name: owner.name,
    district: owner.district,
    taluka: owner.taluka,
    village: owner.village,
    subscription_status: owner.subscription_status,
    scope: 'owner',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000
  };

  const token = signOwnerSession(tokenPayload);

  return {
    success: true,
    token,
    owner: {
      phone: owner.phone,
      name: owner.name,
      district: owner.district,
      village: owner.village,
      subscription_status: owner.subscription_status,
      subscription_expires_at: owner.subscription_expires_at
    }
  };
}

/**
 * Express middleware to protect owner routes
 */
function ownerAuthMiddleware(req, res, next) {
  let token = null;

  // 1. Check Authorization header: Bearer <token>
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Check Cookie header: gm_owner_token=<token>
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').map(c => c.trim());
    const cookieToken = cookies.find(c => c.startsWith('gm_owner_token='));
    if (cookieToken) {
      token = decodeURIComponent(cookieToken.split('=')[1]);
    }
  }

  // 3. Fallback for query param (e.g. PDF downloads or direct links)
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      error: 'अनधिकृत प्रवेश. कृपया प्रथम लॉगिन करा.',
      code: 'AUTH_REQUIRED'
    });
  }

  const payload = verifyOwnerSession(token);
  if (!payload) {
    return res.status(401).json({
      error: 'सत्र कालबाह्य झाले आहे. कृपया पुन्हा लॉगिन करा.',
      code: 'SESSION_EXPIRED'
    });
  }

  req.owner = payload;
  next();
}

module.exports = {
  normalizePhone,
  requestOtp,
  verifyOtp,
  signOwnerSession,
  verifyOwnerSession,
  ownerAuthMiddleware
};
