import { createClient } from '@/lib/supabase/client';
import type { ProductoRow } from '@/lib/database.types';

export async function fetchProductosActivos(): Promise<ProductoRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .order('categoria')
    .order('nombre');
  if (error) throw error;
  return (data ?? []) as ProductoRow[];
}

export async function fetchAllProductos(): Promise<ProductoRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('productos').select('*').order('id');
  if (error) throw error;
  return (data ?? []) as ProductoRow[];
}

export async function upsertProducto(
  producto: Partial<ProductoRow> & { nombre: string; precio: number; categoria: ProductoRow['categoria'] }
) {
  const supabase = createClient();
  if (producto.id) {
    const { error } = await supabase.from('productos').update(producto).eq('id', producto.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('productos').insert(producto);
    if (error) throw error;
  }
}

export async function deleteProducto(id: number) {
  const supabase = createClient();
  const { error } = await supabase.from('productos').update({ activo: false }).eq('id', id);
  if (error) throw error;
}
