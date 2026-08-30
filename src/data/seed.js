require('dotenv').config();
const supabase = require('../db/supabase');

const owners = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Rajesh Patil (राजेश पाटील)', phone: '+919822012345', district: 'Jat Center (जत, सांगली)', subscription_status: 'active', language: 'mr' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Sanjay Deshmukh (संजय देशमुख)', phone: '+919822054321', district: 'Umadi (उमदी, जत)', subscription_status: 'active', language: 'mr' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Vitthal Birajdar (विठ्ठल बिराजदार)', phone: '+919890011223', district: 'Sankh (संख, जत)', subscription_status: 'active', language: 'mr' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Tanaji Pawar (तानाजी पवार)', phone: '+919822099887', district: 'Dafalapur (डफळापूर, जत)', subscription_status: 'active', language: 'mr' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Prakash Kolekar (प्रकाश कोळेकर)', phone: '+919822033445', district: 'Bilur (बिळूर, जत)', subscription_status: 'active', language: 'mr' },
  { id: '66666666-6666-6666-6666-666666666666', name: 'Ananda Sawant (आनंदा सावंत)', phone: '+919822077665', district: 'Shegaon (शेगाव, जत)', subscription_status: 'active', language: 'mr' }
];

const equipment = [
  // --- 🌾 Agriculture in Jath Taluka (PIN: 416404) ---
  { owner_id: '11111111-1111-1111-1111-111111111111', category: 'agriculture', type: 'Tractor', model: 'Mahindra 575 DI (45 HP)', district: 'Sangli', taluka: 'Jath', price_per_hour: 750, price_per_day: 1500, rating: 4.9, description: 'जत व आसपासच्या गावांत नांगरट, रोटाव्हेटर व पेरणीसाठी उपलब्ध.' },
  { owner_id: '22222222-2222-2222-2222-222222222222', category: 'agriculture', type: 'Tractor', model: 'John Deere 5310 (55 HP 4WD)', district: 'Sangli', taluka: 'Jath', price_per_hour: 850, price_per_day: 1800, rating: 4.9, description: 'उमदी, जाद्राबोबलाद, संख परिसरात अवजड कामांसाठी 4WD ट्रॅक्टर.' },
  { owner_id: '33333333-3333-3333-3333-333333333333', category: 'agriculture', type: 'Tractor', model: 'Swaraj 744 FE (48 HP)', district: 'Sangli', taluka: 'Jath', price_per_hour: 800, price_per_day: 1600, rating: 4.8, description: 'संख, दरीबडची, उमराणी भागात 1 तासात पोहोच.' },
  { owner_id: '44444444-4444-4444-4444-444444444444', category: 'agriculture', type: 'Tractor', model: 'Massey Ferguson 241 DI Dynatrack', district: 'Sangli', taluka: 'Jath', price_per_hour: 750, price_per_day: 1550, rating: 4.7, description: 'डफळापूर, वाळेखिंडी, बाज परिसरात त्वरित डिलिव्हरी.' },
  { owner_id: '11111111-1111-1111-1111-111111111111', category: 'agriculture', type: 'Rotavator', model: 'Shaktiman Semi Champion 6-ft Rotavator', district: 'Sangli', taluka: 'Jath', price_per_hour: 800, price_per_day: 850, rating: 4.8, description: 'जमीन भुसभुशीत करण्यासाठी उत्तम रोटाव्हेटर.' },
  { owner_id: '22222222-2222-2222-2222-222222222222', category: 'agriculture', type: 'Harvester', model: 'Claas Crop Tiger 30 Combine Harvester', district: 'Sangli', taluka: 'Jath', price_per_hour: 2200, price_per_day: 4200, rating: 4.9, description: 'गहू, हरभरा, बाजरी व मका काढणीसाठी वेगवान हार्वेस्टर.' },
  { owner_id: '44444444-4444-4444-4444-444444444444', category: 'agriculture', type: 'Sprayer', model: 'ASPEE HTP 500L Tractor Mounted Sprayer', district: 'Sangli', taluka: 'Jath', price_per_hour: 500, price_per_day: 700, rating: 4.7, description: 'डाळिंब, द्राक्ष व बागायत पिकांसाठी हाय-प्रेशर फवारणी.' },
  { owner_id: '66666666-6666-6666-6666-666666666666', category: 'agriculture', type: 'Drone (spraying)', model: 'GoMate Agri-Hexacopter Spray Drone 10L', district: 'Sangli', taluka: 'Jath', price_per_hour: 450, price_per_day: 2500, rating: 4.9, description: 'जत तालुक्यातील शेतांत अचूक व जलद औषध फवारणी ड्रोन.' },
  { owner_id: '55555555-5555-5555-5555-555555555555', category: 'agriculture', type: 'Trailer', model: 'GoMate 4-Tonne Hydraulic Tipping Trailer', district: 'Sangli', taluka: 'Jath', price_per_hour: 600, price_per_day: 800, rating: 4.6, description: 'धान्य, ऊस व शेतमाल वाहतुकीसाठी हायड्रॉलिक ट्रॉली.' },

  // --- 🚚 Transport in Jath Taluka ---
  { owner_id: '22222222-2222-2222-2222-222222222222', category: 'transport', type: 'Delivery Trucks', model: 'Tata Ace Gold (छोटा हत्ती)', district: 'Sangli', taluka: 'Jath', price_per_hour: 400, price_per_day: 1300, rating: 4.8, description: 'जत तालुक्यातील कोणत्याही गावात शेतमाल वाहतूक.' },
  { owner_id: '33333333-3333-3333-3333-333333333333', category: 'transport', type: 'Delivery Trucks', model: 'Ashok Leyland Dost Plus Pickup', district: 'Sangli', taluka: 'Jath', price_per_hour: 500, price_per_day: 1600, rating: 4.8, description: '1.5 टन क्षमता, बाजार समिती व शेतातून जलद डिलिव्हरी.' },
  { owner_id: '11111111-1111-1111-1111-111111111111', category: 'transport', type: 'Trucks', model: 'Tata 407 LPT Medium Truck (4 Tonne)', district: 'Sangli', taluka: 'Jath', price_per_hour: 750, price_per_day: 2600, rating: 4.7, description: 'सांगली/सांगोला/विजापूर मार्केटसाठी अवजड शेतमाल ट्रक.' },
  { owner_id: '66666666-6666-6666-6666-666666666666', category: 'transport', type: 'Tanker Trucks', model: 'BharatBenz 12KL Water Tanker', district: 'Sangli', taluka: 'Jath', price_per_hour: 1200, price_per_day: 3800, rating: 4.8, description: 'जत तालुक्यातील शेती व बागांसाठी पाणी पुरवठा टँकर.' },
  { owner_id: '44444444-4444-4444-4444-444444444444', category: 'transport', type: 'Dump Trucks', model: 'Ashok Leyland Tipper (डंपर)', district: 'Sangli', taluka: 'Jath', price_per_hour: 1400, price_per_day: 4000, rating: 4.7, description: 'माती, मुरूम व खडी वाहतुकीसाठी डंपर.' },

  // --- 🏗️ Infrastructure / Earthmoving in Jath Taluka ---
  { owner_id: '11111111-1111-1111-1111-111111111111', category: 'infrastructure', type: 'Backhoe Loaders', model: 'JCB 3DX Super EcoXcellence', district: 'Sangli', taluka: 'Jath', price_per_hour: 1100, price_per_day: 4500, rating: 4.9, description: 'शेततळे खोदणे, चर काढणे, जमीन सपाटीकरण व बांधकाम.' },
  { owner_id: '55555555-5555-5555-5555-555555555555', category: 'infrastructure', type: 'Backhoe Loaders', model: 'JCB 4DX Heavy Duty Loader', district: 'Sangli', taluka: 'Jath', price_per_hour: 1300, price_per_day: 5200, rating: 4.8, description: 'बिळूर, शेगाव, मुचंडी परिसरात अवजड खोदकामासाठी JCB.' },
  { owner_id: '55555555-5555-5555-5555-555555555555', category: 'infrastructure', type: 'Excavators', model: 'Komatsu PC210 Heavy Excavator (पोकलेन)', district: 'Sangli', taluka: 'Jath', price_per_hour: 1800, price_per_day: 7500, rating: 4.9, description: 'मोठे शेततळे, विहीर खोदकाम व दगड फोडणे (Breaker सह).' },
  { owner_id: '33333333-3333-3333-3333-333333333333', category: 'infrastructure', type: 'Bulldozers', model: 'CAT D6 Crawler Dozer (बुलडोझर)', district: 'Sangli', taluka: 'Jath', price_per_hour: 2000, price_per_day: 8000, rating: 4.9, description: 'डोंगर/माळरान साफ करणे, जमीन सपाटीकरण व बांध घालणे.' }
];

async function seed() {
  console.log('🌾 Seeding GoMate Jath Taluka (416404) Pilot Data to Supabase...');
  if (!process.env.SUPABASE_URL) {
    console.log('No Supabase URL configured. Memory fallback active.');
    return;
  }
  try {
    // 1. Insert/Upsert Jath local owners
    const { data: ownerRes, error: ownerErr } = await supabase.from('owners').upsert(owners, { onConflict: 'id' });
    if (ownerErr) {
      console.error('Owner seed error:', ownerErr);
    } else {
      console.log('✅ Jath Local Owners seeded successfully:', owners.length);
    }

    // 2. Insert/Upsert Jath pilot machinery
    const { data: equipRes, error: equipErr } = await supabase.from('equipment').upsert(equipment);
    if (equipErr) {
      console.error('Equipment seed error:', equipErr);
    } else {
      console.log('✅ Jath Pilot Equipment seeded successfully: ' + equipment.length + ' machinery units in Jath!');
    }
  } catch (err) {
    console.error('Seed exception:', err);
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed, equipment, owners };

