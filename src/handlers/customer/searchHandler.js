const { getText } = require('../../services/language');

const CATALOG = {
  agriculture: [
    { id: 101, category: 'agriculture', type: 'Tractor', model: 'Mahindra 575 DI (45 HP)', price_per_day: 1500, rating: 4.8 },
    { id: 102, category: 'agriculture', type: 'Tractor', model: 'John Deere 5310 (55 HP 4WD)', price_per_day: 1800, rating: 4.9 },
    { id: 103, category: 'agriculture', type: 'Cultivator', model: 'Fieldking Heavy Duty Cultivator', price_per_day: 600, rating: 4.5 },
    { id: 104, category: 'agriculture', type: 'Trailer', model: 'GoMate 4-Tonne Tipping Trailer', price_per_day: 800, rating: 4.6 },
    { id: 105, category: 'agriculture', type: 'Seed Drill', model: 'National Automatic Seed Drill', price_per_day: 750, rating: 4.4 },
    { id: 106, category: 'agriculture', type: 'Harvester', model: 'Claas Crop Tiger 30 Harvester', price_per_day: 4200, rating: 4.9 },
    { id: 107, category: 'agriculture', type: 'Sprayer', model: 'ASPEE HTP 500L Tractor Sprayer', price_per_day: 700, rating: 4.6 },
    { id: 108, category: 'agriculture', type: 'Rotavator', model: 'Shaktiman Semi Champion Rotavator', price_per_day: 850, rating: 4.7 },
    { id: 109, category: 'agriculture', type: 'Drone (spraying)', model: 'GoMate Agri-Hexacopter Spray Drone 10L', price_per_day: 2500, rating: 4.9 }
  ],
  transport: [
    { id: 201, category: 'transport', type: 'Delivery Trucks', model: 'Tata Ace Gold (Chhota Hathi)', price_per_day: 1300, rating: 4.8 },
    { id: 202, category: 'transport', type: 'Delivery Trucks', model: 'Ashok Leyland Dost Plus Pickup', price_per_day: 1600, rating: 4.7 },
    { id: 203, category: 'transport', type: 'Trucks', model: 'Tata 407 LPT Medium Truck (4 Tonne)', price_per_day: 2600, rating: 4.6 },
    { id: 204, category: 'transport', type: 'Trucks', model: 'Mahindra Blazo X 28 Heavy Truck', price_per_day: 3500, rating: 4.8 },
    { id: 205, category: 'transport', type: 'Dump Trucks', model: 'Ashok Leyland 2518 Tipper (16 Cu.M)', price_per_day: 4000, rating: 4.7 },
    { id: 206, category: 'transport', type: 'Vans', model: 'Maruti Suzuki Eeco Cargo Van', price_per_day: 1100, rating: 4.3 },
    { id: 207, category: 'transport', type: 'Tanker Trucks', model: 'BharatBenz 1617 Water/Fuel Tanker', price_per_day: 4200, rating: 4.6 }
  ],
  infrastructure: [
    { id: 301, category: 'infrastructure', type: 'Backhoe Loaders', model: 'JCB 3DX Super Backhoe Loader', price_per_day: 4500, rating: 4.9 },
    { id: 302, category: 'infrastructure', type: 'Backhoe Loaders', model: 'JCB 4DX Heavy Duty Backhoe Loader', price_per_day: 5200, rating: 4.8 },
    { id: 303, category: 'infrastructure', type: 'Excavators', model: 'Komatsu PC210 Hydraulic Excavator', price_per_day: 7500, rating: 4.9 },
    { id: 304, category: 'infrastructure', type: 'Excavators', model: 'Tata Hitachi EX 200 Excavator', price_per_day: 7000, rating: 4.8 },
    { id: 305, category: 'infrastructure', type: 'Bulldozers', model: 'CAT D6 Heavy Crawler Dozer', price_per_day: 8500, rating: 4.9 },
    { id: 306, category: 'infrastructure', type: 'Bulldozers', model: 'BEML BD65 Crawler Bulldozer', price_per_day: 6500, rating: 4.5 }
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

// Known Maharashtra district coordinates for distance calculation
const DISTRICT_COORDS = {
  pune: { lat: 18.5204, lng: 73.8567, name: 'Pune' },
  nashik: { lat: 19.9975, lng: 73.7898, name: 'Nashik' },
  satara: { lat: 17.6805, lng: 73.9926, name: 'Satara' },
  sangli: { lat: 16.8524, lng: 74.5815, name: 'Sangli' },
  kolhapur: { lat: 16.7050, lng: 74.2433, name: 'Kolhapur' },
  solapur: { lat: 17.6599, lng: 75.9064, name: 'Solapur' },
  nagpur: { lat: 21.1458, lng: 79.0882, name: 'Nagpur' },
  aurangabad: { lat: 19.8762, lng: 75.3433, name: 'Aurangabad' },
  mumbai: { lat: 19.0760, lng: 72.8777, name: 'Mumbai' }
};

// Haversine formula to compute km distance between two GPS coordinates
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return Math.round(R * c);
}

function findNearestDistrict(userLat, userLng) {
  let nearest = 'Pune';
  let minDistance = Infinity;

  for (const [key, val] of Object.entries(DISTRICT_COORDS)) {
    const dist = getDistanceFromLatLonInKm(userLat, userLng, val.lat, val.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = val.name;
    }
  }
  return { nearestDistrict: nearest, distanceKm: minDistance };
}

async function handleLocationInput(phone, text, session) {
  let district = text.trim();
  let distanceNote = '';

  // Check if user sent a GPS coordinate (e.g. "GPS_LOCATION:18.5204,73.8567")
  if (text.startsWith('GPS_LOCATION:')) {
    const coords = text.replace('GPS_LOCATION:', '').split(',');
    const userLat = parseFloat(coords[0]);
    const userLng = parseFloat(coords[1]);

    if (!isNaN(userLat) && !isNaN(userLng)) {
      const match = findNearestDistrict(userLat, userLng);
      district = match.nearestDistrict;
      distanceNote = ` (~${match.distanceKm} km away)`;
      console.log(`📍 GPS Pin matched to nearest hub: ${district} (${match.distanceKm} km)`);
    }
  }

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
  
  const displayLocation = `${district}${distanceNote}`;
  const header = getText(session.language, 'search_results_header', { type: category.toUpperCase(), location: displayLocation });
  const cards = results.map((r, i) => getText(session.language, 'equipment_card', { 
    index: i + 1, 
    model: r.model, 
    price: r.price_per_day, 
    location: `${r.district || r.location || district}${distanceNote ? ' (Nearby)' : ''}`, 
    rating: r.rating || 4.8 
  })).join('\n\n');
  
  const footer = getText(session.language, 'results_footer');
  return `${header}\n\n${cards}\n\n${footer}`;
}

module.exports = { handleCategorySelect, handleLocationInput, CATALOG };
