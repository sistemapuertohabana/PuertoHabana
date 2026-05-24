'use client';
import { useState, useEffect } from 'react';
import { Droplets } from 'lucide-react';

export default function LavaplatoDashboard() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ph_lavaplato_session');
      if (stored) setSession(JSON.parse(stored));
    } catch {}
  }, []);

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header minimalista */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
          <Droplets size={20} className="text-cyan-500" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">Panel de Lavado</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Bienvenido/a, {session?.nombre || 'Lavaplatos'}
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
