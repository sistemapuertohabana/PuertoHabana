import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// GET /api/inventario?seccion=comida
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seccion = searchParams.get('seccion');
    const sql = seccion
      ? `SELECT id, seccion, nombre, categoria, tipo, precio, cantidad, unidad, minimo FROM inventario WHERE seccion = ? ORDER BY nombre ASC`
      : `SELECT id, seccion, nombre, categoria, tipo, precio, cantidad, unidad, minimo FROM inventario ORDER BY seccion, nombre ASC`;
    const [rows]: any = await pool.query(sql, seccion ? [seccion] : []);
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/inventario
export async function POST(request: Request) {
  try {
    const { seccion, nombre, categoria, tipo, precio, cantidad, unidad, minimo } = await request.json();
    if (!seccion || !nombre) return NextResponse.json({ error: 'seccion y nombre requeridos' }, { status: 400 });
    const [result]: any = await pool.query(
      `INSERT INTO inventario (seccion, nombre, categoria, tipo, precio, cantidad, unidad, minimo) VALUES (?,?,?,?,?,?,?,?)`,
      [seccion, nombre, categoria || null, tipo || null, precio || 0, cantidad || 0, unidad || 'unidad', minimo || 5]
    );
    const [rows]: any = await pool.query(`SELECT * FROM inventario WHERE id = ?`, [result.insertId]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
