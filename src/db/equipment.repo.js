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
    if (criteria.taluka) {
      query = query.ilike('taluka', `%${criteria.taluka}%`);
    } else if (criteria.district) {
      query = query.or(`taluka.ilike.%${criteria.district}%,district.ilike.%${criteria.district}%`);
    }
    query = query.eq('available', true).limit(10);
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map(d => ({
        ...d,
        services: d.description || d.services || 'All Attachments'
      }));
    }
  } catch (err) {
    // fallback to memory
  }

  return memoryEquipment.filter(item => {
    let match = true;
    if (criteria.category && item.category !== criteria.category) match = false;
    return match;
  });
}

async function addEquipment(equipmentData) {
  let img = '/assets/equipment/agri_tractor_3d.jpg';
  if (equipmentData.category === 'transport') {
    img = '/assets/equipment/heavy_drone_3d.jpg';
  } else if (equipmentData.category === 'infrastructure') {
    img = '/assets/equipment/infra_jcb_3d.jpg';
  }

  const dbRecord = {
    owner_id: equipmentData.owner_id || null,
    category: equipmentData.category || 'agriculture',
    type: equipmentData.type || equipmentData.equipment_type || 'Machinery',
    model: equipmentData.model || equipmentData.name || 'Equipment',
    district: equipmentData.district || 'Sangli',
    taluka: equipmentData.taluka || 'Jath',
    price_per_day: Number(equipmentData.price_per_day || equipmentData.daily_rate || 1500),
    available: true,
    rating: 5.0,
    description: equipmentData.services || equipmentData.description || 'All Attachments'
  };

  const itemToStore = {
    ...dbRecord,
    owner_phone: equipmentData.owner_phone || null,
    owner_name: equipmentData.owner_name || null,
    village: equipmentData.village || equipmentData.district || 'Jath',
    image_url: equipmentData.image_url || img,
    services: dbRecord.description
  };

  try {
    const { data, error } = await supabase.from('equipment').insert([dbRecord]).select().single();
    if (!error && data) {
      const formatted = { ...itemToStore, ...data, services: data.description || itemToStore.services };
      memoryEquipment.unshift(formatted);
      return formatted;
    }
  } catch (err) {
    console.warn('Supabase addEquipment fallback:', err.message);
  }

  const fallback = { id: String(Date.now()), ...itemToStore, created_at: new Date().toISOString() };
  memoryEquipment.unshift(fallback);
  return fallback;
}

async function getAllEquipment() {
  try {
    const { data, error } = await supabase.from('equipment').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      return data.map(d => ({
        ...d,
        services: d.description || d.services || 'All Attachments'
      }));
    }
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
