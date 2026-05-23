// Cocina — lee comandas desde MySQL API con polling cada 5s
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Check, Clock, UtensilsCrossed } from 'lucide-react';

interface Pedido {
  id: number;
  mesa: string;
  mozo_nombre?: string;
  estado: string;
  hora: string;
  fecha: string;
  notas?: string;
  items?: { nombre: string; cantidad: number; notas?: string }[];
}

function getLocalDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CocinaPage() {
  const [pedidos,     setPedidos]     = useState<Pedido[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [fecha] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString()
      : getLocalDateString()
  );

  const loadPedidos = useCallback(async () => {
    try {
      const url = showHistory
        ? '/api/pedidos?estado=Entregado'
        : `/api/pedidos?fecha=${fecha}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data: Pedido[] = await res.json();
      setPedidos(showHistory ? data : data.filter(p => p.estado !== 'Entregado'));
    } catch {
      // Fallback localStorage
      try {
        const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
        setPedidos(showHistory
          ? all.filter((p: any) => p.estado === 'Entregado')
          : all.filter((p: any) => p.fecha === fecha && p.estado !== 'Entregado'));
      } catch { setPedidos([]); }
    }
  }, [fecha, showHistory]);

  useEffect(() => {
    loadPedidos();
    const interval = setInterval(loadPedidos, 5000);
    window.addEventListener('storage', loadPedidos);
    return () => { clearInterval(interval); window.removeEventListener('storage', loadPedidos); };
  }, [loadPedidos]);

  const updateEstado = async (id: number, nuevoEstado: string) => {
    try {
      await fetch(`/api/pedidos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      loadPedidos();
    } catch {
      // Fallback localStorage
      const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
      const updated = all.map((p: any) => p.id === id ? { ...p, estado: nuevoEstado } : p);
      localStorage.setItem('puerto_habana_pedidos', JSON.stringify(updated));
      loadPedidos();
      window.dispatchEvent(new Event('storage'));
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium text-gray-900 mb-2">Comandas de Cocina</h1>
          <p className="text-sm text-gray-500 uppercase font-medium">{fecha} — EN TIEMPO REAL</p>
        </div>
        <div className="text-right bg-white/70 backdrop-blur-sm px-6 py-3 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-3xl font-bold text-orange-600">{pedidos.length}</p>
          <p className="text-xs text-gray-500 font-medium uppercase mt-1">
            {showHistory ? 'Entregadas' : 'Activas'}
          </p>
        </div>
      </div>

      {/* Toggle historial */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setShowHistory(false)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!showHistory ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Activas
        </button>
        <button onClick={() => setShowHistory(true)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${showHistory ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Historial
        </button>
      </div>

      {pedidos.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
          <UtensilsCrossed size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">
            {showHistory ? 'No hay comandas entregadas' : 'No hay comandas activas'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pedidos.map(p => (
            <div key={p.id} className={`bg-white rounded-2xl border-2 p-5 shadow-sm transition-all ${
              p.estado === 'Pendiente'  ? 'border-orange-200' :
              p.estado === 'Preparando'? 'border-blue-200'   :
              p.estado === 'Listo'     ? 'border-green-200'  : 'border-gray-200'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{p.mesa}</h3>
                  {p.mozo_nombre && <p className="text-xs text-gray-400">Mozo: {p.mozo_nombre}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{p.hora}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    p.estado === 'Pendiente'  ? 'bg-orange-100 text-orange-600' :
                    p.estado === 'Preparando'? 'bg-blue-100 text-blue-600'     :
                    p.estado === 'Listo'     ? 'bg-green-100 text-green-600'   : 'bg-gray-100 text-gray-600'
                  }`}>{p.estado}</span>
                </div>
              </div>

              {/* Items de la comanda */}
              {p.items && p.items.length > 0 && (
                <ul className="space-y-1 mb-4">
                  {p.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="font-bold text-gray-900">{item.cantidad}×</span>
                      <span>{item.nombre}</span>
                      {item.notas && <span className="text-xs text-gray-400 italic">({item.notas})</span>}
                    </li>
                  ))}
                </ul>
              )}

              {p.notas && (
                <p className="text-xs text-gray-500 italic mb-3 bg-gray-50 px-3 py-2 rounded-lg">📝 {p.notas}</p>
              )}

              {!showHistory && (
                <div className="flex gap-2">
                  {p.estado === 'Pendiente' && (
                    <button onClick={() => updateEstado(p.id, 'Preparando')}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                      Preparar
                    </button>
                  )}
                  {p.estado === 'Preparando' && (
                    <button onClick={() => updateEstado(p.id, 'Listo')}
                      className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                      <Check size={16} /> Listo
                    </button>
                  )}
                  {p.estado === 'Listo' && (
                    <button onClick={() => updateEstado(p.id, 'Entregado')}
                      className="flex-1 bg-gray-800 text-white py-2 rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2">
                      <Check size={16} /> Entregado
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
