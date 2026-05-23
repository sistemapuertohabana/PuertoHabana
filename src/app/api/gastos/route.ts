import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// GET /api/gastos
export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `SELECT id, descripcion, categoria, monto, fecha FROM gastos ORDER BY fecha DESC, id DESC`
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/gastos
export async function POST(request: Request) {
  try {
    const { descripcion, categoria, monto, fecha } = await request.json();
    if (!descripcion || !monto) {
      return NextResponse.json({ error: 'descripcion y monto son requeridos' }, { status: 400 });
    }
    const [result]: any = await pool.query(
      `INSERT INTO gastos (descripcion, categoria, monto, fecha) VALUES (?, ?, ?, ?)`,
      [descripcion, categoria || 'Otros', parseFloat(monto), fecha || new Date().toISOString().split('T')[0]]
    );
    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
