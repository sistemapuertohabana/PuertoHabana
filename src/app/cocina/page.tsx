// Cocina — lee comandas desde MySQL API con polling cada 5s
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Check, Clock, UtensilsCrossed, ChefHat } from 'lucide-react';
import NotificacionesToast from '@/components/NotificacionesToast';
import { addToSyncQueue } from '@/components/ServiceWorkerRegister';

interface Pedido {
  id: number;
  mesa: string;
  mozo_id?: string;
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

const estadoColor = {
  Pendiente: 'text-orange-600 bg-orange-50 border-orange-100',
  Preparando: 'text-blue-600 bg-blue-50 border-blue-100',
  Listo: 'text-green-600 bg-green-50 border-green-100',
  Entregado: 'text-gray-400 bg-gray-50 border-gray-100',
} as Record<string, string>;

const estadoBorder = {
  Pendiente: 'border-l-orange-400',
  Preparando: 'border-l-blue-400',
  Listo: 'border-l-green-400',
  Entregado: 'border-l-gray-300',
} as Record<string, string>;

export default function CocinaPage() {
  const [pedidos,     setPedidos]     = useState<Pedido[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [fecha] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString()
      : getLocalDateString()
  );

  // Refrescar sesión desde la API para recoger cambios hechos por el admin (turno, foto, etc.)
  useEffect(() => {
    const loadSession = async () => {
      try {
        const stored = localStorage.getItem('ph_cocina_session');
        if (!stored) return;
        const sess = JSON.parse(stored);
        try {
          const res = await fetch('/api/personal');
          if (res.ok) {
            const personal: any[] = await res.json();
            const updated = personal.find(p => p.id === sess.id && (p.rol === 'cocina' || p.rol === 'ayudante_cocina'));
            if (updated) {
              sess.turno = updated.turno || sess.turno;
              sess.nombre = updated.nombre || sess.nombre;
              sess.foto_url = updated.foto_url || sess.foto_url;
              localStorage.setItem('ph_cocina_session', JSON.stringify(sess));
            }
          }
        } catch {}
      } catch {}
    };
    loadSession();
  }, []);

  const loadPedidos = useCallback(async () => {
    try {
      const url = showHistory
        ? `/api/pedidos?fecha=${fecha}&estado=Entregado&_=${Date.now()}`
        : `/api/pedidos?fecha=${fecha}&_=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data: Pedido[] = await res.json();
      setPedidos(showHistory ? data : data.filter(p => p.estado !== 'Entregado'));
    } catch {
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

      if (nuevoEstado === 'Listo') {
        const comanda = pedidos.find(p => p.id === id);
        if (comanda?.mozo_id) {
          fetch('/api/notificaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              usuario_id: comanda.mozo_id,
              titulo: 'Comanda Lista',
              mensaje: `La orden para ${comanda.mesa} está lista para recoger.`
            })
          }).catch(() => {});
        }
      }

      setTimeout(() => loadPedidos(), 600);
    } catch {
      addToSyncQueue('PATCH', `/api/pedidos/${id}`, { estado: nuevoEstado });
      const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
      const updated = all.map((p: any) => p.id === id ? { ...p, estado: nuevoEstado } : p);
      localStorage.setItem('puerto_habana_pedidos', JSON.stringify(updated));
      loadPedidos();
      window.dispatchEvent(new Event('storage'));
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <NotificacionesToast rol="cocina" />

      {/* Header minimalista */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
          <ChefHat size={20} className="text-orange-500" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">Comandas</h1>
          <p className="text-xs text-gray-400 mt-0.5">{fecha}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-light text-gray-900">{pedidos.length}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">
            {showHistory ? 'Entregadas' : 'Activas'}
          </p>
        </div>
      </div>

      {/* Toggle minimalista */}
      <div className="flex gap-1.5 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
        <button onClick={() => setShowHistory(false)}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            !showHistory ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}>
          Activas
        </button>
        <button onClick={() => setShowHistory(true)}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            showHistory ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}>
          Historial
        </button>
      </div>

      {pedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
            <UtensilsCrossed size={24} className="text-gray-300" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-gray-400 font-light">
            {showHistory ? 'No hay comandas entregadas' : 'No hay comandas activas'}
          </p>
          <p className="text-xs text-gray-300 mt-1">
            {showHistory ? '' : 'Las nuevas comandas aparecerán aquí automáticamente'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pedidos.map(p => (
            <div
              key={p.id}
              className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 border-l-4 transition-all hover:shadow-md ${estadoBorder[p.estado] || 'border-l-gray-200'}`}
            >
              {/* Header de tarjeta */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-sm text-gray-900">{p.mesa}</h3>
                  {p.mozo_nombre && (
                    <p className="text-[11px] text-gray-400 mt-0.5">{p.mozo_nombre}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock size={11} className="text-gray-300" />
                    {p.hora}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${estadoColor[p.estado] || 'text-gray-500 bg-gray-50 border-gray-100'}`}>
                    {p.estado}
                  </span>
                </div>
              </div>

              {/* Items */}
              {p.items && p.items.length > 0 && (
                <ul className="space-y-1 mb-3">
                  {p.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="font-medium text-gray-900 w-6 text-right text-xs">{item.cantidad}×</span>
                      <span>{item.nombre}</span>
                      {item.notas && (
                        <span className="text-[11px] text-gray-400 italic">({item.notas})</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {p.notas && (
                <p className="text-[11px] text-gray-500 italic mb-3 bg-gray-50 px-3 py-1.5 rounded-lg">
                  📝 {p.notas}
                </p>
              )}

              {/* Acciones */}
              {!showHistory && (
                <div className="flex gap-2 mt-2">
                  {p.estado === 'Pendiente' && (
                    <button
                      onClick={() => updateEstado(p.id, 'Preparando')}
                      className="flex-1 text-xs font-medium py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                    >
                      Preparar
                    </button>
                  )}
                  {p.estado === 'Preparando' && (
                    <button
                      onClick={() => updateEstado(p.id, 'Listo')}
                      className="flex-1 text-xs font-medium py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} /> Listo
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
