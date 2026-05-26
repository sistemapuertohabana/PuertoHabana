import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/sunat/reportes?tipo=...&mes=...&anio=...
export async function GET(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo') || 'mensual';
  const mes = parseInt(searchParams.get('mes') || String(new Date().getMonth() + 1));
  const anio = parseInt(searchParams.get('anio') || String(new Date().getFullYear()));

  try {
    switch (tipo) {
      case 'mensual': {
        // Reporte tributario mensual
        const mesStr = String(mes).padStart(2, '0');
        const fechaInicio = `${anio}-${mesStr}-01`;
        const ultimoDia = new Date(anio, mes, 0).getDate();
        const fechaFin = `${anio}-${mesStr}-${String(ultimoDia).padStart(2, '0')}`;

        // Boletas emitidas en el mes
        const { data: boletasMes } = await sb
          .from('boletas_electronicas')
          .select('*')
          .gte('created_at', fechaInicio)
          .lte('created_at', fechaFin)
          .order('created_at', { ascending: true });

        // Resumen
        const totalEmitido = (boletasMes || []).reduce((s, b) => s + Number(b.total), 0);
        const totalIGV = (boletasMes || []).reduce((s, b) => s + Number(b.igv), 0);
        const aceptadas = (boletasMes || []).filter(b => b.estado_sunat === 'aceptado').length;
        const rechazadas = (boletasMes || []).filter(b => b.estado_sunat === 'rechazado').length;

        return NextResponse.json({
          tipo: 'mensual',
          periodo: `${anio}-${mesStr}`,
          resumen: {
            total_emitido: totalEmitido,
            total_igv: totalIGV,
            total_boletas: (boletasMes || []).length,
            aceptadas,
            rechazadas,
          },
          boletas: boletasMes || [],
        });
      }

      case 'limite': {
        // Alertas de límite de ingresos (RUS / Régimen General)
        // Obtener los últimos 12 meses de ventas
        const fechaInicioLimite = `${anio - 1}-${String(mes).padStart(2, '0')}-01`;
        const fechaFinLimite = `${anio}-${String(mes).padStart(2, '0')}-31`;

        const { data: boletasAnio } = await sb
          .from('boletas_electronicas')
          .select('total, igv, created_at')
          .gte('created_at', fechaInicioLimite)
          .lte('created_at', fechaFinLimite);

        const ingresosAnuales = (boletasAnio || []).reduce((s, b) => s + Number(b.total), 0);
        const limiteRUS = 96000; // Límite RUS S/ 96,000
        const limiteGeneral = 1700000; // Límite Régimen General S/ 1,700,000
        const porcentajeUsado = (ingresosAnuales / limiteGeneral) * 100;

        return NextResponse.json({
          tipo: 'limite',
          ingresos_anuales: ingresosAnuales,
          limite_rus: limiteRUS,
          limite_general: limiteGeneral,
          porcentaje_usado: Math.round(porcentajeUsado * 100) / 100,
          alerta: porcentajeUsado > 80 ? '⚠️ Te acercas al límite del Régimen General' : '✅ Dentro del límite',
          excede_rus: ingresosAnuales > limiteRUS,
          excede_general: ingresosAnuales > limiteGeneral,
        });
      }

      case 'libro-ventas': {
        // Libro de registros de ventas
        const { data: boletas } = await sb
          .from('boletas_electronicas')
          .select('*, clientes(nombre, dni, ruc)')
          .order('created_at', { ascending: true });

        return NextResponse.json({
          tipo: 'libro-ventas',
          registros: (boletas || []).map(b => ({
            fecha: b.created_at?.split('T')[0],
            tipo_doc: b.tipo_doc === 'factura' ? 'FACTURA' : 'BOLETA',
            serie: b.serie,
            numero: b.numero,
            numero_doc: `${b.serie}-${b.numero}`,
            cliente_ruc: b.clientes?.ruc || b.razon_social || '-',
            cliente_nombre: b.clientes?.nombre || b.razon_social || '-',
            total: Number(b.total),
            igv: Number(b.igv),
            estado: b.estado_sunat,
          })),
        });
      }

      case 'config': {
        // Obtener configuración de Nubefact / SUNAT
        const token = process.env.NUBEFACT_TOKEN ? 'Configurado' : 'No configurado';
        const endpoint = process.env.NUBEFACT_ENDPOINT || 'https://api.nubefact.com/api/v1';
        const ruc = process.env.NEXT_PUBLIC_NEGOCIO_RUC || 'No configurado';

        return NextResponse.json({
          tipo: 'config',
          nubefact_token: token,
          nubefact_endpoint: endpoint,
          ruc_negocio: ruc,
          ultramsg_token: process.env.ULTRAMSG_TOKEN ? 'Configurado' : 'No configurado',
          ultramsg_instance: process.env.ULTRAMSG_INSTANCE_ID ? 'Configurado' : 'No configurado',
        });
      }

      default:
        return NextResponse.json({ error: 'Tipo no válido: mensual, limite, libro-ventas, config' }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    console.error('[SUNAT Reportes] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
