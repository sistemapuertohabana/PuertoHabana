import { createClient } from '@/lib/supabase/client';
import type {
  DesperdicioRow,
  GastoRow,
  PagoPersonalRow,
  ProfileRow,
  ReservaRow,
} from '@/lib/database.types';

export async function fetchProfiles(): Promise<ProfileRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('profiles').select('*').order('nombre');
  if (error) throw error;
  return (data ?? []) as ProfileRow[];
}

export async function fetchReservas(): Promise<ReservaRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('reservas').select('*').order('fecha', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReservaRow[];
}

export async function upsertReserva(r: Partial<ReservaRow> & { cliente: string; fecha: string; hora: string }) {
  const supabase = createClient();
  if (r.id) {
    const { error } = await supabase.from('reservas').update(r).eq('id', r.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('reservas').insert(r);
    if (error) throw error;
  }
}

export async function deleteReserva(id: number) {
  const supabase = createClient();
  const { error } = await supabase.from('reservas').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchGastos(): Promise<GastoRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('gastos').select('*').order('fecha', { ascending: false });
  if (error) throw error;
  return (data ?? []) as GastoRow[];
}

export async function upsertGasto(g: Partial<GastoRow> & { descripcion: string; categoria: string; monto: number; fecha: string }) {
  const supabase = createClient();
  if (g.id) {
    const { error } = await supabase.from('gastos').update(g).eq('id', g.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('gastos').insert(g);
    if (error) throw error;
  }
}

export async function deleteGasto(id: number) {
  const supabase = createClient();
  const { error } = await supabase.from('gastos').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchDesperdicios(): Promise<DesperdicioRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('desperdicios').select('*').order('fecha', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DesperdicioRow[];
}

export async function insertDesperdicio(d: { descripcion: string; costo: number; fecha: string }) {
  const supabase = createClient();
  const { error } = await supabase.from('desperdicios').insert(d);
  if (error) throw error;
}

export async function deleteDesperdicio(id: number) {
  const supabase = createClient();
  const { error } = await supabase.from('desperdicios').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchPagosPersonal(): Promise<PagoPersonalRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('pagos_personal').select('*').order('fecha', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PagoPersonalRow[];
}

export async function insertPagoPersonal(p: { mozo_nombre: string; monto: number; concepto: string; fecha: string }) {
  const supabase = createClient();
  const { error } = await supabase.from('pagos_personal').insert(p);
  if (error) throw error;
}

export async function deletePagoPersonal(id: number) {
  const supabase = createClient();
  const { error } = await supabase.from('pagos_personal').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchConfig(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data, error } = await supabase.from('configuracion').select('datos').eq('id', 1).single();
  if (error) throw error;
  return (data?.datos as Record<string, string>) ?? {};
}

export async function saveConfig(datos: Record<string, string>) {
  const supabase = createClient();
  const { error } = await supabase.from('configuracion').upsert({ id: 1, datos });
  if (error) throw error;
}
