'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, X, Loader2, CheckCircle, Trash2, User } from 'lucide-react';

interface Tarea {
  id: number;
  titulo: string;
  descripcion?: string;
  asignado_a: string;
  creado_por?: string;
  estado: 'pendiente' | 'completada';
  fecha_limite?: string;
  completada_en?: string;
  created_at: string;
  asignado?: { nombre: string };
  creador?: { nombre: string };
}

interface Personal {
  id: string;
  nombre: string;
  rol: string;
}

export default function AdminTareasPage() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [lavaplatos, setLavaplatos] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ titulo: '', descripcion: '', asignado_a: '', fecha_limite: '' });
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tareasRes, personalRes] = await Promise.all([
        fetch('/api/tareas'),
        fetch('/api/personal'),
      ]);

      if (tareasRes.ok) setTareas(await tareasRes.json());
      if (personalRes.ok) {
        const data: Personal[] = await personalRes.json();
        setLavaplatos(data.filter(p => p.rol === 'lavaplato'));
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.asignado_a) {
      setError('Título y asignado son requeridos');
      return;
    }
    setError('');

    try {
      const sess = JSON.parse(localStorage.getItem('ph_admin_session') || '{}');
      const res = await fetch('/api/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: formData.titulo.trim(),
          descripcion: formData.descripcion.trim() || undefined,
          asignado_a: formData.asignado_a,
          creado_por: sess.id || null,
          fecha_limite: formData.fecha_limite || undefined,
        }),
      });

      if (res.ok) {
        setFormData({ titulo: '', descripcion: '', asignado_a: '', fecha_limite: '' });
        setShowForm(false);
        loadData();
      } else {
        const err = await res.json();
        setError(err.error || 'Error al crear tarea');
      }
    } catch {
      setError('Error de conexión');
    }
  };

  const handleCompletar = async (id: number) => {
    try {
      await fetch(`/api/tareas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'completada' }),
      });
      loadData();
    } catch {}
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await fetch(`/api/tareas/${id}`, { method: 'DELETE' });
      loadData();
    } catch {}
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium text-gray-900">Tareas de Lavaplatos</h1>
          <p className="text-sm text-gray-500 mt-1">Crea y asigna tareas al personal de lavandería.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="bg-cyan-600 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2 w-full md:w-auto">
            <Plus size={18} /> Nueva Tarea
          </button>
        )}
      </div>

      {/* Formulario nueva tarea */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Nueva Tarea</h2>
            <button onClick={() => { setShowForm(false); setError(''); }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Título *</label>
              <input type="text" value={formData.titulo}
                onChange={e => setFormData(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ej: Lavar ollas grandes"
                className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
              <textarea value={formData.descripcion}
                onChange={e => setFormData(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Detalles de la tarea..."
                rows={3}
                className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Asignar a *</label>
                <select value={formData.asignado_a}
                  onChange={e => setFormData(f => ({ ...f, asignado_a: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-white text-gray-900">
                  <option value="">Seleccionar lavaplatos</option>
                  {lavaplatos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha límite</label>
                <input type="date" value={formData.fecha_limite}
                  onChange={e => setFormData(f => ({ ...f, fecha_limite: e.target.value }))}
                  className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setError(''); }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button type="submit"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-cyan-600 rounded-xl hover:bg-cyan-700 transition-colors">
                Crear Tarea
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listado de tareas */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="space-y-3">
          {tareas.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
              <ClipboardList size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-gray-600">No hay tareas registradas</p>
              <p className="text-sm text-gray-400 mt-1">Crea la primera tarea para el lavaplatos.</p>
            </div>
          ) : (
            tareas.map(tarea => {
              const pendiente = tarea.estado === 'pendiente';
              return (
                <div key={tarea.id}
                  className={`bg-white border rounded-xl p-5 transition-all ${
                    pendiente ? 'border-gray-200 hover:shadow-sm' : 'border-green-200 bg-green-50/30'
                  }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-base font-semibold ${pendiente ? 'text-gray-900' : 'text-green-700 line-through'}`}>
                          {tarea.titulo}
                        </h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          pendiente
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {pendiente ? 'Pendiente' : 'Completada'}
                        </span>
                      </div>
                      {tarea.descripcion && (
                        <p className="text-sm text-gray-500 mt-1">{tarea.descripcion}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {tarea.asignado?.nombre || 'Sin asignar'}
                        </span>
                        {tarea.fecha_limite && (
                          <span>📅 {tarea.fecha_limite}</span>
                        )}
                        {tarea.completada_en && (
                          <span>✅ {new Date(tarea.completada_en).toLocaleDateString('es-PE', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {pendiente && (
                        <button onClick={() => handleCompletar(tarea.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Marcar completada">
                          <CheckCircle size={20} />
                        </button>
                      )}
                      <button onClick={() => handleEliminar(tarea.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar tarea">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
