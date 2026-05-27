'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Clock, CalendarDays, UtensilsCrossed } from 'lucide-react';

interface Comanda {
  id: number;
  mesa_nombre: string;
  mesa: string;
  mozo_nombre?: string;
  estado: string;
  hora: string;
  fecha: string;
  total: number;
  items?: { nombre: string; cantidad: number; precio: number; categoria?: string }[];
}

function getLocalDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HistorialCocinaPage() {
  const [comandas,    setComandas]    = useState<Comanda[]>([]);
  const [mounted,     setMounted]     = useState(false);
  const [fechaFiltro, setFechaFiltro] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString()
      : getLocalDateString()
  );

  const loadHistorial = useCallback(async () => {
    try {
      const res = await fetch(`/api/pedidos?fecha=${fechaFiltro}&estado=Entregado`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Mapear mesa_nombre → mesa (se muestran todos los items, incluyendo bebidas)
      const mapped: Comanda[] = data.map((c: any) => ({
        id: c.id,
        mesa_nombre: c.mesa_nombre || c.mesa || '',
        mesa: c.mesa_nombre || c.mesa || '',
        mozo_nombre: c.mozo_nombre,
        estado: c.estado,
        hora: c.hora,
        fecha: c.fecha,
        total: Number(c.total) || 0,
        items: (c.items || []).map((i: any) => ({
          nombre: i.nombre,
          cantidad: i.cantidad,
          precio: Number(i.precio) || 0,
          categoria: i.categoria,
        })),
      }));
      setComandas(mapped);
    } catch {
      // Fallback localStorage
      try {
        const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
        const delivered = all.filter((p: any) => p.estado === 'Entregado' && p.fecha === fechaFiltro);
        // Agrupar por mesa+hora
        const grouped: Record<string, Comanda> = {};
        delivered.forEach((p: any) => {
          const key = `${p.mesa}-${p.hora}`;
          if (!grouped[key]) {
            grouped[key] = { id: p.id, mesa_nombre: p.mesa, mesa: p.mesa, mozo_nombre: p.mozoNombre, estado: 'Entregado', hora: p.hora, fecha: p.fecha, total: 0, items: [] };
          }
          grouped[key].total += p.precio * p.cantidad;
          grouped[key].items?.push({ nombre: p.item, cantidad: p.cantidad, precio: Number(p.precio) || 0, categoria: p.category });
        });
        setComandas(Object.values(grouped).sort((a, b) => b.id - a.id));
      } catch { setComandas([]); }
    }
  }, [fechaFiltro]);

  useEffect(() => {
    setMounted(true);
    loadHistorial();
    const interval = setInterval(loadHistorial, 10000);
    window.addEventListener('storage', loadHistorial);
    return () => { clearInterval(interval); window.removeEventListener('storage', loadHistorial); };
  }, [loadHistorial]);

  if (!mounted) return null;

  const totalPlatos = comandas.reduce((s, c) => s + (c.items?.reduce((si, i) => si + i.cantidad, 0) ?? 0), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in fade-in duration-300 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium text-gray-900 mb-1 flex items-center gap-3">
            <CheckCircle2 className="text-green-500" size={30} /> Historial de Entregas
          </h1>
          <p className="text-sm text-gray-500 uppercase font-medium">Platos preparados y entregados</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <CalendarDays size={16} className="text-gray-400" />
          <input type="date" value={fechaFiltro}
            onChange={e => setFechaFiltro(e.target.value)}
            className="border-none focus:ring-0 text-sm font-medium text-gray-700 bg-transparent cursor-pointer" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Platos</p>
          <p className="text-3xl font-light text-gray-900">{totalPlatos}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Comandas</p>
          <p className="text-3xl font-light text-gray-900">{comandas.length}</p>
        </div>
      </div>

      {comandas.length === 0 ? (
        <div className="text-center border-2 border-dashed border-gray-200 py-24 rounded-2xl bg-gray-50">
          <UtensilsCrossed size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-500 uppercase font-medium tracking-widest">No hay órdenes entregadas en esta fecha</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-4">Hora</th>
                  <th className="px-5 py-4">Mesa</th>
                  <th className="px-5 py-4">Ítems</th>
                  <th className="px-5 py-4">Mozo</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comandas.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-500 flex items-center gap-1.5 whitespace-nowrap">
                      <Clock size={13} /> {c.hora}
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900 whitespace-nowrap">{c.mesa}</td>
                    <td className="px-5 py-4">
                      {c.items?.map((item, i) => (
                        <span key={i} className="block text-gray-700">
                          <span className="font-semibold">({item.cantidad})</span> {item.nombre}
                        </span>
                      ))}
                    </td>
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{c.mozo_nombre || '—'}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">S/ {Number(c.total).toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700">
                        <CheckCircle2 size={11} /> Entregado
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
