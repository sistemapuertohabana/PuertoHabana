import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { nombre, email } = await request.json();

  if (!nombre || !email) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }

  // Insertar o actualizar admin (usando upsert en base al email)
  const { data, error } = await sb
    .from('usuarios')
    .upsert({
      nombre,
      email: email.trim().toLowerCase(),
      rol: 'admin',
      activo: true
    }, { onConflict: 'email' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, user: data });
}
