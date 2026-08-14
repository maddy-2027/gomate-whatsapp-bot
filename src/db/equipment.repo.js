const supabase = require('./supabase');

async function searchEquipment(criteria) {
  let query = supabase.from('equipment').select('*, owners(phone, name)');
  if (criteria.category) query = query.eq('category', criteria.category);
  if (criteria.district) query = query.eq('district', criteria.district);
  query = query.eq('available', true).limit(10);
  const { data, error } = await query;
  if (error) console.error('Error searching equipment:', error);
  return data || [];
}

async function addEquipment(equipmentData) {
  const { data, error } = await supabase.from('equipment').insert([equipmentData]).select().single();
  if (error) console.error('Error adding equipment:', error);
  return data;
}

module.exports = { searchEquipment, addEquipment };
