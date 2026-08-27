const { getText } = require('../../services/language');
const { searchEquipment } = require('../../db/equipment.repo');
const { findJathVillage, isJathLocation } = require('../../data/jathVillages');

const CATALOG = {
  agriculture: [
    { id: 101, category: 'agriculture', type: 'Tractor', model: 'Mahindra 575 DI (45 HP)', price_per_day: 1500, rating: 4.9, services: 'नांगरणी, रोटाव्हेटर, पेरणी व ट्रॉली', image_url: '/assets/equipment/agri_tractor_3d.jpg' },
    { id: 102, category: 'agriculture', type: 'Tractor', model: 'John Deere 5310 (55 HP 4WD)', price_per_day: 1800, rating: 4.9, services: '4WD अवजड कामे, बागायत शेती', image_url: '/assets/equipment/agri_tractor_3d.jpg' },
    { id: 103, category: 'agriculture', type: 'Rotavator', model: 'Shaktiman Semi Champion Rotavator', price_per_day: 850, rating: 4.8, services: 'जमीन भुसभुशीत करणे', image_url: '/assets/equipment/agri_hero.jpg' },
    { id: 104, category: 'agriculture', type: 'Harvester', model: 'Claas Crop Tiger 30 Harvester', price_per_day: 4200, rating: 4.9, services: 'गहू, हरभरा, बाजरी व मका काढणी', image_url: '/assets/equipment/agri_hero.jpg' },
    { id: 105, category: 'agriculture', type: 'Sprayer', model: 'ASPEE HTP 500L Tractor Sprayer', price_per_day: 700, rating: 4.7, services: 'डाळिंब व द्राक्ष बागायत फवारणी', image_url: '/assets/equipment/agri_hero.jpg' },
    { id: 106, category: 'agriculture', type: 'Drone (spraying)', model: 'GoMate Agri Spray Drone 10L', price_per_day: 2500, rating: 4.9, services: 'अचूक व जलद औषध फवारणी', image_url: '/assets/equipment/heavy_drone_3d.jpg' },
    { id: 107, category: 'agriculture', type: 'Trailer', model: 'GoMate 4-Tonne Tipping Trailer', price_per_day: 800, rating: 4.6, services: 'धान्य, ऊस व शेतमाल वाहतूक', image_url: '/assets/equipment/agri_hero.jpg' }
  ],
  transport: [
    { id: 201, category: 'transport', type: 'Delivery Trucks', model: 'Tata Ace Gold (छोटा हत्ती)', price_per_day: 1300, rating: 4.8, services: 'जत तालुका अंतर्गत स्थानिक वाहतूक', image_url: '/assets/equipment/transport_cab_3d.jpg' },
    { id: 202, category: 'transport', type: 'Delivery Trucks', model: 'Ashok Leyland Dost Plus Pickup', price_per_day: 1600, rating: 4.8, services: '1.5 टन शेतमाल व भाजीपाला मार्केट', image_url: '/assets/equipment/transport_cab_3d.jpg' },
    { id: 203, category: 'transport', type: 'Trucks', model: 'Tata 407 LPT Medium Truck (4 Tonne)', price_per_day: 2600, rating: 4.7, services: 'सांगली/सांगोला/विजापूर मार्केट वाहतूक', image_url: '/assets/equipment/heavy_drone_3d.jpg' },
    { id: 204, category: 'transport', type: 'Tanker Trucks', model: 'BharatBenz 12KL Water Tanker', price_per_day: 3800, rating: 4.8, services: 'शेती व पिण्यासाठी पाणी टँकर', image_url: '/assets/equipment/heavy_drone_3d.jpg' },
    { id: 205, category: 'transport', type: 'Dump Trucks', model: 'Ashok Leyland Tipper (डंपर)', price_per_day: 4000, rating: 4.7, services: 'मुरूम, माती व खडी वाहतूक', image_url: '/assets/equipment/heavy_drone_3d.jpg' }
  ],
  infrastructure: [
    { id: 301, category: 'infrastructure', type: 'Backhoe Loaders', model: 'JCB 3DX Super EcoXcellence', price_per_day: 4500, rating: 4.9, services: 'शेततळे, चर, सपाटीकरण व बांधकाम', image_url: '/assets/equipment/infra_jcb_3d.jpg' },
    { id: 302, category: 'infrastructure', type: 'Backhoe Loaders', model: 'JCB 4DX Heavy Duty Loader', price_per_day: 5200, rating: 4.8, services: 'अवजड शेततळे व चर खोदकाम', image_url: '/assets/equipment/infra_jcb_3d.jpg' },
    { id: 303, category: 'infrastructure', type: 'Excavators', model: 'Komatsu PC210 Heavy Excavator (पोकलेन)', price_per_day: 7500, rating: 4.9, services: 'मोठे शेततळे, विहीर व खडक फोडणे', image_url: '/assets/equipment/infra_jcb_3d.jpg' },
    { id: 304, category: 'infrastructure', type: 'Bulldozers', model: 'CAT D6 Crawler Dozer (बुलडोझर)', price_per_day: 8000, rating: 4.9, services: 'जमीन सपाटीकरण, बांध व माळरान साफ', image_url: '/assets/equipment/infra_jcb_3d.jpg' }
  ]
};

