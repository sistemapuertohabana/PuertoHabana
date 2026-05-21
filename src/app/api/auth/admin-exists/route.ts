import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('rol', 'admin');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ exists: (count ?? 0) > 0 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error de configuración';
    return NextResponse.json({ error: message, exists: false }, { status: 503 });
  }
}
