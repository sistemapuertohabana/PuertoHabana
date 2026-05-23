'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function PrintTicket() {
  const { id } = useParams();
  const [comanda, setComanda] = useState<any>(null);
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      // Obtener la configuración
      const { data: confData } = await supabase.from('configuracion').select('*');
      if (confData) {
        const c = confData.reduce((acc, row) => ({ ...acc, [row.clave]: row.valor }), {});
        setConfig(c);
      }

      // Obtener la comanda y sus items
      const { data: comandaData } = await supabase
        .from('comandas')
        .select(`
          *,
          comanda_items (*)
        `)
        .eq('id', id)
        .single();
      
      if (comandaData) setComanda(comandaData);
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (comanda) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [comanda]);

  if (!comanda) return <div className="p-4 text-center">Cargando ticket...</div>;

  const subtotal = comanda.comanda_items.reduce((acc: number, item: any) => acc + (item.precio * item.cantidad), 0);
  const total = subtotal; // Aquí podrías calcular IGV o Descuentos si los tienes

  return (
    <div className="bg-white text-black p-4 text-sm font-mono w-[80mm] mx-auto print:m-0 print:p-0 print:w-[80mm]">
      <div className="text-center mb-4">
        <h1 className="font-bold text-xl uppercase">{config.nombreEmpresa || 'PUERTO HABANA'}</h1>
        <p className="text-xs uppercase">{config.direccion || 'Av. Colonización 1115'}</p>
        <p className="text-xs">RUC: {config.ruc || '10429025546'}</p>
        <p className="text-xs">TELF: {config.telefono || '+51 123 456 789'}</p>
        <div className="border-b border-black border-dashed my-2"></div>
        <p className="font-bold text-lg">TICKET DE VENTA</p>
        <p>Mesa: {comanda.mesa}</p>
        <p>Mozo: {comanda.mozo_nombre}</p>
        <p>Fecha: {new Date(comanda.created_at).toLocaleString('es-PE')}</p>
      </div>

      <div className="border-b border-black border-dashed my-2"></div>

      <table className="w-full text-left text-xs mb-2">
        <thead>
          <tr className="border-b border-black">
            <th className="py-1">CANT</th>
            <th className="py-1">DESCRIPCIÓN</th>
            <th className="py-1 text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {comanda.comanda_items.map((item: any) => (
            <tr key={item.id}>
              <td className="py-1 align-top">{item.cantidad}</td>
              <td className="py-1 px-1 align-top">{item.nombre_plato}</td>
              <td className="py-1 text-right align-top">S/ {(item.precio * item.cantidad).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-b border-black border-dashed my-2"></div>

      <div className="text-right text-sm">
        <p className="font-bold text-lg">TOTAL: S/ {total.toFixed(2)}</p>
      </div>

      <div className="border-b border-black border-dashed my-2"></div>

      <div className="text-center mt-4 mb-8">
        <p className="font-bold">¡GRACIAS POR SU PREFERENCIA!</p>
        <p className="text-xs">Sistema desarrollado por ti</p>
      </div>

      {/* Este bloque oculta todo lo demás en la web y asegura que solo el ticket se imprima con el tamaño correcto */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print\\:w-\\[80mm\\], .print\\:w-\\[80mm\\] * { visibility: visible; }
          .print\\:w-\\[80mm\\] { position: absolute; left: 0; top: 0; margin: 0; padding: 0; }
          @page { margin: 0; }
        }
      `}} />
    </div>
  );
}
