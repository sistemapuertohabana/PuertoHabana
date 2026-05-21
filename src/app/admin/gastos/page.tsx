'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import { subscribeGastos, addGasto, updateGasto, deleteGasto } from '@/lib/db';

interface Gasto {
  id: string;
  descripcion: string;
  categoria: string;
  monto: number;
  fecha: string;
  createdAt?: number;
}

const categorias = ['Insumos', 'Servicios', 'Mantenimiento', 'Personal', 'Equipos', 'Otros'];

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    descripcion: '',
    categoria: 'Insumos',
    monto: 0,
    fecha: new Date().toISOString().split('T')[0],
  });

  // Suscripción en tiempo real a Firebase
  useEffect(() => {
    const unsub = subscribeGastos((data: Gasto[]) => {
      setGastos(data.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAdd = () => {
    setEditingGasto(null);
    setFormData({ descripcion: '', categoria: 'Insumos', monto: 0, fecha: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const handleEdit = (g: Gasto) => {
    setEditingGasto(g);
    setFormData({ descripcion: g.descripcion, categoria: g.categoria, monto: g.monto, fecha: g.fecha });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    await deleteGasto(id);
  };

  const handleSave = async () => {
    if (!formData.descripcion.trim()) return;
    setIsSaving(true);
    try {
      if (editingGasto) {
        await updateGasto(editingGasto.id, formData);
      } else {
        await addGasto(formData);
      }
      setShowModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

  const gastosPorCategoria = gastos.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + g.monto;
    return acc;
  }, {} as Record<string, number>);

  const topCategorias = Object.entries(gastosPorCategoria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-medium text-gray-900">Gestión de Gastos</h1>
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors w-full md:w-auto"
        >
          <Plus size={16} />
          Agregar Gasto
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Gastos</p>
          <p className="text-3xl font-bold text-red-600 mt-1">S/ {totalGastos.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{gastos.length} registros</p>
        </div>
        {topCategorias.map(([cat, monto]) => (
          <div key={cat} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{cat}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">S/ {monto.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {((monto / totalGastos) * 100).toFixed(0)}% del total
            </p>
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-gray-300" />
        </div>
      )}

      {/* Desktop table */}
      {!loading && (
        <>
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-xs text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th className="text-left px-5 py-3 font-medium text-xs text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="text-left px-5 py-3 font-medium text-xs text-gray-500 uppercase tracking-wider">Monto</th>
                  <th className="text-left px-5 py-3 font-medium text-xs text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gastos.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{g.descripcion}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">{g.categoria}</span>
                    </td>
                    <td className="px-5 py-3.5 text-red-600 font-semibold">S/ {g.monto.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-gray-500">{g.fecha}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(g)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => handleDelete(g.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {gastos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                      No hay gastos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {gastos.map((g) => (
              <div key={g.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{g.descripcion}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{g.fecha}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(g)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(g.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">{g.categoria}</span>
                  <span className="text-sm font-bold text-red-600">S/ {g.monto.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {gastos.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                No hay gastos registrados
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-300">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Ej. Compra de limones"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                >
                  {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Monto (S/)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
