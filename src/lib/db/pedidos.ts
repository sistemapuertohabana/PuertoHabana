import { createClient } from '@/lib/supabase/client';
import type { ItemEstado, PedidoFlat, PagoMetodo } from '@/lib/database.types';

export async function fetchPedidosByFecha(fecha: string): Promise<PedidoFlat[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pedidos_vista')
    .select('*')
    .eq('fecha', fecha)
    .order('id', { ascending: false });

  if (error) throw error;
  return (data ?? []) as PedidoFlat[];
}

export async function updateItemEstado(itemId: number, estado: ItemEstado) {
  const supabase = createClient();
  const { error } = await supabase
    .from('comanda_items')
    .update({ estado })
    .eq('id', itemId);
  if (error) throw error;
}

export async function updateItemsEstadoBulk(itemIds: number[], estado: ItemEstado) {
  const supabase = createClient();
  const { error } = await supabase
    .from('comanda_items')
    .update({ estado })
    .in('id', itemIds);
  if (error) throw error;
}

export interface CartItemInput {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
  categoria: 'comida' | 'bebidas';
  notas?: string;
}

export async function createComandaWithItems(
  mesaId: number,
  mozoId: string,
  fecha: string,
  items: CartItemInput[]
): Promise<string> {
  const supabase = createClient();
  const now = new Date();
  const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

  const { data: comanda, error: cErr } = await supabase
    .from('comandas')
    .insert({
      mesa_id: mesaId,
      mozo_id: mozoId,
      fecha,
      hora_apertura: hora,
      estado: 'abierta',
    })
    .select('id')
    .single();

  if (cErr) throw cErr;

  const rows = items.map((i) => ({
    comanda_id: comanda.id,
    producto_id: i.productoId > 0 ? i.productoId : null,
    nombre: i.nombre,
    cantidad: i.cantidad,
    precio: i.precio,
    categoria: i.categoria,
    notas: i.notas ?? null,
    estado: 'Pendiente' as const,
  }));

  const { error: iErr } = await supabase.from('comanda_items').insert(rows);
  if (iErr) throw iErr;

  await supabase.from('mesas').update({ estado: 'Ocupada' }).eq('id', mesaId);

  return comanda.id as string;
}

export async function fetchComandaItems(comandaId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('comanda_items')
    .select('*')
    .eq('comanda_id', comandaId);
  if (error) throw error;
  return data ?? [];
}

export async function cerrarComanda(
  comandaId: string,
  mesaId: number,
  metodo: PagoMetodo,
  impresoPor: string
) {
  const supabase = createClient();
  const items = await fetchComandaItems(comandaId);
  const subtotal = items.reduce((s, i) => s + Number(i.precio) * i.cantidad, 0);
  const igv = subtotal * 0.18;
  const montoTotal = subtotal + igv;

  const { data: pago, error: pErr } = await supabase
    .from('pagos')
    .insert({ comanda_id: comandaId, metodo, subtotal, igv, monto_total: montoTotal })
    .select('id')
    .single();
  if (pErr) throw pErr;

  const { error: bErr } = await supabase.from('boletas').insert({
    comanda_id: comandaId,
    pago_id: pago.id,
    impreso_por: impresoPor,
  });
  if (bErr) throw bErr;

  await supabase.from('comandas').update({ estado: 'cerrada' }).eq('id', comandaId);
  await supabase
    .from('mesas')
    .update({ estado: 'Disponible', juntada_con_id: null })
    .eq('id', mesaId);

  const joined = await supabase.from('mesas').select('id').eq('juntada_con_id', mesaId);
  if (joined.data?.length) {
    for (const m of joined.data) {
      await supabase
        .from('mesas')
        .update({ estado: 'Disponible', juntada_con_id: null })
        .eq('id', m.id);
    }
  }

  return { subtotal, igv, montoTotal };
}

export async function getOpenComandaForMesa(mesaId: number, fecha: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('comandas')
    .select('id')
    .eq('mesa_id', mesaId)
    .eq('fecha', fecha)
    .eq('estado', 'abierta')
    .maybeSingle();
  return data?.id as string | undefined;
}
