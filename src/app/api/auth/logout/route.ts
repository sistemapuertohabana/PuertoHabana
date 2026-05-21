import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Error al cerrar sesión' }, { status: 500 });
  }
}
