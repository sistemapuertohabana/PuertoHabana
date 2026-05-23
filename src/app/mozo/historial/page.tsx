'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, CheckCircle2, Clock } from 'lucide-react';

interface Comanda {
  id: number;
  mesa: string;
  mozo_nombre?: string;
  estado: string;
  hora: string;
  fecha: string;
  total: number;
  items?: { nombre: string; cantidad: number; precio: number }[];
}

function getLocalDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MozoHistorialPage() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [fecha] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString()
      : getLocalDateString()
  );

  // Solo muestra las comandas del mozo logueado
  const mozoId = typeof window !== 'undefined'
    ? (() => { try { return JSON.parse(localStorage.getItem('ph_mozo_session') || '{}').id || ''; } catch { return ''; } })()
    : '';

  const loadComandas = useCallback(async () => {
    try {
      const res = await fetch(`/api/pedidos?fecha=${fecha}`);
      if (!res.ok) throw new Error();
      const data: Comanda[] = await res.json();
      // Filtrar por mozo si hay sesión
      setComandas(mozoId ? data.filter((c: any) => c.mozo_id === mozoId || !mozoId) : data);
    } catch {
      // Fallback localStorage
      try {
        const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
        const hoy = all.filter((p: any) => p.fecha === fecha);
        // Agrupar por mesa+hora como "comanda"
        const grouped: Record<string, Comanda> = {};
        hoy.forEach((p: any) => {
          const key = `${p.mesa}-${p.hora}`;
          if (!grouped[key]) {
            grouped[key] = { id: p.id, mesa: p.mesa, mozo_nombre: p.mozoNombre, estado: p.estado, hora: p.hora, fecha: p.fecha, total: 0, items: [] };
          }
          grouped[key].total += p.precio * p.cantidad;
          grouped[key].items?.push({ nombre: p.item, cantidad: p.cantidad, precio: p.precio });
        });
        setComandas(Object.values(grouped));
      } catch { setComandas([]); }
    }
    setLoading(false);
  }, [fecha, mozoId]);

  useEffect(() => {
    loadComandas();
    const interval = setInterval(loadComandas, 5000);
    window.addEventListener('storage', loadComandas);
    return () => { clearInterval(interval); window.removeEventListener('storage', loadComandas); };
  }, [loadComandas]);

  const marcarEntregado = async (id: number) => {
    try {
      await fetch(`/api/pedidos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Entregado' }),
      });
      loadComandas();
    } catch {
      const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
      localStorage.setItem('puerto_habana_pedidos', JSON.stringify(all.map((p: any) => p.id === id ? { ...p, estado: 'Entregado' } : p)));
      loadComandas();
    }
  };

  const total = comandas.reduce((s, c) => s + Number(c.total), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Pedidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{fecha}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase font-semibold">Total del Día</p>
          <p className="text-2xl font-bold text-blue-600">S/ {total.toFixed(2)}</p>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comandas.length === 0 ? (
          <div className="mt-12 text-center border-2 border-dashed border-gray-200 py-16 rounded-2xl bg-white">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-sm text-gray-500 uppercase font-medium tracking-widest">Sin pedidos registrados hoy</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comandas.map(c => (
              <div key={c.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-gray-900">{c.mesa}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} /> {c.hora}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        c.estado === 'Pendiente'  ? 'bg-orange-100 text-orange-600' :
                        c.estado === 'Preparando'? 'bg-blue-100 text-blue-600'     :
                        c.estado === 'Listo'     ? 'bg-green-100 text-green-600'   :
                        'bg-gray-100 text-gray-600'
                      }`}>{c.estado}</span>
                    </div>
                    {c.mozo_nombre && <p className="text-xs text-gray-400 mt-0.5">Mozo: {c.mozo_nombre}</p>}
                  </div>
                  <p className="text-base font-bold text-gray-900">S/ {Number(c.total).toFixed(2)}</p>
                </div>

                {c.items && c.items.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {c.items.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="font-bold text-gray-900">{item.cantidad}×</span>
                        <span>{item.nombre}</span>
                        <span className="text-gray-400 ml-auto">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {c.estado === 'Listo' && (
                  <button onClick={() => marcarEntregado(c.id)}
                    className="w-full bg-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-black transition-colors text-sm">
                    <CheckCircle2 size={16} /> Marcar Entregado
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
