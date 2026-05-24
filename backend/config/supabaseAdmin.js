const { createClient } = require('@supabase/supabase-js');

// This uses the service role key, which bypasses RLS and allows admin actions
// like creating users and sending verification emails without a client session.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { supabaseAdmin };
