import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// GET /api/reservas?fecha=YYYY-MM-DD
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const sql = fecha
      ? `SELECT id, mesa_id, cliente, telefono, fecha, hora, personas, notas, estado FROM reservas WHERE fecha = ? ORDER BY hora ASC`
      : `SELECT id, mesa_id, cliente, telefono, fecha, hora, personas, notas, estado FROM reservas ORDER BY fecha DESC, hora ASC`;
    const [rows]: any = await pool.query(sql, fecha ? [fecha] : []);
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/reservas
export async function POST(request: Request) {
  try {
    const { mesa_id, cliente, telefono, fecha, hora, personas, notas } = await request.json();
    if (!cliente || !fecha || !hora) return NextResponse.json({ error: 'cliente, fecha y hora requeridos' }, { status: 400 });
    const [result]: any = await pool.query(
      `INSERT INTO reservas (mesa_id, cliente, telefono, fecha, hora, personas, notas, estado) VALUES (?,?,?,?,?,?,?,'pendiente')`,
      [mesa_id || null, cliente, telefono || null, fecha, hora, personas || 2, notas || null]
    );
    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/reservas?id=xxx
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    await pool.query(`DELETE FROM reservas WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
