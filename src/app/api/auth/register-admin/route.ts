import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, email, password } = body as {
      nombre?: string;
      email?: string;
      password?: string;
    };

    if (!nombre?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: 'Nombre, correo y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { count: adminCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('rol', 'admin');

    if ((adminCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Ya existe un administrador. Usa inicio de sesión.' },
        { status: 403 }
      );
    }

    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        nombre: nombre.trim(),
        rol: 'admin',
      },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const userId = userData.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 500 });
    }

    // Asegurar perfil admin (por si el trigger no corrió)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      rol: 'admin',
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Administrador creado. Ya puedes iniciar sesión.',
      email: email.trim().toLowerCase(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al registrar administrador';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
