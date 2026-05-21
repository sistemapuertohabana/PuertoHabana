require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Fetching profiles...");
  const { data, error } = await supabase.from('profiles').select('*');
  console.log("Data:", data);
  console.log("Error:", error);
}

run();
