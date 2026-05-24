import { NextResponse } from 'next/server';
import pool from '@/../lib/db';

// GET /api/auth/admin-exists
// Devuelve si ya existe un admin registrado y su email (para validar login)
export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `SELECT id, nombre, email, foto_url FROM usuarios WHERE rol = 'admin' AND activo = 1 LIMIT 1`
    );
    if (rows.length === 0) {
      return NextResponse.json({ exists: false });
    }
    return NextResponse.json({
      exists: true,
      id: rows[0].id,
      email: rows[0].email,
      nombre: rows[0].nombre,
      foto_url: rows[0].foto_url,
    });
  } catch (err: any) {
    // Si la DB no está disponible, fallback a false
    return NextResponse.json({ exists: false, error: err.message });
  }
}
