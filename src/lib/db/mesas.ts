import { createClient } from '@/lib/supabase/client';
import type { MesaEstado, MesaRow } from '@/lib/database.types';

export async function fetchMesas(): Promise<MesaRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('mesas').select('*').order('id');
  if (error) throw error;
  return (data ?? []) as MesaRow[];
}

export async function updateMesa(
  id: number,
  patch: Partial<Pick<MesaRow, 'estado' | 'capacidad' | 'juntada_con_id'>>
) {
  const supabase = createClient();
  const { error } = await supabase.from('mesas').update(patch).eq('id', id);
  if (error) throw error;
}

export async function juntarMesas(aId: number, bId: number) {
  await updateMesa(aId, { estado: 'Ocupada', juntada_con_id: bId });
  await updateMesa(bId, { estado: 'Ocupada', juntada_con_id: aId });
}

export async function separarMesas(aId: number, bId: number) {
  await updateMesa(aId, { juntada_con_id: null });
  await updateMesa(bId, { juntada_con_id: null });
}

export async function setMesaEstado(id: number, estado: MesaEstado) {
  await updateMesa(id, { estado });
}
