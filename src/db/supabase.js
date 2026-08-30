process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

let rawUrl = process.env.SUPABASE_URL || '';
if (rawUrl.endsWith('/rest/v1/')) rawUrl = rawUrl.replace('/rest/v1/', '');
if (rawUrl.endsWith('/rest/v1')) rawUrl = rawUrl.replace('/rest/v1', '');
if (rawUrl.endsWith('/')) rawUrl = rawUrl.slice(0, -1);

const supabaseUrl = rawUrl;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;


let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  } catch (err) {
    console.warn('⚠️ Supabase init error, falling back to mock:', err.message);
  }
}

if (!supabase) {
  console.warn('⚠️ Supabase credentials not found or failed to initialize. Using mock database.');
  supabase = {
    from: (table) => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), order: async () => ({ data: [], error: null }) }) }),
      insert: () => ({ select: () => ({ single: async () => ({ data: { id: 1 }, error: null }) }) }),
      update: () => ({ eq: async () => ({ data: null, error: null }) }),
      upsert: () => ({ select: () => ({ single: async () => ({ data: { id: 1 }, error: null }) }) })
    })
  };
}

module.exports = supabase;
