import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// GET /api/reportes/payments
export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `SELECT id, nombre, monto, concepto, fecha FROM pagos_personal ORDER BY fecha DESC, id DESC`
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/reportes/payments
export async function POST(request: Request) {
  try {
    const { nombre, monto, concepto, fecha, usuario_id } = await request.json();
    if (!nombre || !monto || !concepto) {
      return NextResponse.json({ error: 'nombre, monto y concepto son requeridos' }, { status: 400 });
    }
    const [result]: any = await pool.query(
      `INSERT INTO pagos_personal (usuario_id, nombre, monto, concepto, fecha) VALUES (?, ?, ?, ?, ?)`,
      [usuario_id || null, nombre, parseFloat(monto), concepto, fecha || new Date().toISOString().split('T')[0]]
    );
    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/reportes/payments?id=xxx
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    await pool.query(`DELETE FROM pagos_personal WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
