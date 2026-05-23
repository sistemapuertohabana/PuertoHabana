import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// POST /api/auth/register-admin
// Registra el único admin del sistema (solo si no existe ninguno)
export async function POST(request: Request) {
  try {
    const { nombre, email } = await request.json();
    if (!nombre || !email) {
      return NextResponse.json({ error: 'nombre y email son requeridos' }, { status: 400 });
    }

    // Solo puede haber un admin
    const [existing]: any = await pool.query(
      `SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1`
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Ya existe un administrador registrado' }, { status: 409 });
    }

    const [result]: any = await pool.query(
      `INSERT INTO usuarios (nombre, email, rol, activo) VALUES (?, ?, 'admin', 1)`,
      [nombre.trim(), email.trim().toLowerCase()]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
