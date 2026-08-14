const { getText } = require('../../services/language');

async function handleCategorySelect(phone, text, session) {
  const map = { '1': 'agriculture', '2': 'transport', '3': 'infrastructure' };
  const cat = map[text.trim()];
  if (cat) {
    session.data.listingCategory = cat;
    session.state = 'LISTING_TYPE';
    return getText(session.language, 'listing_type');
  }
  return getText(session.language, 'listing_category');
}

async function handleTypeInput(phone, text, session) {
  session.data.listingType = text.trim();
  session.state = 'LISTING_MODEL';
  return getText(session.language, 'listing_model');
}

async function handleModelInput(phone, text, session) {
  session.data.listingModel = text.trim();
  session.state = 'LISTING_PRICE';
  return getText(session.language, 'listing_price');
}

async function handlePriceInput(phone, text, session) {
  const price = parseInt(text.trim());
  if (!isNaN(price)) {
    session.state = 'OWNER_MENU';
    return getText(session.language, 'listing_confirmed', { model: session.data.listingModel }) + '\n\n' + getText(session.language, 'owner_menu');
  }
  return "Please enter a valid numeric price.";
}

module.exports = { handleCategorySelect, handleTypeInput, handleModelInput, handlePriceInput };
