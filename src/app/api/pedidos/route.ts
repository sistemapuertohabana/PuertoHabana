import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// GET /api/pedidos?fecha=YYYY-MM-DD&estado=Pendiente
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha  = searchParams.get('fecha');
    const estado = searchParams.get('estado');

    let sql = `
      SELECT c.id, c.mesa_nombre AS mesa, c.mozo_nombre, c.estado, c.total,
             c.fecha, c.hora, c.notas,
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', ci.id, 'nombre', ci.nombre, 'cantidad', ci.cantidad,
                 'precio', ci.precio, 'categoria', ci.categoria,
                 'notas', ci.notas, 'estado', ci.estado
               )
             ) AS items
      FROM comandas c
      LEFT JOIN comanda_items ci ON ci.comanda_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (fecha)  { sql += ' AND c.fecha = ?';   params.push(fecha); }
    if (estado) { sql += ' AND c.estado = ?';  params.push(estado); }

    sql += ' GROUP BY c.id ORDER BY c.created_at DESC';

    const [rows]: any = await pool.query(sql, params);
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/pedidos — crear comanda
export async function POST(request: Request) {
  try {
    const { mesa_nombre, mozo_id, mozo_nombre, items, fecha, hora, notas } = await request.json();
    if (!mesa_nombre || !items?.length) {
      return NextResponse.json({ error: 'mesa_nombre e items son requeridos' }, { status: 400 });
    }

    const total = items.reduce((s: number, i: any) => s + i.precio * i.cantidad, 0);

    const [result]: any = await pool.query(
      `INSERT INTO comandas (mesa_nombre, mozo_id, mozo_nombre, estado, total, fecha, hora, notas)
       VALUES (?, ?, ?, 'Pendiente', ?, ?, ?, ?)`,
      [mesa_nombre, mozo_id || null, mozo_nombre || null, total, fecha, hora, notas || null]
    );
    const comandaId = result.insertId;

    for (const item of items) {
      await pool.query(
        `INSERT INTO comanda_items (comanda_id, nombre, cantidad, precio, categoria, notas)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [comandaId, item.nombre, item.cantidad, item.precio, item.categoria || 'comida', item.notas || null]
      );
    }

    // Actualizar ventas_diarias
    await pool.query(
      `INSERT INTO ventas_diarias (fecha, total_comandas, total_ingresos, total_comida, total_bebidas)
       VALUES (?, 1, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         total_comandas  = total_comandas  + 1,
         total_ingresos  = total_ingresos  + VALUES(total_ingresos),
         total_comida    = total_comida    + VALUES(total_comida),
         total_bebidas   = total_bebidas   + VALUES(total_bebidas)`,
      [
        fecha,
        total,
        items.filter((i: any) => i.categoria === 'comida').reduce((s: number, i: any) => s + i.precio * i.cantidad, 0),
        items.filter((i: any) => i.categoria === 'bebidas').reduce((s: number, i: any) => s + i.precio * i.cantidad, 0),
      ]
    );

    return NextResponse.json({ success: true, id: comandaId }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
