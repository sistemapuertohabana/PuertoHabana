// Minimalistic Cocina Page with History Toggle
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Check, Clock, UtensilsCrossed } from 'lucide-react';

interface Pedido {
  id: number;
  item: string;
  cantidad: number;
  mesa: string;
  estado: string;
  hora: string;
  notas?: string;
  fecha: string;
  mozoNombre?: string;
}

function getLocalDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CocinaPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [fecha, setFecha] = useState(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString()
      : getLocalDateString();
  });

  const loadPedidos = () => {
    try {
      const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
      if (showHistory) {
        // Show only delivered (historical) orders
        setPedidos(all.filter((p: Pedido) => p.estado === 'Entregado'));
      } else {
        // Show active orders for current date
        setPedidos(all.filter((p: Pedido) => p.fecha === fecha && p.estado !== 'Entregado'));
      }
    } catch {
      setPedidos([]);
    }
  };

  useEffect(() => {
    loadPedidos();
    const interval = setInterval(loadPedidos, 2000);
    window.addEventListener('storage', loadPedidos);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadPedidos);
    };
  }, [fecha, showHistory]);

  const updateEstado = (id: number, nuevoEstado: string) => {
    try {
      const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
      const updated = all.map((p: Pedido) => (p.id === id ? { ...p, estado: nuevoEstado } : p));
      localStorage.setItem('puerto_habana_pedidos', JSON.stringify(updated));
      loadPedidos();
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
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
          <p className="text-xs text-gray-500 font-medium uppercase mt-1">Activas</p>
        </div>
      </div>

      {pedidos.length === 0 ? (
        <div className="mt-8 text-center border-2 border-dashed border-gray-200 py-24 rounded-2xl bg-gray-50">
          <UtensilsCrossed size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm tracking-widest text-gray-500 uppercase font-medium">Sin órdenes activas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pedidos.map(p => (
            <div
              key={p.id}
              className={`p-6 rounded-2xl border bg-white shadow-sm transition-all ${
                p.estado === 'Pendiente'
                  ? 'border-orange-200 hover:border-orange-300'
                  : 'border-blue-200 hover:border-blue-300'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{p.mesa}</h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-medium">
                    <Clock size={12} /> {p.hora} • {p.mozoNombre || 'Mozo'}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    p.estado === 'Pendiente'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {p.estado}
                </span>
              </div>

              <div className="py-4 border-t border-b border-gray-100 my-4">
                <p className="text-base font-medium flex justify-between items-center text-gray-900">
                  <span>
                    <span className="text-gray-400 font-bold mr-2">{p.cantidad}x</span> {p.item}
                  </span>
                </p>
                {p.notas && (
                  <p className="text-sm text-amber-700 mt-3 bg-amber-50 p-3 rounded-lg border border-amber-100 font-medium">
                    📝 {p.notas}
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                {p.estado === 'Pendiente' && (
                  <button
                    onClick={() => updateEstado(p.id, 'Preparando')}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors"
                  >
                    Preparar
                  </button>
                )}
                {(p.estado === 'Pendiente' || p.estado === 'Preparando') && (
                  <button
                    onClick={() => updateEstado(p.id, 'Entregado')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> Entregado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
