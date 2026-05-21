import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerClient();
    const { data: { user: adminUser } } = await supabaseServer.auth.getUser();

    if (!adminUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: adminProfile } = await supabaseServer
      .from('profiles')
      .select('rol')
      .eq('id', adminUser.id)
      .single();

    if (adminProfile?.rol !== 'admin') {
      return NextResponse.json({ error: 'Requiere permisos de administrador' }, { status: 403 });
    }

    const body = await request.json();
    const { id, nombre, email, password, rol, dni } = body;

    if (!id || !nombre || !email || !rol) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updateData: any = {
      email: email.trim().toLowerCase(),
      user_metadata: {
        nombre: nombre.trim(),
        rol: rol,
        dni: dni ? dni.trim() : null,
      },
    };

    if (password && password.trim().length > 0) {
      updateData.password = password;
    }

    const { data: userData, error: updateError } = await adminSupabase.auth.admin.updateUserById(
      id,
      updateData
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    await adminSupabase.from('profiles').update({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      rol: rol,
      dni: dni ? dni.trim() : null,
    }).eq('id', id);

    return NextResponse.json({
      ok: true,
      message: 'Personal actualizado exitosamente',
    });

  } catch (error: any) {
    console.error('Error in update-user:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
