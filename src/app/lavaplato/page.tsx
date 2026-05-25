'use client';
import { useState, useEffect } from 'react';
import { Droplets, Sun, Moon, Clock, CheckCircle, ClipboardList, Loader2 } from 'lucide-react';

export default function LavaplatoDashboard() {
  const [session, setSession] = useState<any>(null);
  const [asistencia, setAsistencia] = useState<{ id: number; hora_llegada: string } | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [historialAsistencia, setHistorialAsistencia] = useState<{ fecha: string; hora_llegada: string }[]>([]);
  const [showHistorialAsist, setShowHistorialAsist] = useState(false);
  const [errorAsistencia, setErrorAsistencia] = useState('');
  const [tareas, setTareas] = useState<any[]>([]);
  const [cargandoTareas, setCargandoTareas] = useState(true);

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

  useEffect(() => {
    const loadSession = async () => {
      try {
        const stored = localStorage.getItem('ph_lavaplato_session');
        if (!stored) return;
        const sess = JSON.parse(stored);
        
        // Sincronizar config de turnos desde Supabase
        await syncTurnosConfig();
        
        // Refrescar turno desde la API para recoger cambios hechos por el admin
        try {
          const res = await fetch('/api/personal');
          if (res.ok) {
            const personal: any[] = await res.json();
            const updated = personal.find(p => p.id === sess.id && p.rol === 'lavaplato');
            if (updated) {
              sess.turno = updated.turno || sess.turno;
              sess.nombre = updated.nombre || sess.nombre;
              sess.foto_url = updated.foto_url || sess.foto_url;
              localStorage.setItem('ph_lavaplato_session', JSON.stringify(sess));
            }
          }
        } catch {}
        
        setSession(sess);
        
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
      } catch {}
    };
    
    loadSession();
    
    // Sincronizar config de turnos cada 30s para reflejar cambios del admin sin recargar
    const configInterval = setInterval(syncTurnosConfig, 30000);
    return () => clearInterval(configInterval);
  }, []);

  // Cargar tareas asignadas
  useEffect(() => {
    const cargarTareas = async () => {
      const session = JSON.parse(localStorage.getItem('ph_lavaplato_session') || '{}');
      if (!session.id) { setCargandoTareas(false); return; }
      try {
        const res = await fetch(`/api/tareas?asignado_a=${session.id}`);
        if (res.ok) setTareas(await res.json());
      } catch {}
      setCargandoTareas(false);
    };
    cargarTareas();
  }, []);

  const handleCompletarTarea = async (id: number) => {
    try {
      const res = await fetch(`/api/tareas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'completada' }),
      });
      if (res.ok) {
        setTareas(prev => prev.map(t => t.id === id ? { ...t, estado: 'completada', completada_en: new Date().toISOString() } : t));
      }
    } catch {}
  };

  const turnoLabel = session?.turno === 'mañana' ? 'Mañana' : session?.turno === 'noche' ? 'Noche' : null;
  const turnoColors = session?.turno === 'mañana' 
    ? 'bg-amber-50 border-amber-100 text-amber-700' 
    : 'bg-indigo-50 border-indigo-100 text-indigo-700';

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header minimalista */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
          <Droplets size={20} className="text-cyan-500" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium text-gray-900 tracking-tight">Panel de Lavado</h1>
            {turnoLabel && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-medium rounded-full border ${turnoColors}`}>
                {session?.turno === 'mañana' ? <Sun size={11} /> : <Moon size={11} />}
                {turnoLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Bienvenido/a, {session?.nombre || 'Lavaplatos'}
            {!turnoLabel && <span className="text-gray-300 ml-1">· Sin turno asignado</span>}
          </p>
        </div>
        {/* Asistencia */}
        {session?.id ? (
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
                if (!session.id || registrando) return;
                setErrorAsistencia('');
                
                // Validar si hoy es día laboral
                const turno = session.turno;
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
                    body: JSON.stringify({ usuario_id: session.id }),
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 hover:bg-cyan-100 transition-colors text-xs font-medium disabled:opacity-50"
            >
              <Clock size={14} />
              {registrando ? '...' : 'Asistencia'}
            </button>
          )
        ) : null}
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

      {/* Stats cards minimalistas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <Droplets size={16} className="text-blue-500" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Estado</p>
              <p className="text-sm font-medium text-gray-900">En Servicio</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
              <div className="w-4 h-4 rounded-full bg-green-500" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Vajilla</p>
              <p className="text-sm font-medium text-gray-900">Óptimo</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
              <Droplets size={16} className="text-orange-500" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Limpieza</p>
              <p className="text-sm font-medium text-gray-900">Hace 30 min</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tareas pendientes ────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center">
            <ClipboardList size={18} className="text-cyan-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Mis Tareas</h3>
            <p className="text-xs text-gray-400">{tareas.filter(t => t.estado === 'pendiente').length} pendientes</p>
          </div>
        </div>

        {cargandoTareas ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-gray-300" />
          </div>
        ) : tareas.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <ClipboardList size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-500">No tienes tareas asignadas</p>
            <p className="text-xs text-gray-400 mt-0.5">El admin te asignará tareas desde su panel.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tareas.map(tarea => {
              const pendiente = tarea.estado === 'pendiente';
              return (
                <div key={tarea.id}
                  className={`bg-white border rounded-xl p-4 transition-all ${
                    pendiente ? 'border-gray-200 hover:shadow-sm' : 'border-green-200 bg-green-50/40'
                  }`}>
                  <div className="flex items-start gap-3">
                    {pendiente ? (
                      <button
                        onClick={() => handleCompletarTarea(tarea.id)}
                        className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5 hover:border-green-500 hover:bg-green-50 transition-colors shrink-0 flex items-center justify-center"
                        title="Marcar completada"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-green-500 mt-0.5 shrink-0 flex items-center justify-center">
                        <CheckCircle size={12} className="text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-semibold ${pendiente ? 'text-gray-900' : 'text-green-700 line-through'}`}>
                        {tarea.titulo}
                      </h4>
                      {tarea.descripcion && (
                        <p className="text-xs text-gray-500 mt-1">{tarea.descripcion}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        {tarea.fecha_limite && (
                          <span className="text-[10px] text-gray-400">📅 {tarea.fecha_limite}</span>
                        )}
                        {tarea.completada_en && (
                          <span className="text-[10px] text-green-500">
                            ✅ {new Date(tarea.completada_en).toLocaleDateString('es-PE', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
