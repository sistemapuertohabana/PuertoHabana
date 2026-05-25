'use client';
import { useState, useEffect } from 'react';
import { Droplets, Sun, Moon, Clock, CheckCircle } from 'lucide-react';

export default function LavaplatoDashboard() {
  const [session, setSession] = useState<any>(null);
  const [asistencia, setAsistencia] = useState<{ id: number; hora_llegada: string } | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [historialAsistencia, setHistorialAsistencia] = useState<{ fecha: string; hora_llegada: string }[]>([]);
  const [showHistorialAsist, setShowHistorialAsist] = useState(false);
  const [errorAsistencia, setErrorAsistencia] = useState('');

  useEffect(() => {
    const loadSession = async () => {
      try {
        const stored = localStorage.getItem('ph_lavaplato_session');
        if (!stored) return;
        const sess = JSON.parse(stored);
        
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
  }, []);

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

      {/* Área de lavado */}
      <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm text-center">
        <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mx-auto mb-4">
          <Droplets size={22} className="text-cyan-300" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">Área de Lavado Lista</h3>
        <p className="text-xs text-gray-400 font-light">
          Este es tu panel inicial. Aquí se podrán agregar reportes de merma o inventario de limpieza en el futuro.
        </p>
      </div>
    </div>
  );
}
