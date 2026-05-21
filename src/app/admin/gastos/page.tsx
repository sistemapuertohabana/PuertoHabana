'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { fetchGastos, upsertGasto, deleteGasto } from '@/lib/db/admin';

interface Gasto {
  id: number;
  descripcion: string;
  categoria: string;
  monto: number;
  fecha: string;
}

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [formData, setFormData] = useState({
    descripcion: '',
    categoria: '',
    monto: 0,
    fecha: new Date().toISOString().split('T')[0],
  });

  const load = async () => {
    const data = await fetchGastos();
    setGastos(data.map((g) => ({ ...g, monto: Number(g.monto) })));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = () => {
    setEditingGasto(null);
    setFormData({ descripcion: '', categoria: '', monto: 0, fecha: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const handleEdit = (g: Gasto) => {
    setEditingGasto(g);
    setFormData({ descripcion: g.descripcion, categoria: g.categoria, monto: g.monto, fecha: g.fecha });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este gasto?')) {
      await deleteGasto(id);
      await load();
    }
  };

  const handleSave = async () => {
    await upsertGasto({
      id: editingGasto?.id,
      descripcion: formData.descripcion,
      categoria: formData.categoria,
      monto: formData.monto,
      fecha: formData.fecha,
    });
    setShowModal(false);
    await load();
  };

  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

  const gastosPorCategoria = gastos.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + g.monto;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-medium text-gray-900">Gestión de Gastos</h1>
        <button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700">
          <Plus size={18} /> Agregar Gasto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-2xl p-6">
          <p className="text-sm text-gray-500">Total Gastos</p>
          <p className="text-3xl font-bold text-red-600">S/ {totalGastos.toFixed(2)}</p>
        </div>
        {Object.entries(gastosPorCategoria).slice(0, 2).map(([cat, monto]) => (
          <div key={cat} className="bg-white border rounded-2xl p-6">
            <p className="text-sm text-gray-500">{cat}</p>
            <p className="text-2xl font-bold">S/ {monto.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium text-gray-500">Descripción</th>
              <th className="text-left p-4 font-medium text-gray-500">Categoría</th>
              <th className="text-left p-4 font-medium text-gray-500">Monto</th>
              <th className="text-left p-4 font-medium text-gray-500">Fecha</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {gastos.map((g) => (
              <tr key={g.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{g.descripcion}</td>
                <td className="p-4">{g.categoria}</td>
                <td className="p-4 text-red-600 font-semibold">S/ {g.monto.toFixed(2)}</td>
                <td className="p-4 text-gray-500">{g.fecha}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => handleEdit(g)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(g.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">{editingGasto ? 'Editar' : 'Nuevo'} Gasto</h2>
            <div className="space-y-3">
              <input placeholder="Descripción" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Categoría" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input type="number" placeholder="Monto" value={formData.monto} onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border rounded-xl text-sm">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
