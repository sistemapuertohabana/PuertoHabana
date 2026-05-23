import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// PATCH /api/pedidos/:id — actualizar estado
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { estado } = await request.json();
    await pool.query(`UPDATE comandas SET estado = ? WHERE id = ?`, [estado, id]);
    // También actualizar items si se marca como Entregado
    if (estado === 'Entregado') {
      await pool.query(`UPDATE comanda_items SET estado = 'Entregado' WHERE comanda_id = ?`, [id]);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/pedidos/:id
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pool.query(`DELETE FROM comandas WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
