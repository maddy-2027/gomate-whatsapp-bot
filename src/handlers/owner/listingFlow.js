const { getText } = require('../../services/language');
const { addEquipment } = require('../../db/equipment.repo');

const SERVICE_MAP = {
  agriculture: {
    '1': 'Ploughing / Tillage (नांगरणी)',
    '2': 'Rotavator / Seedbed (रोटाव्हेटर)',
    '3': 'Seeding / Sowing (पेरणी)',
    '4': 'Harvesting / Cutting (कापणी / ऊस तोडणी)',
    '5': 'Trolley Transport (ट्रॉली वाहतूक)',
    '6': 'Spraying (फवारणी)',
    '7': 'All Attachments (सर्व कामे उपलब्ध)'
  },
  infrastructure: {
    '1': 'Farm Ponds & Land Levelling (शेततळे व सपाटीकरण)',
    '2': 'Well & Deep Foundation Digging (विहीर व खोल पाया)',
    '3': 'Rock Breaker / Hard Rock (खडक फोडणे - ब्रेकर)',
    '4': 'Pipeline & Trenching (पाईपलाईन चर खोदकाम)',
    '5': 'Demolition & Debris Clearing (पाडकाम व डेब्रिज उपसा)',
    '6': 'Road Work & Drainage (रस्ते व नाला खोदकाम)',
    '7': 'Heavy Crane Lifting (क्रेन व अवजड लिफ्टिंग)',
    '8': 'All Excavation Work (सर्व प्रकारची खोदकामे)'
  },
  transport: {
    '1': 'Mandi & Agri Produce (शेतीमाल व भाजीपाला)',
    '2': 'House Shifting & Furniture (घरगुती सामान शिफ्टिंग)',
    '3': 'Construction Material / Sand (वाळू, सिमेंट, विटा)',
    '4': 'Commercial Boxes & Goods (व्यापारी मालवाहतूक)',
    '5': 'Water / Liquid Tanker (पाण्याचा टँकर)',
    '6': 'Long Distance Highway Trip (लांब पल्ल्याची वाहतूक)',
    '7': 'All Transport Work (सर्व प्रकारची वाहतूक)'
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

  // If user typed custom text (e.g. "House Shifting, Mandi")
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
    const services = session.data.listingServices || 'All Services (सर्व कामे)';
    const model = session.data.listingModel || 'Vehicle/Equipment';
    const category = session.data.listingCategory || 'agriculture';
    const type = session.data.listingType || 'Machinery';
    const district = session.data.ownerDistrict || session.data.location || 'Pune';

    // Save to Database repository
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
  handlePriceInput,
  SERVICE_MAP
};
