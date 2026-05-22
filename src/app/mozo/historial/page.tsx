'use client';

import { useState, useEffect } from 'react';
import { getLocalDateString } from '@/hooks/usePedidosRealtime';
import { FileText, CheckCircle2 } from 'lucide-react';

interface Pedido {
  id: number;
  item: string;
  cantidad: number;
  mesa: string;
  estado: string;
  hora: string;
  precio: number;
  fecha: string;
}

export default function MozoHistorialPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [total, setTotal] = useState(0);

  const fecha = typeof window !== 'undefined'
    ? localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString()
    : getLocalDateString();

  const loadPedidos = () => {
    try {
      const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
      const todayPedidos = all.filter((p: Pedido) => p.fecha === fecha);
      setPedidos(todayPedidos);
      setTotal(todayPedidos.reduce((sum: number, p: Pedido) => sum + (p.precio * p.cantidad), 0));
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
  }, [fecha]);

  const updateEstado = (id: number, nuevoEstado: string) => {
    try {
      const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
      const updated = all.map((p: Pedido) => p.id === id ? { ...p, estado: nuevoEstado } : p);
      localStorage.setItem('puerto_habana_pedidos', JSON.stringify(updated));
      loadPedidos();
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Pedidos</h1>
          <p className="text-sm text-gray-500 mt-1">{fecha}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 uppercase font-semibold">Total del Día</p>
          <p className="text-2xl font-bold text-blue-600">S/ {total.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {pedidos.length === 0 ? (
          <div className="mt-16 text-center border-2 border-dashed border-gray-200 py-16 rounded-2xl bg-white">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-sm tracking-widest text-gray-500 uppercase font-medium">Sin pedidos registrados hoy</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-lg text-gray-900">{p.mesa}</span>
                    <span className="text-sm text-gray-400">{p.hora}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      p.estado === 'Pendiente' ? 'bg-orange-100 text-orange-600' :
                      p.estado === 'Preparando' ? 'bg-blue-100 text-blue-600' :
                      p.estado === 'Listo' ? 'bg-green-100 text-green-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {p.estado}
                    </span>
                  </div>
                  <p className="text-gray-700 font-medium">{p.cantidad}x {p.item}</p>
                  <p className="text-sm text-gray-500 mt-1">S/ {(p.precio * p.cantidad).toFixed(2)}</p>
                </div>
                
                {p.estado === 'Listo' && (
                  <button 
                    onClick={() => updateEstado(p.id, 'Entregado')}
                    className="w-full md:w-auto bg-black text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                  >
                    <CheckCircle2 size={18} /> Marcar Entregado
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
