const { getText, detectLanguage } = require('../services/language');
const { getUser, upsertUser } = require('../db/users.repo');
const searchHandler = require('./customer/searchHandler');
const bookingFlow = require('./customer/bookingFlow');
const statusHandler = require('./customer/statusHandler');
const onboardingFlow = require('./owner/onboardingFlow');
const listingFlow = require('./owner/listingFlow');
const dashboardHandler = require('./owner/dashboardHandler');
const subscriptionHandler = require('./owner/subscriptionHandler');
const { generateChatResponse } = require('../services/gemini');
const { hasPendingDispatch, handleOwnerResponse } = require('../services/dispatchService');
const { hasPendingFeedback, handleFeedbackResponse } = require('../services/feedbackService');
const { isSosKeyword, triggerEmergencySos } = require('../services/sosService');
const { isLoyaltyKeyword, getFarmerLoyaltyProfile, formatLoyaltyWhatsAppMessage, applyReferralCode } = require('../services/loyaltyService');
const { isMandiKeyword, getJathMandiPrices, formatMandiWhatsAppMessage } = require('../services/mandiService');

const userProfileCache = new Map();

function isNaturalQuery(text) {
  const t = (text || '').toLowerCase().trim();
  const words = t.split(/\s+/);
  if (words.length >= 3) return true;
  const queryKeywords = [
    'how', 'what', 'why', 'when', 'where', 'who', 'which', 'can', 'do', 'cost', 'rate', 'price', 'rent', 'hire',
    'jcb', 'gcd', 'tractor', 'truck', 'harvester', 'dost', 'ace', 'day', 'days',
    'काय', 'कसे', 'कुठे', 'कधी', 'किती', 'भाडे', 'दर', 'खर्च', 'ट्रॅक्टर', 'जेसीबी', 'मशिन', 'पाहिजे', 'हवे', 'दिवस', 'रुपये',
    'क्या', 'कैसे', 'कहाँ', 'कब', 'कितना', 'किराया', 'ट्रैक्टर', 'चाहिए', 'दिन'
  ];
  return queryKeywords.some(kw => t.includes(kw));
}

