const supabase = require('./supabase');

const memoryUsers = new Map();

async function upsertUser(data) {
  const { phone } = data;
  if (!phone) return null;

  const existing = memoryUsers.get(phone) || {};
  const updated = { 
    ...existing, 
    ...data, 
    last_active_at: new Date().toISOString() 
  };
  memoryUsers.set(phone, updated);

  try {
    const { data: user, error } = await supabase
      .from('users')
      .upsert([{
        phone: updated.phone,
        name: updated.name || existing.name || 'User',
        role: updated.role || existing.role || 'customer',
        language: updated.language || existing.language || 'mr',
        last_active_at: new Date().toISOString()
      }], { onConflict: 'phone' })
      .select()
      .single();
    if (!error && user) {
      memoryUsers.set(phone, user);
      return user;
    }
  } catch (err) {
    console.warn('Supabase upsertUser fallback:', err.message);
  }
  return updated;
}

async function getUser(phone) {
  if (!phone) return null;
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
    if (!error && user) {
      memoryUsers.set(phone, user);
      return user;
    }
  } catch (err) {
    // fallback to cache
  }

  return memoryUsers.get(phone) || null;
}

async function getAllUsers() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('last_active_at', { ascending: false });
    if (!error && users && users.length > 0) {
      return users;
    }
  } catch (err) {
    // fallback
  }
  return Array.from(memoryUsers.values());
}

module.exports = { upsertUser, getUser, getAllUsers };
