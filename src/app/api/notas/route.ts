import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// ── Detectar tags desde el contenido ─────────────────────────────────────────
function detectarTags(contenido: string): string[] {
  const tags: string[] = [];
  const upper = contenido.toUpperCase().trim();

  // Buscar tags con formato [Tag] o Tag: al inicio
  const match = upper.match(/^\[(\w+)\]/) || upper.match(/^(\w+)[:\s]/);
  if (match) {
    const tag = match[1].toLowerCase();
    if (['gasto', 'cocina', 'bebidas', 'insumos', 'nota'].includes(tag)) {
      tags.push(tag);
    }
  }

  // Si no se detectó ningún tag, asignar 'nota' por defecto
  if (tags.length === 0) {
    tags.push('nota');
  }

  // Detectar si menciona "gasto" en el texto aunque no tenga tag explícito
  if (!tags.includes('gasto') && /\bgasto\b/i.test(contenido)) {
    tags.push('gasto');
  }

  return tags;
}

// ── Extraer monto si está presente (S/123.45 o S/ 123.45 o 123.45 soles) ────
function extraerMonto(contenido: string): number | null {
  const match = contenido.match(/S\/\s?(\d+(?:\.\d{1,2})?)/);
  if (match) return parseFloat(match[1]);
  const match2 = contenido.match(/(\d+(?:\.\d{1,2})?)\s*soles/i);
  if (match2) return parseFloat(match2[1]);
  return null;
}

// ── Sincronizar con tabla gastos si el tag es 'gasto' ───────────────────────
async function syncGasto(sb: any, contenido: string, monto: number | null) {
  if (!monto) return;
  const descripcion = contenido.replace(/^\[Gasto\]\s*/i, '').trim();
  await sb
    .from('gastos')
    .insert([{
      descripcion: descripcion || 'Gasto desde notas',
      categoria: 'Insumos',
      monto,
      fecha: new Date().toISOString().split('T')[0],
    }])
    .maybeSingle();
}

// GET /api/notas?tag=gasto&limit=50
export async function GET(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  const limit = parseInt(searchParams.get('limit') || '100');
  const countOnly = searchParams.get('count') === 'true';

  // ── Solo devolver el conteo total ──────────────────────────────────────
  if (countOnly) {
    const { count, error } = await sb
      .from('notas')
      .select('*', { count: 'exact', head: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ count: count ?? 0 });
  }

  let query = sb
    .from('notas')
    .select('id, contenido, tags, monto, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/notas
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { contenido, usuario_id } = await request.json();

  if (!contenido || !contenido.trim()) {
    return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 });
  }

  // Detección automática
  const tags = detectarTags(contenido);
  const monto = extraerMonto(contenido);

  const { data, error } = await sb
    .from('notas')
    .insert([{
      contenido: contenido.trim(),
      tags,
      monto,
      usuario_id: usuario_id || null,
    }])
    .select('id, contenido, tags, monto, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Si es un gasto con monto, sincronizar con tabla gastos
  if (tags.includes('gasto') && monto) {
    syncGasto(sb, contenido, monto).catch(() => {});
  }

  // Crear notificaciones para áreas relevantes (no bloqueante)
  if (tags.includes('cocina')) {
    (async () => {
      await sb.from('notificaciones').insert([{
        rol_destino: 'cocina',
        titulo: '📝 Nota de Administración',
        mensaje: contenido.replace(/^\[Cocina\]\s*/i, '').trim().substring(0, 200),
      }]).maybeSingle();
    })().catch(() => {});
  }
  if (tags.includes('insumos')) {
    (async () => {
      await sb.from('notificaciones').insert([{
        rol_destino: 'admin',
        titulo: '📦 Nota de Insumos',
        mensaje: contenido.replace(/^\[Insumos\]\s*/i, '').trim().substring(0, 200),
      }]).maybeSingle();
    })().catch(() => {});
  }
  if (tags.includes('bebidas')) {
    (async () => {
      await sb.from('notificaciones').insert([{
        rol_destino: 'admin',
        titulo: '🍺 Nota de Bebidas',
        mensaje: contenido.replace(/^\[Bebidas\]\s*/i, '').trim().substring(0, 200),
      }]).maybeSingle();
    })().catch(() => {});
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}

// DELETE /api/notas — Eliminar todas las notas
export async function DELETE() {
  const sb = getServiceSupabase();

  const { error } = await sb
    .from('notas')
    .delete()
    .neq('id', 0);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
