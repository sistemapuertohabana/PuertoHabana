import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (profile?.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden crear personal' }, { status: 403 });
    }

    const body = await request.json();
    const { nombre, email, password, rol, dni } = body;

    if (!nombre?.trim() || !email?.trim() || !password || !rol) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    const { data: userData, error: createError } = await adminSupabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        nombre: nombre.trim(),
        rol: rol,
        dni: dni ? dni.trim() : null,
      },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const userId = userData?.user?.id;
    if (userId) {
      // Upsert manual por si el trigger no se ejecutó
      await adminSupabase.from('profiles').upsert({
        id: userId,
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        rol: rol,
        dni: dni ? dni.trim() : null,
      });
    }

    return NextResponse.json({
      ok: true,
      message: 'Personal creado exitosamente',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al crear personal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
