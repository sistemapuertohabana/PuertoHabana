'use client';
import { useState, useEffect } from 'react';
import { Droplets, Sun, Moon } from 'lucide-react';

export default function LavaplatoDashboard() {
  const [session, setSession] = useState<any>(null);

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
      </div>

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