async function handleCategorySelect(phone, text, session) {
  const map = { '1': 'agriculture', '2': 'transport', '3': 'infrastructure' };
  const cat = map[text.trim()];
  if (cat) {
    session.data.category = cat;
    session.state = 'SEARCH_LOCATION';
    return getText(session.language, 'location_prompt');
  }
  return getText(session.language, 'category_select');
}

async function handleLocationInput(phone, text, session) {
  let district = text.trim();
  let distanceNote = '';

  // Match against 125 villages of Jath Taluka
  const matchedVillage = findJathVillage(district);
  let displayVillage = district;
  
  if (matchedVillage) {
    displayVillage = session.language === 'mr' ? `${matchedVillage.nameMr} (जत तालुका)` : `${matchedVillage.name} (Jath Taluka)`;
  } else {
    displayVillage = `${district} (Jath Taluka - 416404)`;
  }

  session.data.location = displayVillage;
  const category = session.data.category || 'agriculture';
  
  // 1. Fetch equipment from Supabase
  let results = [];
  try {
    const dbPromise = searchEquipment({ category, taluka: 'Jath' });
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([]), 500));
    const dbResults = await Promise.race([dbPromise, timeoutPromise]);
    if (dbResults && dbResults.length > 0) {
      results = dbResults;
    }
  } catch (err) {
    // Instant fallback
  }

  // 2. Fallback to Jath catalog if needed
  if (!results.length) {
    const rawList = CATALOG[category] || CATALOG.agriculture;
    results = rawList.map(item => ({
      ...item,
      location: displayVillage
    }));
  }
  
  if (!results.length) {
    session.state = 'CUSTOMER_MENU';
    return getText(session.language, 'no_results', { type: category, location: displayVillage });
  }

  session.data.searchResults = results;
  session.state = 'BOOKING_SELECT';
  
  const header = getText(session.language, 'search_results_header', { type: category.toUpperCase(), location: displayVillage });
  const cards = results.map((r, i) => {
    let card = getText(session.language, 'equipment_card', { 
      index: i + 1, 
      model: r.model, 
      price: r.price_per_day, 
      location: `${displayVillage} (स्थानिक जत केंद्र)`, 
      rating: r.rating || 4.9 
    });
    if (r.services || r.description) {
      const srvLabel = session.language === 'mr' ? 'उपलब्ध कामे' : (session.language === 'hi' ? 'उपलब्ध सेवाएं' : 'Services');
      card += `\n${srvLabel}: ${r.services || r.description}`;
    }
    return card;
  }).join('\n\n');
  
  const footer = getText(session.language, 'results_footer');
  return `${header}\n\n${cards}\n\n${footer}`;
}

module.exports = { handleCategorySelect, handleLocationInput, CATALOG };
