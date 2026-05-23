import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// POST /api/notificaciones/:id/leida
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;

  const { error } = await sb.from('notificaciones').update({ leida: 1 }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ success: true });
}
