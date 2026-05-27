import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { checkAndNotifyLowStock } from '@/lib/push';

export const dynamic = 'force-dynamic';

// GET /api/pedidos?fecha=YYYY-MM-DD&estado=Pendiente
export async function GET(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const fecha  = searchParams.get('fecha');
  const estado = searchParams.get('estado');

  let query = sb
    .from('comandas')
    .select('id, mesa_nombre, mozo_id, mozo_nombre, estado, total, fecha, hora, notas, metodo_pago, comanda_items(id, nombre, cantidad, precio, categoria, notas, estado)')
    .order('created_at', { ascending: false });

  if (fecha)  query = query.eq('fecha', fecha);
  if (estado) query = query.eq('estado', estado);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Rename comanda_items → items and mesa_nombre → mesa to match frontend expectations
  const rows = (data || []).map((c: any) => ({ ...c, mesa: c.mesa_nombre, mesa_nombre: undefined, items: c.comanda_items, comanda_items: undefined }));
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
  const totalTapers  = items.filter((i: any) => i.categoria === 'tapers')  .reduce((s: number, i: any) => s + i.precio * i.cantidad, 0);

  await sb.rpc('upsert_ventas_diarias', {
    p_fecha: today,
    p_ingresos: total,
    p_comida: totalComida,
    p_bebidas: totalBebidas,
    p_tapers: totalTapers,
  }).maybeSingle();

  // ── Decrementar inventario para bebidas y tapers ────────────────────
  // Buscar items en inventario por nombre para descontar stock
  const itemsParaDescontar = items.filter((i: any) => i.categoria === 'bebidas' || i.categoria === 'tapers');
  if (itemsParaDescontar.length > 0) {
    for (const item of itemsParaDescontar) {
      // Buscar el item en inventario por nombre
      const { data: inventoryItems } = await sb
        .from('inventario')
        .select('id, cantidad, nombre, minimo, unidad, seccion')
        .eq('seccion', item.categoria)
        .eq('nombre', item.nombre.replace(/^🎁\s*/, '')) // quitar prefijo 🎁 de cortesía
        .limit(1);

      if (inventoryItems && inventoryItems.length > 0) {
        const invItem = inventoryItems[0];
        const delta = -item.cantidad; // negativo = salida
        const stockAnterior = invItem.cantidad;
        const stockNuevo = Math.max(0, stockAnterior + delta);

        await sb
          .from('inventario')
          .update({ cantidad: stockNuevo })
          .eq('id', invItem.id);

        // Registrar movimiento
        await sb
          .from('inventario_movimientos')
          .insert([{
            inventario_id: invItem.id,
            tipo: 'salida',
            cantidad: item.cantidad,
            stock_anterior: stockAnterior,
            stock_nuevo: stockNuevo,
            referencia: 'pedido',
            referencia_id: String(comanda.id),
            notas: `Pedido #${comanda.id} - ${mesa_nombre}`,
          }])
          .maybeSingle();

        // Verificar si quedó por debajo del mínimo y notificar
        checkAndNotifyLowStock({
          id: invItem.id,
          nombre: invItem.nombre,
          seccion: invItem.seccion,
          cantidad: stockNuevo,
          minimo: invItem.minimo,
          unidad: invItem.unidad,
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json({ success: true, id: comanda.id }, { status: 201 });
}
