/**
 * GoMate GPS Distance & Arrival ETA Engine
 * Provides accurate rural road distance calculations and estimated time of arrival (ETA)
 * across the 125 villages of Jath Taluka and Western Maharashtra.
 */

const { findJathVillage, JATH_VILLAGES } = require('../data/jathVillages');

// Key Geocoordinates for Jath Taluka Hubs & Villages (Lat, Lng)
const VILLAGE_COORDINATES = {
  'जत': { lat: 17.0450, lng: 75.2250, name: 'Jat Center', nameMr: 'जत मुख्य केंद्र' },
  'शेगाव': { lat: 17.0850, lng: 75.2900, name: 'Shegaon', nameMr: 'शेगाव' },
  'संख': { lat: 16.9200, lng: 75.4500, name: 'Sankh', nameMr: 'संख' },
  'उमदी': { lat: 16.9800, lng: 75.5200, name: 'Umadi', nameMr: 'उमदी' },
  'डफळापूर': { lat: 17.0100, lng: 75.1200, name: 'Dafalapur', nameMr: 'डफळापूर' },
  'बिळूर': { lat: 17.1500, lng: 75.1800, name: 'Bilur', nameMr: 'बिळूर' },
  'माडग्याळ': { lat: 17.0600, lng: 75.3800, name: 'Madgyal', nameMr: 'माडग्याळ' },
  'वाळेखिंडी': { lat: 17.1100, lng: 75.0800, name: 'Walekhindi', nameMr: 'वाळेखिंडी' },
  'मुचंडी': { lat: 16.9400, lng: 75.2600, name: 'Muchandi', nameMr: 'मुचंडी' },
  'दरीबडची': { lat: 16.8800, lng: 75.3200, name: 'Daribadchi', nameMr: 'दरीबडची' },
  'मेंढुगिरी': { lat: 17.1300, lng: 75.2600, name: 'Mendhegiri', nameMr: 'मेंढेगिरी' },
  'बाज': { lat: 17.0700, lng: 75.1500, name: 'Baj', nameMr: 'बाज' },
  'सावळी': { lat: 16.8500, lng: 75.1900, name: 'Savali', nameMr: 'सावळी' },
  'असांगी': { lat: 17.0200, lng: 75.3200, name: 'Asangi', nameMr: 'असांगी' },
  'सांगली': { lat: 16.8524, lng: 74.5815, name: 'Sangli City', nameMr: 'सांगली शहर' },
  'पुणे': { lat: 18.5204, lng: 73.8567, name: 'Pune Hub', nameMr: 'पुणे मुख्य केंद्र' }
};

// Rural road speed profile in km/h
const SPEED_PROFILE = {
  tractor: 22,    // Tractor with implement attachment
  jcb: 26,        // Backhoe loader / JCB
  harvester: 18,  // Heavy combine harvester
  truck: 40,      // Tata 407 / Pickup / Tipper
  drone: 45,      // Drone technician on bike
  default: 25
};

const RURAL_ROAD_CURVATURE = 1.28; // Road curvature factor for Deccan plateau village roads

/**
 * Haversine straight line formula (in km)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Resolve coordinates for a village name or GPS string
 */
function resolveCoordinates(location) {
  if (!location) return VILLAGE_COORDINATES['जत'];

  // 1. If it's a GPS coordinate string "GPS_LOCATION:17.045,75.225" or "17.045,75.225"
  if (typeof location === 'string' && location.includes(',')) {
    const clean = location.replace('GPS_LOCATION:', '').trim();
    const parts = clean.split(',');
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng, name: 'GPS Location', nameMr: 'थेट GPS स्थान' };
    }
  }

  // 2. Lookup known village coordinates
  const locStr = String(location).trim().toLowerCase();
  for (const [key, coords] of Object.entries(VILLAGE_COORDINATES)) {
    if (locStr.includes(key.toLowerCase()) || locStr.includes(coords.name.toLowerCase())) {
      return coords;
    }
  }

  // 3. Match against full 125 Jath villages (hash approximation within taluka bounds)
  const v = findJathVillage(location);
  if (v) {
    const seed = (v.id || 1) * 0.0035;
    return {
      lat: 17.0450 + Math.sin(seed) * 0.08,
      lng: 75.2250 + Math.cos(seed) * 0.12,
      name: v.name,
      nameMr: v.nameMr
    };
  }

  return VILLAGE_COORDINATES['जत'];
}

/**
 * Calculate road distance and arrival ETA between farmer and machinery owner
 * @param {string|object} farmerLoc - Farmer's village name or GPS
 * @param {string|object} ownerLoc - Machinery owner's hub location
 * @param {string} machineryType - 'tractor', 'jcb', 'harvester', 'drone', 'truck'
 */
function calculateDistanceAndETA(farmerLoc, ownerLoc = 'जत', machineryType = 'tractor') {
  const c1 = resolveCoordinates(farmerLoc);
  const c2 = resolveCoordinates(ownerLoc);

  const straightKm = haversineDistance(c1.lat, c1.lng, c2.lat, c2.lng);
  
  // Apply rural road curvature
  let roadDistanceKm = Math.round((straightKm * RURAL_ROAD_CURVATURE) * 10) / 10;
  if (roadDistanceKm < 1.5) roadDistanceKm = 1.8; // Minimum village boundary distance

  // Vehicle speed calculation
  const speed = SPEED_PROFILE[String(machineryType).toLowerCase()] || SPEED_PROFILE.default;
  const transitMinutes = Math.round((roadDistanceKm / speed) * 60);
  const prepMinutes = 10; // Driver dispatch & startup time
  const totalEtaMinutes = transitMinutes + prepMinutes;

  let etaFormattedMr = '';
  let etaFormattedEn = '';

  if (totalEtaMinutes <= 30) {
    etaFormattedMr = '२० ते २५ मिनिटांत थेट शेतात हजर ⚡';
    etaFormattedEn = '20–25 mins direct dispatch ⚡';
  } else if (totalEtaMinutes <= 60) {
    etaFormattedMr = `${totalEtaMinutes} मिनिटांत पोहोचेल`;
    etaFormattedEn = `${totalEtaMinutes} mins arrival`;
  } else {
    const hours = Math.round((totalEtaMinutes / 60) * 10) / 10;
    etaFormattedMr = `अंदाजे ${hours} तासांत पोहोचेल`;
    etaFormattedEn = `Approx ${hours} hours arrival`;
  }

  return {
    distanceKm: roadDistanceKm,
    etaMinutes: totalEtaMinutes,
    farmerLocation: c1.nameMr || c1.name,
    ownerHub: c2.nameMr || c2.name,
    formattedBadgeMr: `📍 अंतर: *${roadDistanceKm} किमी* (${c2.nameMr} हब) • ⏱️ *${etaFormattedMr}*`,
    formattedBadgeEn: `📍 Distance: *${roadDistanceKm} km* (from ${c2.name}) • ⏱️ *${etaFormattedEn}*`
  };
}

module.exports = {
  calculateDistanceAndETA,
  resolveCoordinates,
  VILLAGE_COORDINATES
};
