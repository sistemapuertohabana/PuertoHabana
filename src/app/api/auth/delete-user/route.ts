import { createClient } from '@/lib/supabase/client';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
  }
  const supabase = createClient();
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
