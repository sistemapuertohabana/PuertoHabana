import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/notificaciones/subscribe — guardar suscripción push
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { usuario_id, rol, subscription } = await request.json();

  if (!subscription || !subscription.endpoint) {
    return NextResponse.json({ error: 'subscription inválida' }, { status: 400 });
  }

  // Evitar duplicados: buscar por el endpoint dentro del JSONB subscription
  const { data: existing } = await sb
    .from('suscripciones_push')
    .select('id')
    .filter('subscription->>endpoint', 'eq', subscription.endpoint)
    .maybeSingle();

  if (existing) {
    // Actualizar la suscripción existente
    const { error } = await sb
      .from('suscripciones_push')
      .update({
        usuario_id: usuario_id || null,
        rol: rol || null,
        subscription,
      })
      .eq('id', existing.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: existing.id });
  }

  // Insertar nueva suscripción
  const { data, error } = await sb
    .from('suscripciones_push')
    .insert([{
      usuario_id: usuario_id || null,
      rol: rol || null,
      subscription,
    }])
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}

// DELETE /api/notificaciones/subscribe — eliminar suscripción por endpoint
export async function DELETE(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'endpoint requerido' }, { status: 400 });
  }

  const { error } = await sb
    .from('suscripciones_push')
    .delete()
    .filter('subscription->>endpoint', 'eq', endpoint);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
