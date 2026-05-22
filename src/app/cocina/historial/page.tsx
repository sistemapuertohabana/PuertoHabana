'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, CalendarDays, UtensilsCrossed } from 'lucide-react';

interface Pedido {
  id: number;
  item: string;
  cantidad: number;
  mesa: string;
  estado: string;
  hora: string;
  fecha: string;
  mozoNombre?: string;
}

function getLocalDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HistorialCocinaPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mounted, setMounted] = useState(false);
  const [fechaFiltro, setFechaFiltro] = useState(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString()
      : getLocalDateString();
  });

  useEffect(() => {
    setMounted(true);
    const loadHistorial = () => {
      try {
        const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
        // Filtrar los que estén "Entregado" y coincidan con la fecha
        const delivered = all.filter((p: Pedido) => p.estado === 'Entregado' && p.fecha === fechaFiltro);
        setPedidos(delivered.sort((a: Pedido, b: Pedido) => b.id - a.id));
      } catch {
        setPedidos([]);
      }
    };
    loadHistorial();
    
    const interval = setInterval(loadHistorial, 5000);
    window.addEventListener('storage', loadHistorial);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadHistorial);
    };
  }, [fechaFiltro]);

  if (!mounted) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium text-gray-900 mb-2 flex items-center gap-3">
            <CheckCircle2 className="text-green-500" size={32} /> Historial de Entregas
          </h1>
          <p className="text-sm text-gray-500 uppercase font-medium">Platos preparados y entregados</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <CalendarDays size={18} className="text-gray-400 ml-2" />
          <input
            type="date"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
            className="border-none focus:ring-0 text-sm font-medium text-gray-700 bg-transparent cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Platos</p>
          <p className="text-3xl font-light text-gray-900">{pedidos.reduce((sum, p) => sum + p.cantidad, 0)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Comandas</p>
          <p className="text-3xl font-light text-gray-900">{pedidos.length}</p>
        </div>
      </div>

      {pedidos.length === 0 ? (
        <div className="text-center border-2 border-dashed border-gray-200 py-24 rounded-2xl bg-gray-50">
          <UtensilsCrossed size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm tracking-widest text-gray-500 uppercase font-medium">
            No hay órdenes entregadas en esta fecha
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Hora</th>
                  <th className="px-6 py-4">Mesa</th>
                  <th className="px-6 py-4">Ítem</th>
                  <th className="px-6 py-4">Cant.</th>
                  <th className="px-6 py-4">Mozo</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pedidos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 font-medium flex items-center gap-2">
                      <Clock size={14} /> {p.hora}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">{p.mesa}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{p.item}</td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-bold">
                        x{p.cantidad}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{p.mozoNombre || 'No asignado'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700">
                        <CheckCircle2 size={12} /> {p.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
