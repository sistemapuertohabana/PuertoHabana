'use client';

import { useState } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';

interface Gasto {
  id: number;
  descripcion: string;
  categoria: string;
  monto: number;
  fecha: string;
}

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([
    { id: 1, descripcion: 'Nómina Semanal', categoria: 'Nómina', monto: 3200, fecha: '2024-01-15' },
    { id: 2, descripcion: 'Factura Luz', categoria: 'Servicios', monto: 450, fecha: '2024-01-14' },
    { id: 3, descripcion: 'Factura Agua', categoria: 'Servicios', monto: 180, fecha: '2024-01-14' },
    { id: 4, descripcion: 'Mantenimiento Equipo', categoria: 'Mantenimiento', monto: 650, fecha: '2024-01-13' },
    { id: 5, descripcion: 'Suministros de Limpieza', categoria: 'Otros', monto: 320, fecha: '2024-01-12' },
    { id: 6, descripcion: 'Licencia Municipal', categoria: 'Otros', monto: 290, fecha: '2024-01-10' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [formData, setFormData] = useState({
    descripcion: '',
    categoria: '',
    monto: 0,
    fecha: new Date().toISOString().split('T')[0],
  });

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

  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de eliminar este gasto?')) {
      setGastos(gastos.filter(g => g.id !== id));
    }
  };

  const handleSave = () => {
    if (editingGasto) {
      setGastos(gastos.map(g => 
        g.id === editingGasto.id 
          ? { ...g, ...formData }
          : g
      ));
    } else {
      const newGasto: Gasto = {
        id: Math.max(...gastos.map(g => g.id), 0) + 1,
        ...formData,
      };
      setGastos([...gastos, newGasto]);
    }
    setShowModal(false);
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
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm w-full md:w-auto"
        >
          <Plus size={16} strokeWidth={2} />
          Agregar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Total Gastos</p>
          <p className="text-xl md:text-2xl font-medium text-gray-900">${totalGastos.toFixed(2)}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-4">Gastos por Categoría</p>
          <div className="space-y-2">
            {Object.entries(gastosPorCategoria).map(([categoria, monto]) => (
              <div key={categoria} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-xs text-gray-600">{categoria}</span>
                <span className="text-xs font-medium text-gray-900">${monto.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Descripción
                </th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Monto
                </th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gastos.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{g.descripcion}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{g.categoria}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${g.monto.toFixed(2)}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{g.fecha}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(g)}
                      className="text-gray-500 hover:text-black mr-3 transition-colors"
                    >
                      <Edit size={16} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="text-gray-500 hover:text-black transition-colors"
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 pb-4">
        {gastos.map((g) => (
          <div key={g.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{g.descripcion}</h3>
                <p className="text-xs text-gray-500">{g.categoria}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(g)}
                  className="text-gray-500 hover:text-black transition-colors p-1"
                >
                  <Edit size={16} strokeWidth={2} />
                </button>
                <button
                  onClick={() => handleDelete(g.id)}
                  className="text-gray-500 hover:text-black transition-colors p-1"
                >
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Monto</p>
                <p className="text-sm font-medium text-gray-900">${g.monto.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fecha</p>
                <p className="text-sm font-medium text-gray-900">{g.fecha}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                {editingGasto ? 'Editar Gasto' : 'Agregar Gasto'}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2 font-medium">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    placeholder="Descripción del gasto"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2 font-medium">
                    Categoría
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  >
                    <option value="">Seleccionar categoría</option>
                    <option value="Nómina">Nómina</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Suministros">Suministros</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2 font-medium">
                    Monto
                  </label>
                  <input
                    type="number"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2 font-medium">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
