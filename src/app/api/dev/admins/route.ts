import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from('usuarios')
    .select('id, nombre, email, activo')
    .eq('rol', 'admin')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
