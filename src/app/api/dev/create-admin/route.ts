import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import pool from '@/../lib/db';

export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { nombre, email } = await request.json();

  if (!nombre || !email) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }

  const emailClean = email.trim().toLowerCase();

  // 1. Insertar o actualizar en Supabase
  const { data, error } = await sb
    .from('usuarios')
    .upsert({
      nombre,
      email: emailClean,
      rol: 'admin',
      activo: true
    }, { onConflict: 'email' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Sincronizar con MySQL para que el login (admin-exists) lo encuentre
  try {
    const [existing]: any = await pool.query(
      `SELECT id FROM usuarios WHERE email = ? AND rol = 'admin' LIMIT 1`,
      [emailClean]
    );
    if (existing.length > 0) {
      await pool.query(
        `UPDATE usuarios SET nombre = ?, activo = 1 WHERE id = ?`,
        [nombre.trim(), existing[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO usuarios (nombre, email, rol, activo) VALUES (?, ?, 'admin', 1)`,
        [nombre.trim(), emailClean]
      );
    }
  } catch (mysqlErr: any) {
    // Si MySQL no está disponible, no bloqueamos — Supabase ya tiene el dato
    console.warn('MySQL no disponible al crear admin:', mysqlErr.message);
  }

  return NextResponse.json({ success: true, user: data });
}
