import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// PATCH /api/pedidos/:id — actualizar estado y/o método de pago
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { estado, metodo_pago } = await request.json();

    if (estado && metodo_pago) {
      await pool.query(
        `UPDATE comandas SET estado = ?, metodo_pago = ? WHERE id = ?`,
        [estado, metodo_pago, id]
      );
    } else if (estado) {
      await pool.query(`UPDATE comandas SET estado = ? WHERE id = ?`, [estado, id]);
    } else if (metodo_pago) {
      await pool.query(`UPDATE comandas SET metodo_pago = ? WHERE id = ?`, [metodo_pago, id]);
    }

    // Si se marca Entregado, actualizar items también
    if (estado === 'Entregado') {
      await pool.query(
        `UPDATE comanda_items SET estado = 'Entregado' WHERE comanda_id = ?`, [id]
      );
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
