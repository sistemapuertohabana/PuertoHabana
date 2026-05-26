import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/clientes?search=...&dni=...&ruc=...
export async function GET(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const dni = searchParams.get('dni');
  const ruc = searchParams.get('ruc');
  const limit = parseInt(searchParams.get('limit') || '100');

  let query = sb.from('clientes').select('*').order('created_at', { ascending: false }).limit(limit);

  if (dni) query = query.eq('dni', dni);
  if (ruc) query = query.eq('ruc', ruc);
  if (search) {
    query = query.or(`nombre.ilike.%${search}%,dni.ilike.%${search}%,telefono.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/clientes
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const body = await request.json();
  const { nombre, dni, ruc, telefono, email, direccion, notas } = body;

  if (!nombre) {
    return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 });
  }

  // Verificar si ya existe con ese DNI
  if (dni) {
    const { data: existente } = await sb.from('clientes').select('id').eq('dni', dni).maybeSingle();
    if (existente) {
      return NextResponse.json({ error: 'Ya existe un cliente con ese DNI', id: existente.id }, { status: 409 });
    }
  }

  const { data, error } = await sb
    .from('clientes')
    .insert([{
      nombre,
      dni: dni || null,
      ruc: ruc || null,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
      notas: notas || null,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/clientes?id=xxx
export async function PATCH(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const body = await request.json();
  const { nombre, dni, ruc, telefono, email, direccion, notas } = body;

  const { data, error } = await sb
    .from('clientes')
    .update({
      ...(nombre !== undefined && { nombre }),
      ...(dni !== undefined && { dni }),
      ...(ruc !== undefined && { ruc }),
      ...(telefono !== undefined && { telefono }),
      ...(email !== undefined && { email }),
      ...(direccion !== undefined && { direccion }),
      ...(notas !== undefined && { notas }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/clientes?id=xxx
export async function DELETE(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const { error } = await sb.from('clientes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
