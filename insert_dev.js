require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('usuarios').insert([
    {
      nombre: 'STEV LOZANO BY CODEOL SOFTWARE PERÚ',
      rol: 'dev',
      salario_monto: 0,
      salario_tipo: 'Mensual'
    }
  ]);
  console.log(error || 'Dev inserted');
}
run();
