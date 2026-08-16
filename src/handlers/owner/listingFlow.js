const { getText } = require('../../services/language');
const { addEquipment } = require('../../db/equipment.repo');

const SERVICE_MAP = {
  agriculture: {
    '1': 'Ploughing (नांगरणी)',
    '2': 'Rotavator (रोटाव्हेटर)',
    '3': 'Seeding / Sowing (पेरणी)',
    '4': 'Harvesting / Cutting (कापणी / तोडणी)',
    '5': 'Trolley Transport (ट्रॉली)',
    '6': 'Spraying (फवारणी)',
    '7': 'All Attachments (सर्व कामे)'
  },
  infrastructure: {
    '1': 'Land Levelling & Trenching (सपाटीकरण व चर)',
    '2': 'Well & Foundation Digging (विहीर व पाया)',
    '3': 'Building Demolition (पाडकाम)',
    '4': 'Road & Pipeline Work (रस्ते व पाईपलाईन)'
  },
  transport: {
    '1': 'Agri Produce to Mandi (शेतीमाल वाहतूक)',
    '2': 'Construction Material / Sand (वाळू/सिमेंट)',
    '3': 'General Cargo (सर्व प्रकारची मालवाहतूक)'
  }
};

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
  session.state = 'LISTING_SERVICES';

  const cat = session.data.listingCategory || 'agriculture';
  if (cat === 'infrastructure') {
    return getText(session.language, 'listing_services_infra');
  } else if (cat === 'transport') {
    return getText(session.language, 'listing_services_transport');
  }
  return getText(session.language, 'listing_services_agri');
}

async function handleServicesInput(phone, text, session) {
  const t = text.trim();
  const cat = session.data.listingCategory || 'agriculture';
  const mapping = SERVICE_MAP[cat] || SERVICE_MAP.agriculture;

  const selected = [];
  const parts = t.split(/[\s,+/]+/);

  for (const p of parts) {
    if (mapping[p]) {
      selected.push(mapping[p]);
    }
  }

  // If user typed custom text instead of digits (e.g. "Harvesting, Seeding")
  if (selected.length === 0) {
    selected.push(t);
  }

  session.data.listingServices = selected.join(', ');
  session.state = 'LISTING_PRICE';
  return getText(session.language, 'listing_price');
}

async function handlePriceInput(phone, text, session) {
  const priceMatch = text.match(/\b([0-9]{3,6})\b/);
  const price = priceMatch ? parseInt(priceMatch[1]) : parseInt(text.trim());

  if (!isNaN(price) && price > 0) {
    const services = session.data.listingServices || 'All Attachments (सर्व कामे)';
    const model = session.data.listingModel || 'Tractor';
    const category = session.data.listingCategory || 'agriculture';
    const type = session.data.listingType || 'Tractor';
    const district = session.data.ownerDistrict || session.data.location || 'Pune';

    // Save to Database / in-memory catalog
    try {
      await addEquipment({
        owner_phone: phone,
        category: category,
        type: type,
        model: model,
        services: services,
        price_per_day: price,
        district: district,
        rating: 5.0,
        available: true
      });
    } catch (err) {
      console.error('Error saving owner equipment listing:', err);
    }

    session.state = 'OWNER_MENU';
    return getText(session.language, 'listing_confirmed', {
      model: model,
      services: services,
      price: price.toLocaleString('en-IN')
    }) + '\n\n' + getText(session.language, 'owner_menu');
  }

  return getText(session.language, 'listing_price');
}

module.exports = {
  handleCategorySelect,
  handleTypeInput,
  handleModelInput,
  handleServicesInput,
  handlePriceInput
};
