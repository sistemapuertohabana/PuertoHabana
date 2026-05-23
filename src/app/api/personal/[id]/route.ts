import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// PUT /api/personal/:id
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;
  const body = await request.json();
  
  // Construir objeto de actualización solo con los campos enviados
  const updateData: any = {};
  if (body.nombre !== undefined) updateData.nombre = body.nombre;
  if (body.email !== undefined) updateData.email = body.email?.trim().toLowerCase() || null;
  if (body.dni !== undefined) updateData.dni = body.dni || null;
  if (body.rol !== undefined) updateData.rol = body.rol;
  if (body.salario_monto !== undefined) updateData.salario_monto = body.salario_monto || null;
  if (body.salario_tipo !== undefined) updateData.salario_tipo = body.salario_tipo || null;
  if (body.telefono !== undefined) updateData.telefono = body.telefono || null;
  if (body.turno !== undefined) updateData.turno = body.turno || null;
  if (body.area !== undefined) updateData.area = body.area || null;
  if (body.fecha_ingreso !== undefined) updateData.fecha_ingreso = body.fecha_ingreso || null;
  if (body.foto_url !== undefined) updateData.foto_url = body.foto_url || null;

  const { error } = await sb
    .from('usuarios')
    .update(updateData)
    .eq('id', id);

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
