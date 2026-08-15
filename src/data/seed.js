require('dotenv').config();
const supabase = require('../db/supabase');

const owners = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Rajesh Patil', phone: '+919822012345', district: 'Pune', subscription_status: 'active', language: 'mr' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Sanjay Deshmukh', phone: '+919822054321', district: 'Nashik', subscription_status: 'active', language: 'mr' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Amit Sharma', phone: '+919890011223', district: 'Nagpur', subscription_status: 'trial', language: 'hi' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Kisan Jadhav', phone: '+919822099887', district: 'Kolhapur', subscription_status: 'active', language: 'mr' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Vikram Shinde', phone: '+919822033445', district: 'Aurangabad', subscription_status: 'active', language: 'mr' }
];

const equipment = [
  // --- 🌾 Agriculture (8 Types) ---
  { owner_id: '11111111-1111-1111-1111-111111111111', category: 'agriculture', type: 'Tractor', model: 'Mahindra 575 DI (45 HP)', district: 'Pune', price_per_day: 1500, rating: 4.8, description: 'Fuel efficient, ideal for ploughing, rotavation, and haulage.' },
  { owner_id: '22222222-2222-2222-2222-222222222222', category: 'agriculture', type: 'Tractor', model: 'John Deere 5310 (55 HP 4WD)', district: 'Nashik', price_per_day: 1800, rating: 4.9, description: 'Heavy duty 4WD tractor suited for demanding field operations.' },
  { owner_id: '11111111-1111-1111-1111-111111111111', category: 'agriculture', type: 'Cultivator', model: 'Fieldking Heavy Duty 9-Tyne Cultivator', district: 'Satara', price_per_day: 600, rating: 4.5, description: 'Prepares seedbeds and aerates soil before sowing.' },
  { owner_id: '44444444-4444-4444-4444-444444444444', category: 'agriculture', type: 'Trailer', model: 'GoMate 4-Tonne Hydraulic Tipping Trailer', district: 'Kolhapur', price_per_day: 800, rating: 4.6, description: 'Dual-axle heavy trolley for sugarcane & grain transport.' },
  { owner_id: '44444444-4444-4444-4444-444444444444', category: 'agriculture', type: 'Seed Drill', model: 'National Automatic Seed & Fertilizer Drill', district: 'Solapur', price_per_day: 750, rating: 4.4, description: 'Multi-crop calibrated seed & fertilizer drill.' },
  { owner_id: '33333333-3333-3333-3333-333333333333', category: 'agriculture', type: 'Harvester', model: 'Claas Crop Tiger 30 Combine Harvester', district: 'Nagpur', price_per_day: 4200, rating: 4.9, description: 'High-speed wheat, soybean & paddy harvesting.' },
  { owner_id: '11111111-1111-1111-1111-111111111111', category: 'agriculture', type: 'Sprayer', model: 'ASPEE HTP 500L Tractor Mounted Sprayer', district: 'Sangli', price_per_day: 700, rating: 4.6, description: 'High-pressure orchard & vineyard pesticide spraying.' },
  { owner_id: '11111111-1111-1111-1111-111111111111', category: 'agriculture', type: 'Rotavator', model: 'Shaktiman Semi Champion 6-ft Rotavator', district: 'Pune', price_per_day: 850, rating: 4.7, description: 'Boron steel blades for fine seedbed preparation.' },
  { owner_id: '22222222-2222-2222-2222-222222222222', category: 'agriculture', type: 'Drone (spraying)', model: 'GoMate Agri-Hexacopter Spray Drone 10L', district: 'Nashik', price_per_day: 2500, rating: 4.9, description: 'Autonomous precision pesticide & nutrient crop spraying.' },

  // --- 🚚 Transport (5 Types) ---
  { owner_id: '11111111-1111-1111-1111-111111111111', category: 'transport', type: 'Trucks', model: 'Tata 407 LPT Medium Truck (4 Tonne)', district: 'Mumbai', price_per_day: 2600, rating: 4.6, description: 'Reliable inter-district agricultural & cargo haulage.' },
  { owner_id: '33333333-3333-3333-3333-333333333333', category: 'transport', type: 'Trucks', model: 'Mahindra Blazo X 28 Heavy Truck', district: 'Nagpur', price_per_day: 3500, rating: 4.8, description: 'Long-haul high capacity commercial freight truck.' },
  { owner_id: '11111111-1111-1111-1111-111111111111', category: 'transport', type: 'Dump Trucks', model: 'Ashok Leyland 2518 Multi-Axle Tipper', district: 'Pune', price_per_day: 4000, rating: 4.7, description: '16 Cu.M heavy body for sand, gravel, and earthworks.' },
  { owner_id: '11111111-1111-1111-1111-111111111111', category: 'transport', type: 'Vans', model: 'Maruti Suzuki Eeco Cargo Van', district: 'Mumbai', price_per_day: 1100, rating: 4.3, description: 'Compact urban & rural parcel/produce delivery.' },
  { owner_id: '22222222-2222-2222-2222-222222222222', category: 'transport', type: 'Delivery Trucks', model: 'Tata Ace Gold (Chhota Hathi) Mini Truck', district: 'Nashik', price_per_day: 1300, rating: 4.8, description: 'India\'s favorite mini truck for last-mile logistics.' },
  { owner_id: '44444444-4444-4444-4444-444444444444', category: 'transport', type: 'Delivery Trucks', model: 'Ashok Leyland Dost Plus Pickup', district: 'Kolhapur', price_per_day: 1600, rating: 4.7, description: '1.5 tonne payload for market produce delivery.' },
  { owner_id: '55555555-5555-5555-5555-555555555555', category: 'transport', type: 'Tanker Trucks', model: 'BharatBenz 1617 12KL Water/Liquid Tanker', district: 'Aurangabad', price_per_day: 4200, rating: 4.6, description: 'Insulated food-grade / irrigation water tanker truck.' },

  // --- 🏗️ Infrastructure (3 Types) ---
  { owner_id: '11111111-1111-1111-1111-111111111111', category: 'infrastructure', type: 'Excavators', model: 'Komatsu PC210-10M0 Hydraulic Excavator', district: 'Pune', price_per_day: 7500, rating: 4.9, description: '21-tonne heavy earthmover for quarrying, mining, and trenches.' },
  { owner_id: '55555555-5555-5555-5555-555555555555', category: 'infrastructure', type: 'Excavators', model: 'Tata Hitachi EX 200 Heavy Excavator', district: 'Aurangabad', price_per_day: 7000, rating: 4.8, description: 'Fast cycle times for roadwork and canal excavation.' },
  { owner_id: '11111111-1111-1111-1111-111111111111', category: 'infrastructure', type: 'Bulldozers', model: 'CAT D6 Heavy Crawler Dozer with Ripper', district: 'Mumbai', price_per_day: 8500, rating: 4.9, description: 'Precision land leveling, site preparation, and grading.' },
  { owner_id: '44444444-4444-4444-4444-444444444444', category: 'infrastructure', type: 'Bulldozers', model: 'BEML BD65 Crawler Bulldozer', district: 'Solapur', price_per_day: 6500, rating: 4.5, description: 'Rugged dozer for agricultural pond digging & earth clearing.' },
  { owner_id: '22222222-2222-2222-2222-222222222222', category: 'infrastructure', type: 'Backhoe Loaders', model: 'JCB 3DX Super EcoXcellence Backhoe Loader', district: 'Nashik', price_per_day: 4500, rating: 4.9, description: 'Versatile 4-in-1 loader bucket with heavy rear digger.' },
  { owner_id: '44444444-4444-4444-4444-444444444444', category: 'infrastructure', type: 'Backhoe Loaders', model: 'JCB 4DX Heavy Duty Backhoe Loader', district: 'Kolhapur', price_per_day: 5200, rating: 4.8, description: 'High payload loader with extended excavator reach.' }
];

async function seed() {
  console.log('Seeding GoMate data to Supabase...');
  if (!process.env.SUPABASE_URL) {
    console.log('No Supabase URL configured. Memory fallback active.');
    return;
  }
  try {
    // 1. Insert/Upsert owners
    const { data: ownerRes, error: ownerErr } = await supabase.from('owners').upsert(owners, { onConflict: 'id' });
    if (ownerErr) {
      console.error('Owner seed error:', ownerErr);
    } else {
      console.log('✅ Owners seeded successfully:', owners.length);
    }

    // 2. Insert/Upsert equipment
    const { data: equipRes, error: equipErr } = await supabase.from('equipment').upsert(equipment);
    if (equipErr) {
      console.error('Equipment seed error:', equipErr);
    } else {
      console.log('✅ Equipment seeded successfully: 16 canonical types & 22 machinery units!');
    }
  } catch (err) {
    console.error('Seed exception:', err);
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed, equipment, owners };
