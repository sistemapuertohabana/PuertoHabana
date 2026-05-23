import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// GET /api/personal — lista todo el personal activo (excepto admin)
export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `SELECT id, nombre, email, dni, rol, salario_monto, salario_tipo
       FROM usuarios WHERE rol != 'admin' AND activo = 1 ORDER BY nombre ASC`
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/personal — crear empleado
export async function POST(request: Request) {
  try {
    const { nombre, email, dni, rol, salario_monto, salario_tipo } = await request.json();
    if (!nombre || !rol) {
      return NextResponse.json({ error: 'nombre y rol son requeridos' }, { status: 400 });
    }
    const [result]: any = await pool.query(
      `INSERT INTO usuarios (nombre, email, dni, rol, salario_monto, salario_tipo, activo)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [nombre.trim(), email?.trim().toLowerCase() || null, dni || null, rol, salario_monto || null, salario_tipo || null]
    );
    const [rows]: any = await pool.query(
      `SELECT id, nombre, email, dni, rol, salario_monto, salario_tipo FROM usuarios WHERE id = ?`,
      [result.insertId]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
