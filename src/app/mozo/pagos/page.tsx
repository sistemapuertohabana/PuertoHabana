'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Calendar, Bell, BellOff, CheckCheck, Loader2 } from 'lucide-react';

interface Pago {
  id: string | number;
  nombre: string;
  monto: number;
  concepto: string;
  fecha: string;
  created_at: string;
}

interface Notificacion {
  id: string | number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

export default function PagosMozoPage() {
  const [pagos,   setPagos]   = useState<Pago[]>([]);
  const [notifs,  setNotifs]  = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [tab,     setTab]     = useState<'pagos' | 'notificaciones'>('pagos');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ph_mozo_session');
      if (stored) setSession(JSON.parse(stored));
    } catch {}
  }, []);

  const fetchPagos = useCallback(async () => {
    if (!session?.nombre) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/pagos-personal?nombre=${encodeURIComponent(session.nombre)}`);
      if (res.ok) setPagos(await res.json());
    } catch {}
    setLoading(false);
  }, [session]);

  const fetchNotifs = useCallback(async () => {
    if (!session) return;
    try {
      // Notificaciones para mozo específico o para el rol mozo en general
      const params = new URLSearchParams({ rol_destino: 'mozo' });
      if (session.id) params.append('usuario_id', session.id);
      const res = await fetch(`/api/notificaciones?${params}`);
      if (res.ok) setNotifs(await res.json());
    } catch {}
  }, [session]);

  useEffect(() => {
    if (session) { fetchPagos(); fetchNotifs(); }
  }, [session, fetchPagos, fetchNotifs]);

  const marcarLeida = async (id: string | number) => {
    try {
      await fetch('/api/notificaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    } catch {}
  };

  const marcarTodasLeidas = async () => {
    const noLeidas = notifs.filter(n => !n.leida);
    await Promise.all(noLeidas.map(n => marcarLeida(n.id)));
  };

  const totalRecibido = pagos.reduce((s, p) => s + Number(p.monto), 0);
  const noLeidas = notifs.filter(n => !n.leida).length;

  return (
    <div className="animate-in fade-in duration-300 max-w-2xl mx-auto pb-24 lg:pb-8">
      <div className="mb-6">
        <h1 className="text-3xl font-medium text-gray-900">Mis Pagos</h1>
        <p className="text-gray-500 mt-1 text-sm">Historial de pagos y mensajes del administrador.</p>
      </div>

      {/* Resumen */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 mb-6">
        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
          <DollarSign size={22} />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Recibido</p>
          <p className="text-2xl font-bold text-gray-900">S/ {totalRecibido.toFixed(2)}</p>
        </div>
        {noLeidas > 0 && (
          <div className="ml-auto flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs font-semibold">
            <Bell size={13} />
            {noLeidas} nuevo{noLeidas > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
        <button onClick={() => setTab('pagos')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'pagos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Pagos
        </button>
        <button onClick={() => setTab('notificaciones')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${tab === 'notificaciones' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Mensajes
          {noLeidas > 0 && <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{noLeidas}</span>}
        </button>
      </div>

      {/* Tab: Pagos */}
      {tab === 'pagos' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
          ) : pagos.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-500 text-sm">Aún no tienes pagos registrados.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-xs">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagos.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                        <Calendar size={13} />
                        {p.fecha || new Date(p.created_at).toLocaleDateString('es-PE')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{p.concepto}</td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">
                      S/ {Number(p.monto).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Notificaciones */}
      {tab === 'notificaciones' && (
        <div className="space-y-3">
          {notifs.length > 0 && noLeidas > 0 && (
            <button onClick={marcarTodasLeidas}
              className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium ml-auto">
              <CheckCheck size={14} /> Marcar todas como leídas
            </button>
          )}
          {notifs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <BellOff size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-500 text-sm">No tienes mensajes del administrador.</p>
            </div>
          ) : (
            notifs.map(n => (
              <div key={n.id}
                className={`bg-white rounded-2xl border p-4 transition-all ${n.leida ? 'border-gray-100 opacity-70' : 'border-blue-200 shadow-sm'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.leida ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                      <Bell size={15} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${n.leida ? 'text-gray-500' : 'text-gray-900'}`}>{n.titulo}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{n.mensaje}</p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {new Date(n.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {!n.leida && (
                    <button onClick={() => marcarLeida(n.id)}
                      className="shrink-0 text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                      Leído
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
