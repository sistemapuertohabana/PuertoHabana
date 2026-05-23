import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/personal — lista todo el personal activo (excepto admin)
export async function GET() {
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from('usuarios')
    .select('id, nombre, email, dni, rol, salario_monto, salario_tipo, telefono, turno, area, fecha_ingreso, foto_url')
    .neq('rol', 'admin')
    .eq('activo', true)
    .order('nombre');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/personal — crear empleado
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { nombre, email, dni, rol, salario_monto, salario_tipo, telefono, turno, area, fecha_ingreso, foto_url } = await request.json();
  if (!nombre || !rol) {
    return NextResponse.json({ error: 'nombre y rol son requeridos' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('usuarios')
    .insert([{
      nombre: nombre.trim(),
      email: email?.trim().toLowerCase() || null,
      dni: dni || null,
      rol,
      salario_monto: salario_monto || null,
      salario_tipo: salario_tipo || null,
      telefono: telefono || null,
      turno: turno || null,
      area: area || null,
      fecha_ingreso: fecha_ingreso || null,
      foto_url: foto_url || null,
      activo: true,
    }])
    .select('id, nombre, email, dni, rol, salario_monto, salario_tipo, telefono, turno, area, fecha_ingreso, foto_url')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
