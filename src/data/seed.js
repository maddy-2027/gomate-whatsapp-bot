require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL || 'http://mock', process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock');

const equipment = [
  { category: 'agriculture', type: 'Tractor', model: 'Mahindra 575 DI', district: 'Pune', price_per_day: 1500, rating: 4.8 },
  { category: 'agriculture', type: 'Tractor', model: 'John Deere 5310', district: 'Nashik', price_per_day: 1800, rating: 4.6 },
  { category: 'agriculture', type: 'Tractor', model: 'Sonalika DI 745', district: 'Kolhapur', price_per_day: 1600, rating: 4.5 },
  { category: 'agriculture', type: 'Harvester', model: 'Mahindra Arjun', district: 'Nagpur', price_per_day: 4000, rating: 4.9 },
  { category: 'agriculture', type: 'Rotavator', model: 'Shaktiman', district: 'Solapur', price_per_day: 800, rating: 4.2 },
  { category: 'agriculture', type: 'Cultivator', model: 'Fieldking', district: 'Satara', price_per_day: 600, rating: 4.4 },
  { category: 'transport', type: 'Truck', model: 'Tata LPT', district: 'Mumbai', price_per_day: 2500, rating: 4.5 },
  { category: 'transport', type: 'Dump Truck', model: 'Ashok Leyland 2518', district: 'Pune', price_per_day: 3500, rating: 4.7 },
  { category: 'transport', type: 'Mini Truck', model: 'Tata Ace', district: 'Nashik', price_per_day: 1200, rating: 4.3 },
  { category: 'transport', type: 'Tanker', model: 'BharatBenz', district: 'Aurangabad', price_per_day: 4000, rating: 4.6 },
  { category: 'transport', type: 'Delivery Van', model: 'Maruti Suzuki Eeco', district: 'Mumbai', price_per_day: 1000, rating: 4.1 },
  { category: 'transport', type: 'Truck', model: 'Mahindra Blazo', district: 'Nagpur', price_per_day: 3000, rating: 4.8 },
  { category: 'infrastructure', type: 'Excavator', model: 'JCB 3DX', district: 'Aurangabad', price_per_day: 5000, rating: 4.7 },
  { category: 'infrastructure', type: 'Excavator', model: 'Komatsu PC200', district: 'Pune', price_per_day: 6500, rating: 4.9 },
  { category: 'infrastructure', type: 'Bulldozer', model: 'CAT D6', district: 'Mumbai', price_per_day: 8000, rating: 4.8 },
  { category: 'infrastructure', type: 'Backhoe Loader', model: 'JCB 4DX', district: 'Nashik', price_per_day: 5500, rating: 4.6 },
  { category: 'infrastructure', type: 'Crane', model: 'Escorts TRX', district: 'Kolhapur', price_per_day: 7000, rating: 4.5 },
  { category: 'infrastructure', type: 'Bulldozer', model: 'BEML BD65', district: 'Solapur', price_per_day: 6000, rating: 4.4 }
];

async function seed() {
  console.log('Seeding data...');
  if (!process.env.SUPABASE_URL) {
     console.log('No Supabase URL. Using Mock Data.');
     return;
  }
  const { data, error } = await supabase.from('equipment').insert(equipment);
  if (error) {
     console.error('Error seeding data:', error);
  } else {
     console.log('Seed complete!');
  }
}

if (require.main === module) {
  seed();
}
module.exports = { seed };
