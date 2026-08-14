const { getText } = require('../../services/language');

const CATALOG = {
  agriculture: [
    { id: 101, type: 'agriculture', model: 'Mahindra 575 DI (45 HP Tractor)', price_per_day: 1400, rating: 4.8 },
    { id: 102, type: 'agriculture', model: 'John Deere 5310 (55 HP 4WD Tractor)', price_per_day: 1800, rating: 4.9 },
    { id: 103, type: 'agriculture', model: 'Sonalika Tiger DI 50 Tractor', price_per_day: 1500, rating: 4.7 },
    { id: 104, type: 'agriculture', model: 'Claas Crop Tiger 30 Harvester', price_per_day: 3500, rating: 4.9 },
    { id: 105, type: 'agriculture', model: 'Shaktiman Semi Champion Rotavator', price_per_day: 600, rating: 4.6 }
  ],
  transport: [
    { id: 201, type: 'transport', model: 'Tata 407 LPT Pickup', price_per_day: 2200, rating: 4.7 },
    { id: 202, type: 'transport', model: 'Ashok Leyland Dost Plus', price_per_day: 1600, rating: 4.8 },
    { id: 203, type: 'transport', model: 'Mahindra Bolero Maxi Truck Plus', price_per_day: 1400, rating: 4.6 },
    { id: 204, type: 'transport', model: 'BharatBenz 2823C Tipper Truck', price_per_day: 5000, rating: 4.9 }
  ],
  infrastructure: [
    { id: 301, type: 'infrastructure', model: 'JCB 3DX Super Backhoe Loader', price_per_day: 4200, rating: 4.9 },
    { id: 302, type: 'infrastructure', model: 'Komatsu PC210 Hydraulic Excavator', price_per_day: 7500, rating: 4.8 },
    { id: 303, type: 'infrastructure', model: 'ACE 14XW Hydra Mobile Crane', price_per_day: 5500, rating: 4.7 },
    { id: 304, type: 'infrastructure', model: 'CAT CS11 GC Soil Compactor', price_per_day: 6000, rating: 4.8 }
  ]
};

const { searchEquipment } = require('../../db/equipment.repo');

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
  const district = text.trim();
  session.data.location = district;
  
  const category = session.data.category || 'agriculture';
  
  // 1. Try fetching real equipment from Supabase DB
  let results = [];
  try {
    const dbResults = await searchEquipment({ category, district });
    if (dbResults && dbResults.length > 0) {
      results = dbResults;
    }
  } catch (err) {
    console.error('Error fetching from DB:', err);
  }

  // 2. If no direct match in district, use rich catalog fallback
  if (!results.length) {
    const rawList = CATALOG[category] || CATALOG.agriculture;
    results = rawList.map(item => ({
      ...item,
      location: district
    }));
  }
  
  if (!results.length) {
    session.state = 'CUSTOMER_MENU';
    return getText(session.language, 'no_results', { type: category, location: district });
  }

  session.data.searchResults = results;
  session.state = 'BOOKING_SELECT';
  
  const header = getText(session.language, 'search_results_header', { type: category.toUpperCase(), location: district });
  const cards = results.map((r, i) => getText(session.language, 'equipment_card', { 
    index: i + 1, model: r.model, price: r.price_per_day, location: r.district || r.location || district, rating: r.rating || 4.8 
  })).join('\n\n');
  
  return `${header}\n\n${cards}`;
}

module.exports = { handleCategorySelect, handleLocationInput };


