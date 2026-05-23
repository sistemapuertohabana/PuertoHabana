import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// GET /api/inventario/:seccion
export async function GET(_: Request, { params }: { params: Promise<{ seccion: string }> }) {
  try {
    const { seccion } = await params;
    const [rows]: any = await pool.query(
      `SELECT id, seccion, nombre, categoria, tipo, precio, cantidad, unidad, minimo FROM inventario WHERE seccion = ? ORDER BY nombre ASC`,
      [seccion]
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
