'use client';

import { useEffect, useState } from 'react';
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
      <div className="p-4 text-center text-red-600">
        No se encontró la comanda solicitada.
      </div>
    );
  }

  const subtotal = comanda.comanda_items.reduce(
    (acc: number, i: any) => acc + i.precio * i.cantidad,
    0,
  );
  const total = subtotal;

  return (
    <div className="bg-white text-black p-4 text-sm font-mono w-[80mm] mx-auto print:m-0 print:p-0 print:w-[80mm]">
      {/* Cabecera */}
      <div className="text-center mb-4">
        <h1 className="font-bold text-xl uppercase">
          {config.nombreEmpresa || 'PUERTO HABANA'}
        </h1>
        <p className="text-xs uppercase">
          {config.direccion || 'Av. Colonización 1115'}
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
  );
}
