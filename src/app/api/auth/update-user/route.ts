import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// PUT /api/auth/update-user
export async function PUT(request: Request) {
  try {
    const { id, nombre, email, dni, rol, salario_monto, salario_tipo, activo, foto_url, turno } = await request.json();
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    await pool.query(
      `UPDATE usuarios SET nombre=?, email=?, dni=?, rol=?, salario_monto=?, salario_tipo=?, activo=?, foto_url=?, turno=?
       WHERE id=?`,
      [
        nombre,
        email ? email.trim().toLowerCase() : null,
        dni || null,
        rol,
        salario_monto || null,
        salario_tipo || null,
        activo ?? 1,
        foto_url || null,
        turno || null,
        id,
      ]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
