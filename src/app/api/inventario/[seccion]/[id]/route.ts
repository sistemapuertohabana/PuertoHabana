import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// PUT /api/inventario/:seccion/:id
export async function PUT(request: Request, { params }: { params: Promise<{ seccion: string; id: string }> }) {
  try {
    const { id } = await params;
    const { nombre, categoria, tipo, precio, cantidad, unidad, minimo } = await request.json();
    await pool.query(
      `UPDATE inventario SET nombre=?, categoria=?, tipo=?, precio=?, cantidad=?, unidad=?, minimo=? WHERE id=?`,
      [nombre, categoria || null, tipo || null, precio || 0, cantidad || 0, unidad || 'unidad', minimo || 5, id]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/inventario/:seccion/:id
export async function DELETE(_: Request, { params }: { params: Promise<{ seccion: string; id: string }> }) {
  try {
    const { id } = await params;
    await pool.query(`DELETE FROM inventario WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
