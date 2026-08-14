const supabase = require('./supabase');

async function registerOwner(data) {
  const { data: owner, error } = await supabase.from('owners').insert([data]).select().single();
  return owner;
}

async function getOwnerByPhone(phone) {
  const { data, error } = await supabase.from('owners').select('*').eq('phone', phone).single();
  return data;
}

async function updateSubscription(phone, data) {
  const { error } = await supabase.from('owners').update(data).eq('phone', phone);
  return !error;
}

module.exports = { registerOwner, getOwnerByPhone, updateSubscription };
