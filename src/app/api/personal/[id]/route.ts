import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// PUT /api/personal/:id
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;
  const { nombre, email, dni, rol, salario_monto, salario_tipo, telefono, turno, area, fecha_ingreso, foto_url } = await request.json();

  const { error } = await sb
    .from('usuarios')
    .update({
      nombre,
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
    })
    .eq('id', id)
    .neq('rol', 'admin');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/personal/:id — soft delete
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;

  const { error } = await sb
    .from('usuarios')
    .update({ activo: false })
    .eq('id', id)
    .neq('rol', 'admin');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
