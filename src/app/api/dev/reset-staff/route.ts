import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST() {
  const sb = getServiceSupabase();
  
  // Borrar todos los usuarios que no sean admin
  const { error } = await sb.from('usuarios').delete().neq('rol', 'admin');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: 'Todo el personal (excepto admin) ha sido borrado.' });
}
