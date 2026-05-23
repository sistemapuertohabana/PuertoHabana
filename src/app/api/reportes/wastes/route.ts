import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// GET /api/reportes/wastes
export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `SELECT id, descripcion, costo, fecha FROM mermas ORDER BY fecha DESC, id DESC`
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/reportes/wastes
export async function POST(request: Request) {
  try {
    const { descripcion, costo, fecha } = await request.json();
    if (!descripcion || !costo) {
      return NextResponse.json({ error: 'descripcion y costo son requeridos' }, { status: 400 });
    }
    const [result]: any = await pool.query(
      `INSERT INTO mermas (descripcion, costo, fecha) VALUES (?, ?, ?)`,
      [descripcion, parseFloat(costo), fecha || new Date().toISOString().split('T')[0]]
    );
    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/reportes/wastes?id=xxx
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    await pool.query(`DELETE FROM mermas WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
