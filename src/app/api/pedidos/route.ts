import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/pedidos?fecha=YYYY-MM-DD&estado=Pendiente
export async function GET(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const fecha  = searchParams.get('fecha');
  const estado = searchParams.get('estado');

  let query = sb
    .from('comandas')
    .select('id, mesa_nombre, mozo_id, mozo_nombre, estado, total, fecha, hora, notas, comanda_items(id, nombre, cantidad, precio, categoria, notas, estado)')
    .order('created_at', { ascending: false });

  if (fecha)  query = query.eq('fecha', fecha);
  if (estado) query = query.eq('estado', estado);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Rename comanda_items → items to match frontend expectations
  const rows = (data || []).map((c: any) => ({ ...c, items: c.comanda_items, comanda_items: undefined }));
  return NextResponse.json(rows);
}

// POST /api/pedidos — crear comanda
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { mesa_nombre, mozo_id, mozo_nombre, items, fecha, hora, notas } = await request.json();

  if (!mesa_nombre || !items?.length) {
    return NextResponse.json({ error: 'mesa_nombre e items son requeridos' }, { status: 400 });
  }

  const total = items.reduce((s: number, i: any) => s + i.precio * i.cantidad, 0);
  const today = fecha || new Date().toISOString().split('T')[0];
  const now   = hora  || new Date().toTimeString().slice(0, 5);

  const { data: comanda, error: cmdErr } = await sb
    .from('comandas')
    .insert([{ mesa_nombre, mozo_id: mozo_id || null, mozo_nombre: mozo_nombre || null, estado: 'Pendiente', total, fecha: today, hora: now, notas: notas || null }])
    .select('id')
    .single();

  if (cmdErr) return NextResponse.json({ error: cmdErr.message }, { status: 500 });

  const cmdItems = items.map((item: any) => ({
    comanda_id: comanda.id,
    nombre: item.nombre,
    cantidad: item.cantidad,
    precio: item.precio,
    categoria: item.categoria || 'comida',
    notas: item.notas || null,
  }));

  const { error: itemsErr } = await sb.from('comanda_items').insert(cmdItems);
  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  // Upsert ventas_diarias
  const totalComida  = items.filter((i: any) => i.categoria === 'comida')  .reduce((s: number, i: any) => s + i.precio * i.cantidad, 0);
  const totalBebidas = items.filter((i: any) => i.categoria === 'bebidas') .reduce((s: number, i: any) => s + i.precio * i.cantidad, 0);

  await sb.rpc('upsert_ventas_diarias', {
    p_fecha: today,
    p_ingresos: total,
    p_comida: totalComida,
    p_bebidas: totalBebidas,
  }).maybeSingle();

  return NextResponse.json({ success: true, id: comanda.id }, { status: 201 });
}
