import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { checkAndNotifyLowStock } from '@/lib/push';

// GET /api/inventario/:seccion
export async function GET(
  _: Request,
  { params }: { params: Promise<{ seccion: string }> }
) {
  const { seccion } = await params;
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from('inventario')
    .select('id, seccion, nombre, categoria, tipo, precio, cantidad, unidad, minimo, codigo_barras, imagen_url, costo, tamanos')
    .eq('seccion', seccion)
    .order('nombre');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/inventario/:seccion  { id, delta: -1 }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ seccion: string }> }
) {
  const { seccion } = await params;
  const { id, delta } = await request.json();
  if (!id || delta === undefined) {
    return NextResponse.json({ error: 'id y delta requeridos' }, { status: 400 });
  }

  const sb = getServiceSupabase();

  // Fetch current quantity first
  const { data: item, error: fetchErr } = await sb
    .from('inventario')
    .select('cantidad')
    .eq('id', id)
    .eq('seccion', seccion)
    .single();

  if (fetchErr || !item) {
    return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
  }

  const newCantidad = Math.max(0, item.cantidad + delta);

  const { data, error } = await sb
    .from('inventario')
    .update({ cantidad: newCantidad })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Verificar si el stock quedó por debajo del mínimo
  if (delta < 0 && data) {
    checkAndNotifyLowStock({
      id: data.id,
      nombre: data.nombre,
      seccion: data.seccion,
      cantidad: data.cantidad,
      minimo: data.minimo,
      unidad: data.unidad,
    }).catch(() => {});
  }

  return NextResponse.json(data);
}
