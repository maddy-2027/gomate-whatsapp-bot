const { getText, detectLanguage } = require('../services/language');
const searchHandler = require('./customer/searchHandler');
const bookingFlow = require('./customer/bookingFlow');
const statusHandler = require('./customer/statusHandler');
const onboardingFlow = require('./owner/onboardingFlow');
const listingFlow = require('./owner/listingFlow');
const dashboardHandler = require('./owner/dashboardHandler');
const subscriptionHandler = require('./owner/subscriptionHandler');
const { generateChatResponse } = require('../services/gemini');

/**
 * Intelligent Multilingual Conversation Router
 * Seamlessly handles structured number-based menus, WhatsApp GPS pins, 
 * and conversational natural language questions in Marathi, Hindi, and English.
 */
async function routeMessage(phone, text, session) {
  const rawText = (text || '').trim();
  const t = rawText.toLowerCase();

  const isSingleDigit = /^[0-9]+$/.test(t);
  const isShortGreeting = ['hi', 'hello', 'hey', 'start', 'namaste', 'namaskar', 'नमस्कार', 'नमस्ते'].includes(t);
  const isLocationPin = rawText.startsWith('GPS_LOCATION:');

  // Auto-detect language ONLY on non-digit phrases (words/sentences)
  if (!isSingleDigit) {
    const detectedLang = detectLanguage(rawText);
    if (detectedLang) {
      session.language = detectedLang;
    }
  }

  // Current active language for this user
  const currentLang = session.language || 'mr';

  // ── Global Reset / Help Commands ──────────────────────────────────────────

  if (t === 'help' || t === 'मदत' || t === 'सहायता') {
    return getText(currentLang, 'help_text');
  }

  if (t === 'reset' || t === 'restart' || t === '00' || t === 'change language' || t === 'भाषा बदला' || t === 'भाषा बदलो') {
    session.state    = 'LANG_SELECT';
    session.language = null;
    session.role     = null;
    session.data     = {};
    return getText('mr', 'welcome');
  }

  if (t === '0' || t === 'menu' || t === 'main menu' || t === 'back' || t === 'home' || t === 'मुख्य मेनू' || t === 'मेनू') {
    if (session.role === 'owner') {
      session.state = 'OWNER_MENU';
      return getText(currentLang, 'owner_menu');
    }
    session.role = 'customer';
    session.state = 'CUSTOMER_MENU';
    return getText(currentLang, 'customer_menu');
  }

  // ── Direct Natural Language Question on New Session ───────────────────────
  if ((!session.state || session.state === 'INIT' || session.state === 'LANG_SELECT') && !isSingleDigit && !isShortGreeting && !isLocationPin) {
    session.language = session.language || 'mr';
    session.role = 'customer';
    session.state = 'CUSTOMER_MENU';
    return await generateChatResponse(rawText, session.language, JSON.stringify(session.data || {}), session);
  }

  // ── STEP 1: Brand new session with greeting (e.g. "Hi") ───────────────────
  if (!session.state || session.state === 'INIT') {
    session.state = 'LANG_SELECT';
    return getText('mr', 'welcome');
  }

  // ── STEP 2: Language Selection ─────────────────────────────────────────────
  if (session.state === 'LANG_SELECT') {
    if (t === '1' || t.includes('मराठी') || t.includes('marathi')) {
      session.language = 'mr';
    } else if (t === '2' || t.includes('english')) {
      session.language = 'en';
    } else if (t === '3' || t.includes('हिंदी') || t.includes('hindi')) {
      session.language = 'hi';
    } else {
      session.language = 'mr';
    }
    session.state = 'ROLE_SELECT';
    return getText(session.language, 'role_select');
  }

  // ── STEP 3: Role Selection ─────────────────────────────────────────────────
  if (session.state === 'ROLE_SELECT') {
    if (t === '1' || t.includes('customer') || t.includes('find') || t.includes('ग्राहक') || t.includes('उपकरणे') || t.includes('उपकरण')) {
      session.role = 'customer';
      session.state = 'CUSTOMER_MENU';
      return getText(session.language, 'customer_menu');
    }
    if (t === '2' || t.includes('owner') || t.includes('rent') || t.includes('मालक') || t.includes('मालिक')) {
      session.role = 'owner';
      session.state = 'ONBOARD_NAME';
      return getText(session.language, 'owner_onboard_name');
    }
    return getText(session.language, 'role_select');
  }

  // ── Greeting Shortcut (after language is set) ──────────────────────────────
  if (isShortGreeting) {
    if (session.role === 'owner') {
      session.state = 'OWNER_MENU';
      return getText(session.language, 'owner_menu');
    }
    session.state = 'CUSTOMER_MENU';
    return getText(session.language, 'customer_menu');
  }

  // ── State Machine ──────────────────────────────────────────────────────────
  switch (session.state) {

    // CUSTOMER FLOWS
    case 'CUSTOMER_MENU':
      if (t === '1') { session.state = 'SEARCH_CATEGORY'; return getText(session.language, 'category_select'); }
      if (t === '2') { session.state = 'CHECK_STATUS';    return getText(session.language, 'booking_status_prompt'); }
      if (t === '3') {                                     return getText(session.language, 'help_text'); }
      return await generateChatResponse(rawText, session.language, JSON.stringify(session.data || {}), session);

    case 'SEARCH_CATEGORY':  return await searchHandler.handleCategorySelect(phone, rawText, session);
    case 'SEARCH_LOCATION':  return await searchHandler.handleLocationInput(phone, rawText, session);
    case 'BOOKING_SELECT':   return await bookingFlow.handleEquipmentSelect(phone, rawText, session);
    case 'BOOKING_DATES':    return await bookingFlow.handleDateInput(phone, rawText, session);
    case 'BOOKING_CONFIRM':  return await bookingFlow.handleConfirmation(phone, rawText, session);
    case 'CHECK_STATUS':     return await statusHandler.handleStatusQuery(phone, rawText, session);

    // OWNER FLOWS
    case 'OWNER_MENU':
      if (t === '1') { session.state = 'LISTING_CATEGORY'; return getText(session.language, 'listing_category'); }
      if (t === '2') {                                      return await dashboardHandler.showDashboard(phone, session); }
      if (t === '3') {                                      return await subscriptionHandler.showStatus(phone, session); }
      if (t === '4') {                                      return getText(session.language, 'help_text'); }
      return await generateChatResponse(rawText, session.language, JSON.stringify(session.data || {}), session);

    case 'ONBOARD_NAME':     return await onboardingFlow.handleNameInput(phone, rawText, session);
    case 'ONBOARD_DISTRICT': return await onboardingFlow.handleDistrictInput(phone, rawText, session);
    case 'LISTING_CATEGORY': return await listingFlow.handleCategorySelect(phone, rawText, session);
    case 'LISTING_TYPE':     return await listingFlow.handleTypeInput(phone, rawText, session);
    case 'LISTING_MODEL':    return await listingFlow.handleModelInput(phone, rawText, session);
    case 'LISTING_PRICE':    return await listingFlow.handlePriceInput(phone, rawText, session);

    default:
      return await generateChatResponse(rawText, session.language, JSON.stringify(session.data || {}), session);
  }
}

module.exports = { routeMessage };
