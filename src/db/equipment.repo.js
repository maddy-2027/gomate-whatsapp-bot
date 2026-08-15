const supabase = require('./supabase');
const { equipment: defaultSeedEquipment } = require('../data/seed');

let memoryEquipment = [...defaultSeedEquipment].map((item, idx) => ({
  id: item.id || (100 + idx + 1),
  ...item,
  available: item.available !== false,
  created_at: new Date(Date.now() - 3600000 * 24 * (idx + 1)).toISOString()
}));

async function searchEquipment(criteria) {
  try {
    let query = supabase.from('equipment').select('*, owners(phone, name)');
    if (criteria.category) query = query.eq('category', criteria.category);
    if (criteria.district) query = query.ilike('district', `%${criteria.district}%`);
    query = query.eq('available', true).limit(10);
    const { data, error } = await query;
    if (!error && data && data.length > 0) return data;
  } catch (err) {
    // fallback to memory
  }

  return memoryEquipment.filter(item => {
    let match = true;
    if (criteria.category && item.category !== criteria.category) match = false;
    if (criteria.district && item.district && !item.district.toLowerCase().includes(criteria.district.toLowerCase())) match = false;
    return match;
  });
}

async function addEquipment(equipmentData) {
  const newEquip = {
    id: equipmentData.id || String(Date.now()),
    ...equipmentData,
    created_at: new Date().toISOString(),
    available: true
  };
  memoryEquipment.unshift(newEquip);

  try {
    const { data, error } = await supabase.from('equipment').insert([newEquip]).select().single();
    if (!error && data) return data;
  } catch (err) {
    console.error('Error adding equipment to Supabase:', err);
  }
  return newEquip;
}

async function getAllEquipment() {
  try {
    const { data, error } = await supabase.from('equipment').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) return data;
  } catch (err) {
    // fallback
  }
  return memoryEquipment;
}

async function getEquipmentByOwner(ownerIdOrPhone) {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .or(`owner_id.eq.${ownerIdOrPhone},district.ilike.%${ownerIdOrPhone}%`)
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) return data;
  } catch (err) {
    // fallback
  }
  return memoryEquipment.filter(e => e.owner_id === ownerIdOrPhone || e.owner_phone === ownerIdOrPhone);
}

async function toggleEquipmentAvailability(id, isAvailable) {
  const item = memoryEquipment.find(e => String(e.id) === String(id));
  if (item) {
    item.available = isAvailable;
  }

  try {
    const { error } = await supabase
      .from('equipment')
      .update({ available: isAvailable })
      .eq('id', id);
    return !error;
  } catch (err) {
    return true;
  }
}

async function getEquipmentStats() {
  const all = await getAllEquipment();
  return {
    total: all.length,
    agriculture: all.filter(e => e.category === 'agriculture').length,
    transport: all.filter(e => e.category === 'transport').length,
    infrastructure: all.filter(e => e.category === 'infrastructure').length,
    available: all.filter(e => e.available !== false).length
  };
}

module.exports = {
  searchEquipment,
  addEquipment,
  getAllEquipment,
  getEquipmentByOwner,
  toggleEquipmentAvailability,
  getEquipmentStats
};
