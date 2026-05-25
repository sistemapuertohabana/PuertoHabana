'use client';

import { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2, Plus, Loader2 } from 'lucide-react';

interface Gasto {
  id: string;
  descripcion: string;
  categoria: string;
  monto: number;
  fecha: string;
}

const categorias = ['Insumos', 'Servicios', 'Mantenimiento', 'Personal', 'Equipos', 'Otros'];

const emptyForm = {
  descripcion: '',
  categoria: 'Insumos',
  monto: 0,
  fecha: new Date().toISOString().split('T')[0],
};

export default function GastosPage() {
  const [gastos,      setGastos]      = useState<Gasto[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editingGasto,setEditingGasto]= useState<Gasto | null>(null);
  const [isSaving,    setIsSaving]    = useState(false);
  const [formData,    setFormData]    = useState(emptyForm);

  const loadGastos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gastos');
      if (res.ok) {
        setGastos(await res.json());
      } else throw new Error();
    } catch {
      try {
        setGastos(JSON.parse(localStorage.getItem('ph_gastos') || '[]'));
      } catch { setGastos([]); }
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadGastos(); }, [loadGastos]);

  const handleAdd = () => {
    setEditingGasto(null);
    setFormData({ ...emptyForm, fecha: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const handleEdit = (g: Gasto) => {
    setEditingGasto(g);
    setFormData({ descripcion: g.descripcion, categoria: g.categoria, monto: g.monto, fecha: g.fecha });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descripcion || !formData.monto) return;
    setIsSaving(true);

    try {
      if (editingGasto) {
        const res = await fetch(`/api/gastos/${editingGasto.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch('/api/gastos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error();
      }
      await loadGastos();
    } catch {
      // Fallback localStorage
      const current: Gasto[] = JSON.parse(localStorage.getItem('ph_gastos') || '[]');
      if (editingGasto) {
        const updated = current.map(g => g.id === editingGasto.id ? { ...g, ...formData } : g);
        localStorage.setItem('ph_gastos', JSON.stringify(updated));
        setGastos(updated);
      } else {
        const newG = { ...formData, id: String(Date.now()) };
        const updated = [newG, ...current];
        localStorage.setItem('ph_gastos', JSON.stringify(updated));
        setGastos(updated);
      }
    }

    setIsSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    try {
      const res = await fetch(`/api/gastos/${id}`, { method: 'DELETE' });
      if (res.ok) { await loadGastos(); return; }
      throw new Error();
    } catch {
      const current: Gasto[] = JSON.parse(localStorage.getItem('ph_gastos') || '[]');
      const updated = current.filter(g => g.id !== id);
      localStorage.setItem('ph_gastos', JSON.stringify(updated));
      setGastos(updated);
    }
  };

  const total = gastos.reduce((s, g) => s + Number(g.monto), 0);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium text-gray-900">Gastos</h1>
          <p className="text-sm text-gray-500 mt-1">Registro de gastos del negocio.</p>
        </div>
        <button onClick={handleAdd}
          className="bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 w-full md:w-auto">
          <Plus size={18} /> Agregar Gasto
        </button>
      </div>

      {/* Resumen */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500 font-medium">Total Gastos</p>
        <p className="text-2xl font-bold text-gray-900">S/ {Number(total).toFixed(2)}</p>
      </div>

      {loading && <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-gray-300" /></div>}

      {!loading && (
        <>
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Descripción', 'Categoría', 'Monto', 'Fecha', 'Acciones'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gastos.map(g => (
                  <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-900">{g.descripcion}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">{g.categoria}</span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-red-600">S/ {Number(g.monto).toFixed(2)}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{g.fecha}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(g)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={15} /></button>
                        <button onClick={() => handleDelete(g.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {gastos.map(g => (
              <div key={g.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-semibold text-gray-900">{g.descripcion}</p>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(g)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(g.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{g.categoria}</span>
                  <span className="text-sm font-bold text-red-600">S/ {Number(g.monto).toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{g.fecha}</p>
              </div>
            ))}
          </div>

          {gastos.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
              <p className="font-medium text-gray-600">No hay gastos registrados</p>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">{editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">✕</button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción *</label>
                <input type="text" required value={formData.descripcion}
                  onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                <select value={formData.categoria}
                  onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white">
                  {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Monto (S/) *</label>
                <input type="text" inputMode="decimal" required value={formData.monto === 0 ? '' : formData.monto}
                  onChange={e => setFormData({ ...formData, monto: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
                <input type="date" value={formData.fecha}
                  onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isSaving}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 size={15} className="animate-spin" /> : 'Guardar'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
