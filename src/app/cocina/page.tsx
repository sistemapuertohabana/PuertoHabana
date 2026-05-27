// Cocina — lee comandas desde MySQL API con polling cada 5s
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Check, Clock, UtensilsCrossed, ChefHat, CheckCircle } from 'lucide-react';
import { addToSyncQueue } from '@/components/ServiceWorkerRegister';
import NotificacionesToast from '@/components/NotificacionesToast';

interface Pedido {
  id: number;
  mesa: string;
  mozo_id?: string;
  mozo_nombre?: string;
  estado: string;
  hora: string;
  fecha: string;
  notas?: string;
  items?: { nombre: string; cantidad: number; notas?: string; categoria?: string }[];
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
  const [asistencia, setAsistencia] = useState<{ id: number; hora_llegada: string } | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [cocinaSession, setCocinaSession] = useState<{ id?: string; nombre?: string; turno?: string }>({});
  const [historialAsistencia, setHistorialAsistencia] = useState<{ fecha: string; hora_llegada: string }[]>([]);
  const [showHistorialAsist, setShowHistorialAsist] = useState(false);
  const [errorAsistencia, setErrorAsistencia] = useState('');
  const [fecha] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString()
      : getLocalDateString()
  );

  // Sincronizar turnos config desde Supabase a localStorage
  const syncTurnosConfig = async () => {
    try {
      const res = await fetch('/api/configuracion?clave=turnos_config');
      if (res.ok) {
        const { valor } = await res.json();
        if (valor) {
          localStorage.setItem('ph_turnos_config', JSON.stringify(valor));
        }
      }
    } catch {}
  };

  // Refrescar sesión desde la API para recoger cambios hechos por el admin (turno, foto, etc.)
  useEffect(() => {
    const loadSession = async () => {
      try {
        const stored = localStorage.getItem('ph_cocina_session');
        if (!stored) return;
        const sess = JSON.parse(stored);
        setCocinaSession(sess);
        
        // Sincronizar config de turnos desde Supabase
        await syncTurnosConfig();
        
        // Verificar asistencia de hoy
        const hoy = new Date();
        const fechaStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
        fetch(`/api/asistencia?usuario_id=${sess.id}&fecha=${fechaStr}`)
          .then(res => res.ok ? res.json() : [])
          .then(data => {
            if (data.length > 0) {
              setAsistencia({ id: data[0].id, hora_llegada: data[0].hora_llegada });
            }
          })
          .catch(() => {});
        
        // Cargar historial de asistencias
        fetch(`/api/asistencia?usuario_id=${sess.id}`)
          .then(res => res.ok ? res.json() : [])
          .then(data => {
            if (data.length > 0) {
              setHistorialAsistencia(data.slice(0, 10));
            }
          })
          .catch(() => {});
        
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
              setCocinaSession({ ...sess });
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
    // Sincronizar config de turnos cada 30s para reflejar cambios del admin sin recargar
    const configInterval = setInterval(syncTurnosConfig, 30000);
    window.addEventListener('storage', loadPedidos);
    return () => { clearInterval(interval); clearInterval(configInterval); window.removeEventListener('storage', loadPedidos); };
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
      {/* Header minimalista */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
          <ChefHat size={20} className="text-orange-500" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">Comandas</h1>
          <p className="text-xs text-gray-400 mt-0.5">{fecha}</p>
        </div>
        {/* Asistencia */}
        {cocinaSession.id ? (
          asistencia ? (
            <div
              onClick={() => setShowHistorialAsist(!showHistorialAsist)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-100 text-green-700 text-xs font-medium cursor-pointer hover:bg-green-100 transition-colors"
            >
              <CheckCircle size={14} />
              {asistencia.hora_llegada.slice(0, 5)}
            </div>
          ) : (
            <button
              onClick={async () => {
                if (!cocinaSession.id || registrando) return;
                setErrorAsistencia('');
                
                // Validar si hoy es día laboral
                const turno = cocinaSession.turno;
                if (turno) {
                  try {
                    const raw = localStorage.getItem('ph_turnos_config');
                    if (raw) {
                      const config = JSON.parse(raw);
                      const diasSemana = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const;
                      type DiaSemana = typeof diasSemana[number];
                      const diasLabels: Record<DiaSemana, string> = {
                        dom: 'Domingo', lun: 'Lunes', mar: 'Martes', mie: 'Miércoles',
                        jue: 'Jueves', vie: 'Viernes', sab: 'Sábado',
                      };
                      const diaHoy = diasSemana[new Date().getDay()];
                      const horarioHoy = config[turno as 'mañana' | 'noche']?.[diaHoy];
                      if (!horarioHoy) {
                        setErrorAsistencia(`Hoy (${diasLabels[diaHoy]}) es descanso para tu turno. No puedes registrar asistencia.`);
                        setTimeout(() => setErrorAsistencia(''), 5000);
                        return;
                      }
                    }
                  } catch {}
                }
                
                setRegistrando(true);
                try {
                  const res = await fetch('/api/asistencia', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario_id: cocinaSession.id }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setAsistencia({ id: data.data.id, hora_llegada: data.data.hora_llegada });
                  } else if (res.status === 409) {
                    setErrorAsistencia('Ya registraste tu asistencia hoy');
                    setTimeout(() => setErrorAsistencia(''), 3000);
                  }
                } catch {}
                setRegistrando(false);
              }}
              disabled={registrando}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100 text-orange-600 hover:bg-orange-100 transition-colors text-xs font-medium disabled:opacity-50"
            >
              <Clock size={14} />
              {registrando ? '...' : 'Asistencia'}
            </button>
          )
        ) : null}
        <div className="text-right">
          <p className="text-2xl font-light text-gray-900">{pedidos.length}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">
            {showHistory ? 'Entregadas' : 'Activas'}
          </p>
        </div>
      </div>

      {errorAsistencia && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs font-medium text-red-700">{errorAsistencia}</p>
        </div>
      )}

      {/* Historial de asistencias */}
      {historialAsistencia.length > 0 && showHistorialAsist && (
        <div className="mb-6 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock size={13} />
            Historial de Asistencias
          </h3>
          <div className="space-y-1.5">
            {historialAsistencia.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-gray-50">
                <span className="text-gray-500">{a.fecha}</span>
                <span className="font-medium text-gray-700">{a.hora_llegada.slice(0, 5)} hrs</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Header de tarjeta */}
              <div className="flex items-start justify-between mb-4 border-b border-gray-50 pb-3">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-gray-900">{p.mesa}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={12} /> {p.hora}
                    </span>
                  </div>
                  {p.mozo_nombre && (
                    <p className="text-xs text-gray-400 mt-0.5">Mozo: {p.mozo_nombre}</p>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  p.estado === 'Pendiente'  ? 'bg-orange-100 text-orange-600' :
                  p.estado === 'Preparando'? 'bg-blue-100 text-blue-600'     :
                  p.estado === 'Listo'     ? 'bg-green-100 text-green-600'   :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {p.estado}
                </span>
              </div>

              {/* Items — solo mostrar comida */}
              {p.items && p.items.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {p.items
                    .filter(item => item.categoria === 'comida' || item.categoria === undefined)
                    .map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-800 bg-gray-50/50 p-2 rounded-lg">
                      <span className="font-black text-gray-900 text-base min-w-[1.5rem]">{item.cantidad}×</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 flex flex-wrap items-center gap-1.5">
                          {item.nombre.startsWith('🎁') ? (
                            <>
                              <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm border border-amber-200">
                                🎁 Cortesía
                              </span>
                              <span className="text-amber-900">{item.nombre.replace(/^🎁\s*/, '')}</span>
                            </>
                          ) : (
                            <span>{item.nombre}</span>
                          )}
                        </div>
                        {item.notas && (
                          <p className="text-xs text-gray-500 italic mt-1 opacity-90 border-l-2 border-gray-300 pl-2">
                            * {item.notas}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {p.notas && (
                <p className="text-xs text-gray-600 italic mb-4 bg-yellow-50/50 border border-yellow-100 px-3 py-2 rounded-xl">
                  📝 {p.notas}
                </p>
              )}

              {/* Acciones */}
              {!showHistory && (
                <div className="flex gap-2 pt-2">
                  {p.estado === 'Pendiente' && (
                    <button
                      onClick={() => updateEstado(p.id, 'Preparando')}
                      className="flex-1 text-sm font-bold py-3 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                    >
                      Empezar a Preparar
                    </button>
                  )}
                  {p.estado === 'Preparando' && (
                    <button
                      onClick={() => updateEstado(p.id, 'Listo')}
                      className="flex-1 text-sm font-bold py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
                    >
                      <Check size={16} /> Listo para Entregar
                    </button>
                  )}
                </div>
              )}
            </div>
          )          )}
        </div>
      )}

      <NotificacionesToast rol="cocina" />
    </div>
  );
}
