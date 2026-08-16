const supabase = require('./supabase');
const { owners: defaultSeedOwners } = require('../data/seed');

let memoryOwners = [...defaultSeedOwners].map((owner, idx) => ({
  ...owner,
  created_at: new Date(Date.now() - 3600000 * 24 * (idx * 3 + 2)).toISOString(),
  subscription_expires_at: new Date(Date.now() + 3600000 * 24 * (30 - idx * 4)).toISOString(),
  equipment_count: idx === 0 ? 3 : (idx === 1 ? 2 : 1)
}));

async function registerOwner(data) {
  const newOwner = {
    phone: data.phone,
    name: data.name || 'Owner',
    district: data.district || 'Pune',
    language: data.language || 'mr',
    subscription_status: data.subscription_status || 'trial',
    subscription_expires_at: new Date(Date.now() + 7 * 24 * 3600000).toISOString()
  };

  try {
    const { data: owner, error } = await supabase
      .from('owners')
      .upsert([newOwner], { onConflict: 'phone' })
      .select()
      .single();
    if (!error && owner) {
      memoryOwners.unshift(owner);
      return owner;
    }
  } catch (err) {
    console.warn('Supabase registerOwner fallback:', err.message);
  }

  const fallback = { id: 'o-' + Date.now(), ...newOwner, created_at: new Date().toISOString() };
  memoryOwners.unshift(fallback);
  return fallback;
}

async function getOwnerByPhone(phone) {
  try {
    const { data, error } = await supabase.from('owners').select('*').eq('phone', phone).single();
    if (!error && data) return data;
  } catch (err) {
    // fallback
  }
  return memoryOwners.find(o => o.phone === phone) || null;
}

async function updateSubscription(phone, data) {
  const owner = memoryOwners.find(o => o.phone === phone);
  if (owner) {
    Object.assign(owner, data);
  }

  try {
    const { error } = await supabase.from('owners').update(data).eq('phone', phone);
    return !error;
  } catch (err) {
    return true;
  }
}

async function getAllOwners() {
  try {
    const { data, error } = await supabase.from('owners').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) return data;
  } catch (err) {
    // fallback
  }
  return memoryOwners;
}

async function getOwnerStats() {
  const all = await getAllOwners();
  const activeSubs = all.filter(o => o.subscription_status === 'active').length;
  const trialSubs = all.filter(o => o.subscription_status === 'trial').length;
  const expiredSubs = all.filter(o => o.subscription_status === 'expired').length;
  const monthlyRevenue = activeSubs * 599; // ₹599/mo per active owner

  return {
    totalOwners: all.length,
    activeSubs,
    trialSubs,
    expiredSubs,
    monthlyRevenue
  };
}

module.exports = {
  registerOwner,
  getOwnerByPhone,
  updateSubscription,
  getAllOwners,
  getOwnerStats
};