async function routeMessage(phone, text, session) {
  const rawText = (text || '').trim();
  const t = rawText.toLowerCase();

  // 0. Check if this phone has an active 2-Way Owner Dispatch Request (Accept / Reject)
  if (hasPendingDispatch(phone)) {
    const dispatchReply = await handleOwnerResponse(phone, rawText);
    if (dispatchReply) return dispatchReply;
  }

  // 0.1 Check if this phone has a pending job feedback request (1-5 Star Rating)
  if (hasPendingFeedback(phone)) {
    const feedbackReply = await handleFeedbackResponse(phone, rawText, session);
    if (feedbackReply) return feedbackReply;
  }

  // 0.2 Check if this is an Emergency SOS / Machinery Breakdown trigger
  if (isSosKeyword(rawText)) {
    const sosResult = await triggerEmergencySos({ senderPhone: phone, rawText, bookingRef: session.bookingRef });
    return sosResult.farmerReply;
  }

  // 0.3 Check if this is a Farmer Loyalty, Reward Points, or Referral query
  if (isLoyaltyKeyword(rawText)) {
    if (t.startsWith('ref-') || t.startsWith('gm-jath')) {
      const refRes = await applyReferralCode(phone, rawText);
      return refRes.messageMr;
    }
    const profile = await getFarmerLoyaltyProfile(phone);
    return formatLoyaltyWhatsAppMessage(profile);
  }

  // 0.4 Check if this is a Jath APMC Mandi / Live Market Rate query
  if (isMandiKeyword(rawText)) {
    const mandiData = getJathMandiPrices(rawText);
    return formatMandiWhatsAppMessage(mandiData);
  }

  const isSingleDigit = /^[0-9]+$/.test(t);
  const isShortGreeting = ['hi', 'hello', 'hey', 'start', 'namaste', 'namaskar', 'नमस्कार', 'नमस्ते'].includes(t);
  const isLocationPin = rawText.startsWith('GPS_LOCATION:');

  if (!session.customerName) {
    if (userProfileCache.has(phone)) {
      const cached = userProfileCache.get(phone);
      session.customerName = cached.name;
      session.language = session.language || cached.language;
      session.role = session.role || cached.role;
    } else {
      getUser(phone).then(u => {
        if (u && u.name) {
          userProfileCache.set(phone, u);
          session.customerName = u.name;
          if (!session.language && u.language) session.language = u.language;
          if (!session.role && u.role) session.role = u.role;
        }
      }).catch(() => {});
    }
  }

  // Auto-detect language
  if (!session.languageChosen && !isSingleDigit && !isLocationPin) {
    const detectedLang = detectLanguage(rawText);
    if (detectedLang) session.language = detectedLang;
  }

  const currentLang = session.language || detectLanguage(rawText) || 'en';

  if (t === 'help' || t === 'मदत' || t === 'सहायता') return getText(currentLang, 'help_text');

  if (t === 'reset' || t === 'restart' || t === '00' || t === 'change language' || t === 'भाषा बदला') {
    session.state = 'LANG_SELECT';
    session.language = null;
    session.languageChosen = false;
    session.role = null;
    session.data = {};
    return getText('mr', 'welcome');
  }

  if (t === '0' || t === 'menu' || t === 'main menu' || t === 'back' || t === 'home' || t === 'मेनू') {
    if (session.role === 'owner') {
      session.state = 'OWNER_MENU';
      return getText(currentLang, 'owner_menu');
    }
    session.role = 'customer';
    session.state = 'CUSTOMER_MENU';
    return getText(currentLang, 'customer_menu');
  }

  function isBookingIntent(text) {
    const s = (text || '').toLowerCase().trim();

    // 1. If user is asking for equipment, duration, or price, it is a NEW inquiry, NEVER a confirmation!
    const isNewInquiry = /(jcb|gcd|tractor|ट्रॅक्टर|ट्रैक्टर|truck|ट्रक|harvester|हार्वेस्टर|dost|दोस्त|bolero|बोलेरो|ace|हत्ती|हाथी|excavator|एक्सकॅव्हेटर|पोकलेन|rotavator|रोटाव्हेटर|drone|ड्रोन|rate|price|cost|दर|भाडे|खर्च|किंमत|रुपये|किती|कितना|day|days|दिवस|दिन|want|need|चाहिए|पाहिजे|हवे|\?)/i.test(s);
    if (isNewInquiry) return false;

    // 2. Direct exact booking confirmation phrases
    const exactBookingPhrases = [
      '1', 'book', 'book now', 'book this', 'pay', 'pay now', 'proceed', 'proceed to pay', 'confirm', 'confirm booking', 'yes', 'order',
      'बुक करा', 'बुक', 'होय', 'होय बुक करा', 'कन्फर्म', 'कन्फर्म करा', 'पेमेंट करा', 'पेमेंट लिंक', 'पेमेंट लिंक पाठवा', 'बुकिंग करा',
      'बुक करो', 'बुक करना है', 'हाँ', 'हाँ बुक करो', 'कन्फर्म करो', 'पेमेंट करो'
    ];
    if (exactBookingPhrases.includes(s)) return true;

    // 3. Prefix matching for unambiguous commands (e.g. "book please", "pay now please")
    if (/^(book|pay|confirm|yes|होय|हाँ|कन्फर्म)\b/i.test(s) && !s.includes('?') && !s.includes('how') && !s.includes('what')) {
      return true;
    }
    return false;
  }

  // 💳 DIRECT BOOKING & PAYMENT LINK TRIGGER:
  // Only trigger booking if a quote is actively stored in session AND user sends an explicit booking confirmation!
  if (session.data && session.data.lastQuote && isBookingIntent(rawText)) {
    session.role = 'customer';
    return await bookingFlow.createInstantBookingWithProcess(phone, session);
  }

  const isInActiveInputState = [
    'BOOKING_DATES', 'BOOKING_DURATION', 'BOOKING_SELECT',
    'SEARCH_LOCATION', 'CUSTOMER_NAME', 'ONBOARD_NAME',
    'ONBOARD_DISTRICT', 'LISTING_TYPE', 'LISTING_MODEL', 'LISTING_PRICE', 'CHECK_STATUS'
  ].includes(session.state);

  // 🌟 TOP-LEVEL INSTANT QUERY RESOLUTION:
  // If user sends a question or machine rate query while in general browsing, answer directly!
  if (!isInActiveInputState && isNaturalQuery(rawText) && !isSingleDigit && !isShortGreeting) {
    session.role = session.role || 'customer';
    session.state = 'CUSTOMER_MENU';
    return await generateChatResponse(rawText, currentLang, 'User direct natural question', session);
  }

  if (!session.state || session.state === 'INIT') {
    session.state = 'LANG_SELECT';
    return getText('mr', 'welcome');
  }

  if (session.state === 'LANG_SELECT') {
    if (t === '1' || t.includes('मराठी') || t.includes('marathi')) session.language = 'mr';
    else if (t === '2' || t.includes('english')) session.language = 'en';
    else if (t === '3' || t.includes('हिंदी') || t.includes('hindi')) session.language = 'hi';
    else if (isSingleDigit) session.language = 'en';
    else if (isNaturalQuery(rawText)) {
      const detected = detectLanguage(rawText);
      const effectiveLang = detected || session.language || 'en';
      const ans = await generateChatResponse(rawText, effectiveLang, 'Inquiry before language selection', session);
      return ans;
    } else {
      session.language = 'en';
    }
    session.languageChosen = true;  // Lock language
    session.state = 'ROLE_SELECT';
    return getText(session.language, 'role_select');
  }

  if (session.state === 'ROLE_SELECT') {
    if (t === '1' || t.includes('customer') || t.includes('find') || t.includes('ग्राहक')) {
      session.role = 'customer';
      if (session.customerName) {
        session.state = 'CUSTOMER_MENU';
        return getText(session.language, 'welcome_back_customer', { name: session.customerName });
      }
      session.state = 'CUSTOMER_NAME';
      return getText(session.language, 'customer_onboard_name');
    }
    if (t === '2' || t.includes('owner') || t.includes('rent') || t.includes('मालक')) {
      session.role = 'owner';
      if (session.customerName) {
        session.state = 'OWNER_MENU';
        return getText(session.language, 'owner_menu');
      }
      session.state = 'ONBOARD_NAME';
      return getText(session.language, 'owner_onboard_name');
    }

    if (isNaturalQuery(rawText)) {
      session.role = 'customer';
      return await generateChatResponse(rawText, session.language, 'Inquiry during role selection', session);
    }
    return getText(session.language, 'role_select');
  }

  if (isShortGreeting) {
    if (session.role === 'owner') {
      session.state = 'OWNER_MENU';
      return getText(session.language, 'owner_menu');
    }
    session.state = 'CUSTOMER_MENU';
    if (session.customerName) return getText(session.language, 'welcome_back_customer', { name: session.customerName });
    return getText(session.language, 'customer_menu');
  }

  switch (session.state) {
    case 'CUSTOMER_NAME': {
      if (isNaturalQuery(rawText)) {
        return await generateChatResponse(rawText, session.language, 'Inquiry instead of entering customer name', session);
      }
      const name = rawText.trim();
      session.customerName = name;
      session.role = 'customer';
      userProfileCache.set(phone, { name, role: 'customer', language: session.language });
      upsertUser({ phone, name, role: 'customer', language: session.language }).catch(() => {});
      session.state = 'CUSTOMER_MENU';
      return getText(session.language, 'customer_onboard_welcome', { name });
    }

    case 'CUSTOMER_MENU':
      if (t === '1') { session.state = 'SEARCH_CATEGORY'; return getText(session.language, 'category_select'); }
      if (t === '2') { session.state = 'CHECK_STATUS'; return getText(session.language, 'booking_status_prompt'); }
      if (t === '3') { return getText(session.language, 'help_text'); }
      // If user asks any natural language question out-of-context:
      return await generateChatResponse(rawText, session.language, 'Customer inquiring from menu', session);

    case 'SEARCH_CATEGORY': {
      if (['1', '2', '3'].includes(rawText.trim())) {
        return await searchHandler.handleCategorySelect(phone, rawText, session);
      }
      // If user types machine name directly (e.g. "JCB", "Tractor", "ट्रॅक्टर", "Truck"):
      const searchDirect = rawText.toLowerCase();
      if (searchDirect.includes('tractor') || searchDirect.includes('ट्रॅक्टर') || searchDirect.includes('sheti') || searchDirect.includes('agri')) {
        session.data.category = 'agriculture';
        session.state = 'SEARCH_LOCATION';
        return getText(session.language, 'location_prompt');
      }
      if (searchDirect.includes('truck') || searchDirect.includes('ace') || searchDirect.includes('वाहतूक') || searchDirect.includes('transport')) {
        session.data.category = 'transport';
        session.state = 'SEARCH_LOCATION';
        return getText(session.language, 'location_prompt');
      }
      if (searchDirect.includes('jcb') || searchDirect.includes('जेसीबी') || searchDirect.includes('excavator') || searchDirect.includes('बांधकाम') || searchDirect.includes('infra')) {
        session.data.category = 'infrastructure';
        session.state = 'SEARCH_LOCATION';
        return getText(session.language, 'location_prompt');
      }
      return await generateChatResponse(rawText, session.language, 'User searching equipment category or asking custom equipment query', session);
    }
    case 'SEARCH_LOCATION': return await searchHandler.handleLocationInput(phone, rawText, session);
    case 'BOOKING_SELECT':   return await bookingFlow.handleEquipmentSelect(phone, rawText, session);
    case 'BOOKING_SERVICE_SELECT': return await bookingFlow.handleServiceSelect(phone, rawText, session);
    case 'BOOKING_DATES':    return await bookingFlow.handleDateInput(phone, rawText, session);
    case 'BOOKING_DURATION': return await bookingFlow.handleDurationInput(phone, rawText, session);
    case 'BOOKING_CONFIRM':  return await bookingFlow.handleConfirmation(phone, rawText, session);
    case 'CHECK_STATUS':    return await statusHandler.handleStatusQuery(phone, rawText, session);

    case 'OWNER_MENU':
      if (t === '1') { session.state = 'LISTING_CATEGORY'; return getText(session.language, 'listing_category'); }
      if (t === '2') { return await dashboardHandler.showDashboard(phone, session); }
      if (t === '3') { return await subscriptionHandler.showStatus(phone, session); }
      if (t === '4') { return getText(session.language, 'help_text'); }
      return await generateChatResponse(rawText, session.language, 'Owner asking question from owner menu', session);

    case 'ONBOARD_NAME':     return await onboardingFlow.handleNameInput(phone, rawText, session);
    case 'ONBOARD_DISTRICT': return await onboardingFlow.handleDistrictInput(phone, rawText, session);
    case 'LISTING_CATEGORY': return await listingFlow.handleCategorySelect(phone, rawText, session);
    case 'LISTING_TYPE':     return await listingFlow.handleTypeInput(phone, rawText, session);
    case 'LISTING_MODEL':    return await listingFlow.handleModelInput(phone, rawText, session);
    case 'LISTING_SERVICES': return await listingFlow.handleServicesInput(phone, rawText, session);
    case 'LISTING_PRICE':    return await listingFlow.handlePriceInput(phone, rawText, session);

    default:
      return await generateChatResponse(rawText, session.language || 'en', 'General inquiry', session);
  }
}

module.exports = { routeMessage };
