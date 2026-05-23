'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter as useAppRouter } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function PrintTicket() {
  const { id } = useParams();
  const comandaId = Number(id);
  const [comanda, setComanda] = useState<any>(null);
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);

  /* -------------- CARGA DE CONFIGURACIÓN (una sola vez) -------------- */
  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('configuracion').select('*');
      if (data) {
        const cfg = data.reduce((acc: any, row: any) => ({ ...acc, [row.clave]: row.valor }), {});
        setConfig(cfg);
      }
    };
    fetchConfig();
  }, []);

  /* ------------------------- CARGA DE COMANDA ------------------------ */
  useEffect(() => {
    const fetchComanda = async () => {
      const { data, error } = await supabase
        .from('comandas')
        .select(`
          mesa_nombre,
          mozo_nombre,
          created_at,
          comanda_items (
            id,
            nombre,
            cantidad,
            precio,
            notas
          )
        `)
        .eq('id', comandaId)
        .single();

      if (error) {
        console.error(error);
        setComanda(null);
      } else {
        setComanda(data);
      }
      setLoading(false);
    };
    fetchComanda();
  }, [comandaId]);

  /* ---------------------- IMPRESIÓN AUTOMÁTICA ---------------------- */
  useEffect(() => {
    if (comanda) {
      setTimeout(() => window.print(), 300);
    }
  }, [comanda]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-500 mr-2" size={32} />
        <span className="text-gray-600">Cargando ticket…</span>
      </div>
    );
  }

  if (!comanda) {
    return (
      <div className="p-8 text-center min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-sm w-full">
          <p className="text-red-600 mb-6 font-bold text-lg">No se encontró la comanda.</p>
          <button 
            onClick={() => window.location.href = '/mozo/historial'} 
            className="w-full px-4 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
          >
            Volver al Historial
          </button>
        </div>
      </div>
    );
  }

  const subtotal = comanda.comanda_items.reduce(
    (acc: number, i: any) => acc + i.precio * i.cantidad,
    0,
  );
  const total = subtotal;

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:py-0 print:bg-white">
      
      {/* Controles que NO se imprimen */}
      <div className="print:hidden absolute top-4 left-4 flex gap-3">
        <button
          onClick={() => router.push('/mozo')}
          className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors"
        >
          Dashboard Mozo
        </button>
        <button
          onClick={() => {
            console.log('Conectando a la ticketera');
            alert('Conectado a la ticketera');
          }}
          className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors"
        >
          {config?.nombreMaquina || 'Ticketera'}
        </button>
      </div>

      {/* Controles de imprimir y volver (no se imprimen) */}
      <div className="print:hidden w-[80mm] mx-auto mb-6 flex gap-3">
        <button 
          onClick={() => window.history.back()} 
          className="flex-1 px-3 py-3 bg-white border border-gray-200 text-gray-800 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
        >
          Volver
        </button>
        <button 
          onClick={() => window.print()} 
          className="flex-[2] px-3 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Imprimir Ticket
        </button>
      </div>

      <div className="bg-white text-black p-4 text-sm font-mono w-[80mm] mx-auto shadow-sm print:shadow-none print:m-0 print:p-0 print:w-[80mm]">
        {/* Cabecera */}
          <p className="text-xs">{config.direccion || 'Av. Colonización 1115'}</p>
        </p>
        <p className="text-xs">RUC: {config.ruc || '10429025546'}</p>
        <p className="text-xs">TELF: {config.telefono || '+51 123 456 789'}</p>
        <div className="border-b border-black border-dashed my-2" />
        <p className="font-bold text-lg">TICKET DE VENTA</p>
        <p>Mesa: {comanda.mesa_nombre}</p>
        <p>Mozo: {comanda.mozo_nombre}</p>
        <p>
          Fecha:{' '}
          {new Date(comanda.created_at).toLocaleString('es-PE')}
        </p>
      </div>

      {/* Detalle de ítems */}
      <div className="border-b border-black border-dashed my-2" />
      <table className="w-full text-left text-xs mb-2">
        <thead>
          <tr className="border-b border-black">
            <th className="py-1">CANT</th>
            <th className="py-1">DESCRIPCIÓN</th>
            <th className="py-1 text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {comanda.comanda_items.map((i: any) => (
            <tr key={i.id}>
              <td className="py-1 align-top">{i.cantidad}</td>
              <td className="py-1 px-1 align-top">{i.nombre}</td>
              <td className="py-1 text-right align-top">
                S/ {(i.precio * i.cantidad).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div className="border-b border-black border-dashed my-2" />
      <div className="text-right text-sm">
        <p className="font-bold text-lg">TOTAL: S/ {total.toFixed(2)}</p>
      </div>

      {/* Pie */}
      <div className="border-b border-black border-dashed my-2" />
      <div className="text-center mt-4 mb-8">
        <p className="font-bold">¡GRACIAS POR SU PREFERENCIA!</p>
        <p className="text-xs">Puerto Habana Cevicheria</p>
      </div>

      {/* Estilos para imprimir solo el ticket */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden; }
              .print\\:w-\\[80mm\\], .print\\:w-\\[80mm\\] * { visibility: visible; }
              .print\\:w-\\[80mm\\] { position: absolute; left: 0; top: 0; margin: 0; padding: 0; }
              @page { margin: 0; }
            }
          `,
        }}
      />
      </div>
    </div>
  );
}
