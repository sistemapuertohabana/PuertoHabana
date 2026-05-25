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
      // El email ya existe — puede ser de un usuario eliminado (inactivo).
      // Buscar si hay un usuario inactivo con ese email para reactivarlo.
      const { data: existing } = await sb
        .from('usuarios')
        .select('id')
        .eq('email', email?.trim().toLowerCase())
        .eq('activo', false)
        .maybeSingle();

      if (existing) {
        // Reactivar y actualizar datos
        const { data: updated, error: updateError } = await sb
          .from('usuarios')
          .update({
            activo: true,
            nombre: nombre.trim(),
            dni: dni || null,
            rol,
            salario_monto: salario_monto || null,
            salario_tipo: salario_tipo || null,
            telefono: telefono || null,
            turno: turno || null,
            area: area || null,
            fecha_ingreso: fecha_ingreso || null,
            foto_url: foto_url || null,
          })
          .eq('id', existing.id)
          .select('id, nombre, email, dni, rol, salario_monto, salario_tipo, telefono, turno, area, fecha_ingreso, foto_url')
          .single();

        if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
        return NextResponse.json(updated, { status: 200 });
      }

      // Si no hay un usuario inactivo, entonces sí es un conflicto real
      return NextResponse.json({ error: 'Ya existe un usuario activo con ese email' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
