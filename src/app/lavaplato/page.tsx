'use client';
import { useState, useEffect } from 'react';
import { Droplets, CheckCircle2, Clock } from 'lucide-react';

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
      <h1 className="text-3xl font-medium text-gray-900 mb-2">Panel de Lavado</h1>
      <p className="text-gray-500 mb-8">Bienvenido/a, {session?.nombre || 'Lavaplatos'}. Mantén tu área de trabajo limpia y organizada.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Droplets size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Estado de Área</p>
            <p className="text-xl font-bold text-gray-900">En Servicio</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Vajilla Disponible</p>
            <p className="text-xl font-bold text-gray-900">Óptimo</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Última Limpieza</p>
            <p className="text-xl font-bold text-gray-900">Hace 30 min</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
        <Droplets size={48} className="mx-auto text-blue-200 mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Área de Lavado Lista</h3>
        <p className="text-gray-500">Este es tu panel inicial. Aquí se podrán agregar reportes de merma o inventario de limpieza en el futuro.</p>
      </div>
    </div>
  );
}
