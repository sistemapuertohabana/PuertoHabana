import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// PUT /api/gastos/:id
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { descripcion, categoria, monto, fecha } = await request.json();
    await pool.query(
      `UPDATE gastos SET descripcion=?, categoria=?, monto=?, fecha=? WHERE id=?`,
      [descripcion, categoria, parseFloat(monto), fecha, id]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/gastos/:id
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pool.query(`DELETE FROM gastos WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
