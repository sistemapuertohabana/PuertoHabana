import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// DELETE /api/auth/delete-user?id=xxx
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    // Soft delete — solo desactiva, no borra
    await pool.query(`UPDATE usuarios SET activo = 0 WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
