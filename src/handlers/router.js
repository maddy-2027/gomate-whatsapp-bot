const { getText } = require('../services/language');
const menuHandler = require('./customer/menuHandler');
const searchHandler = require('./customer/searchHandler');
const bookingFlow = require('./customer/bookingFlow');
const statusHandler = require('./customer/statusHandler');
const onboardingFlow = require('./owner/onboardingFlow');
const listingFlow = require('./owner/listingFlow');
const dashboardHandler = require('./owner/dashboardHandler');
const subscriptionHandler = require('./owner/subscriptionHandler');
const { generateChatResponse } = require('../services/gemini');

async function routeMessage(phone, text, session) {
  const t = text.trim().toLowerCase();
  
  if (t === 'help') {
    return getText(session.language || 'en', 'help_text');
  }

  // Handle global reset / language switch commands
  if (t === 'reset' || t === 'restart' || t === '00' || t === 'change language' || t === 'भाषा बदला') {
    session.state = 'LANG_SELECT';
    session.language = null;
    session.role = null;
    session.data = {};
    return getText('en', 'welcome');
  }

  // Handle Main Menu / Back commands from any stage
  if (t === '0' || t === 'menu' || t === 'main menu' || t === 'back' || t === 'home' || t === 'मुख्य मेनू' || t === 'मेनू') {
    if (session.role === 'owner') {
      session.state = 'OWNER_MENU';
      return getText(session.language, 'owner_menu');
    } else {
      session.role = 'customer';
      session.state = 'CUSTOMER_MENU';
      return getText(session.language, 'customer_menu');
    }
  }


  // Handle first time or reset initialization
  if (!session.language || session.state === 'INIT') {
    if (session.state === 'LANG_SELECT') {
      if (t === '1' || t.includes('मराठी') || t.includes('marathi')) {
        session.language = 'mr';
      } else if (t === '2' || t.includes('english')) {
        session.language = 'en';
      } else if (t === '3' || t.includes('हिंदी') || t.includes('hindi')) {
        session.language = 'hi';
      } else {
        return getText('en', 'welcome');
      }
      session.state = 'ROLE_SELECT';
      return getText(session.language, 'role_select');
    } else {
      session.state = 'LANG_SELECT';
      return getText('en', 'welcome');
    }
  }

  // Role Selection
  if (session.state === 'ROLE_SELECT') {
    if (t === '1' || t.includes('customer') || t.includes('find') || t.includes('ग्राहक') || t.includes('उपकरणे')) {
      session.role = 'customer';
      session.state = 'CUSTOMER_MENU';
      return getText(session.language, 'customer_menu');
    } else if (t === '2' || t.includes('owner') || t.includes('rent') || t.includes('मालक')) {
      session.role = 'owner';
      session.state = 'ONBOARD_NAME';
      return getText(session.language, 'owner_onboard_name');
    } else {
      return getText(session.language, 'role_select');
    }
  }

  // Navigation commands fallback
  if (t === 'hi' || t === 'hello' || t === 'namaste' || t === 'namaskar') {
    if (session.role === 'owner') {
      session.state = 'OWNER_MENU';
      return getText(session.language, 'owner_menu');
    } else {
      session.state = 'CUSTOMER_MENU';
      return getText(session.language, 'customer_menu');
    }
  }


  switch (session.state) {
    // --- CUSTOMER FLOWS ---
    case 'CUSTOMER_MENU':
      if (t === '1') { session.state = 'SEARCH_CATEGORY'; return getText(session.language, 'category_select'); }
      if (t === '2') { session.state = 'CHECK_STATUS'; return getText(session.language, 'booking_status_prompt'); }
      if (t === '3') { return getText(session.language, 'help_text'); }
      return await generateChatResponse(text, session.language || 'en', JSON.stringify(session.data), session);
    case 'SEARCH_CATEGORY':
      return await searchHandler.handleCategorySelect(phone, text, session);
    case 'SEARCH_LOCATION':
      return await searchHandler.handleLocationInput(phone, text, session);
    case 'BOOKING_SELECT':
      return await bookingFlow.handleEquipmentSelect(phone, text, session);
    case 'BOOKING_DATES':
      return await bookingFlow.handleDateInput(phone, text, session);
    case 'BOOKING_CONFIRM':
      return await bookingFlow.handleConfirmation(phone, text, session);
    case 'CHECK_STATUS':
      return await statusHandler.handleStatusQuery(phone, text, session);
      
    // --- OWNER FLOWS ---
    case 'OWNER_MENU':
      if (t === '1') { session.state = 'LISTING_CATEGORY'; return getText(session.language, 'listing_category'); }
      if (t === '2') { return await dashboardHandler.showDashboard(phone, session); }
      if (t === '3') { return await subscriptionHandler.showStatus(phone, session); }
      if (t === '4') { return getText(session.language, 'help_text'); }
      return await generateChatResponse(text, session.language || 'en', JSON.stringify(session.data), session);

    case 'ONBOARD_NAME':
      return await onboardingFlow.handleNameInput(phone, text, session);
    case 'ONBOARD_DISTRICT':
      return await onboardingFlow.handleDistrictInput(phone, text, session);
    case 'LISTING_CATEGORY':
      return await listingFlow.handleCategorySelect(phone, text, session);
    case 'LISTING_TYPE':
      return await listingFlow.handleTypeInput(phone, text, session);
    case 'LISTING_MODEL':
      return await listingFlow.handleModelInput(phone, text, session);
    case 'LISTING_PRICE':
      return await listingFlow.handlePriceInput(phone, text, session);
      
    default:
      return await generateChatResponse(text, session.language || 'en', JSON.stringify(session.data), session);
  }
  
  return session.role === 'owner' ? getText(session.language, 'owner_menu') : getText(session.language, 'customer_menu');
}

module.exports = { routeMessage };

