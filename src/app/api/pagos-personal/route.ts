import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const nombre = searchParams.get('nombre');

  let query = sb.from('pagos_personal').select('*').order('created_at', { ascending: false });
  if (nombre) {
    query = query.ilike('nombre', `%${nombre}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
