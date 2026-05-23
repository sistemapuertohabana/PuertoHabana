import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// PUT /api/personal/:id
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { nombre, email, dni, rol, salario_monto, salario_tipo } = await request.json();
    await pool.query(
      `UPDATE usuarios SET nombre=?, email=?, dni=?, rol=?, salario_monto=?, salario_tipo=?
       WHERE id=? AND rol != 'admin'`,
      [nombre, email?.trim().toLowerCase() || null, dni || null, rol, salario_monto || null, salario_tipo || null, id]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/personal/:id — soft delete
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pool.query(`UPDATE usuarios SET activo = 0 WHERE id = ? AND rol != 'admin'`, [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
