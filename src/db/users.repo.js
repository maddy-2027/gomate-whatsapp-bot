const supabase = require('./supabase');

const memoryUsers = new Map();

async function upsertUser(data) {
  const { phone } = data;
  if (!process.env.SUPABASE_URL) {
    const existing = memoryUsers.get(phone) || {};
    const updated = { ...existing, ...data, updated_at: new Date() };
    memoryUsers.set(phone, updated);
    return updated;
  }

  const { data: user, error } = await supabase
    .from('users')
    .upsert([data], { onConflict: 'phone' })
    .select()
    .single();
  return user;
}

async function getUser(phone) {
  if (!process.env.SUPABASE_URL) {
    return memoryUsers.get(phone) || null;
  }
  const { data } = await supabase.from('users').select('*').eq('phone', phone).single();
  return data;
}

module.exports = { upsertUser, getUser };
