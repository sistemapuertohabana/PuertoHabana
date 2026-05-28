const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  if (line.includes('=')) {
    const [k, v] = line.split('=');
    acc[k.trim()] = v.trim();
  }
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await sb.from('inventario').insert({ seccion: 'bebidas', nombre: 'Test Float', precio: 10, cantidad: 1.5, unidad: 'litro' }).select();
  console.log('Insert float test:', error ? error.message : data);
  if (!error && data) {
    await sb.from('inventario').delete().eq('id', data[0].id);
  }
}
run();
