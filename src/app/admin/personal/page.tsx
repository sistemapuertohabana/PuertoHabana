'use client';

import { useState } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';

type Rol = 'Mozo' | 'Cocinero' | 'Ayudante de Cocina' | 'Lavadero de Platos';
type Turno = 'Mañana' | 'Tarde';

interface Personal {
  id: number;
  nombre: string;
  dni: string;
  rol: Rol;
  turno: Turno;
  caja: number;
}

export default function PersonalPage() {
  const [personal, setPersonal] = useState<Personal[]>([
    { id: 1, nombre: 'Juan Pérez', dni: '12345678', rol: 'Mozo', turno: 'Mañana', caja: 1500 },
    { id: 2, nombre: 'María García', dni: '23456789', rol: 'Cocinero', turno: 'Mañana', caja: 0 },
    { id: 3, nombre: 'Carlos López', dni: '34567890', rol: 'Mozo', turno: 'Tarde', caja: 2200 },
    { id: 4, nombre: 'Ana Martínez', dni: '45678901', rol: 'Ayudante de Cocina', turno: 'Mañana', caja: 0 },
    { id: 5, nombre: 'Pedro Sánchez', dni: '56789012', rol: 'Lavadero de Platos', turno: 'Tarde', caja: 0 },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState<Personal | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    rol: 'Mozo' as Rol,
    turno: 'Mañana' as Turno,
    caja: 0,
  });

  const handleAdd = () => {
    setEditingPersonal(null);
    setFormData({ nombre: '', dni: '', rol: 'Mozo', turno: 'Mañana', caja: 0 });
    setShowModal(true);
  };

  const handleEdit = (p: Personal) => {
    setEditingPersonal(p);
    setFormData({ nombre: p.nombre, dni: p.dni, rol: p.rol, turno: p.turno, caja: p.caja });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de eliminar este personal?')) {
      setPersonal(personal.filter(p => p.id !== id));
    }
  };

  const handleSave = () => {
    if (editingPersonal) {
      setPersonal(personal.map(p => 
        p.id === editingPersonal.id 
          ? { ...p, ...formData }
          : p
      ));
    } else {
      const newPersonal: Personal = {
        id: Math.max(...personal.map(p => p.id), 0) + 1,
        ...formData,
      };
      setPersonal([...personal, newPersonal]);
    }
    setShowModal(false);
  };

  const getTurnoColor = (turno: Turno) => {
    return turno === 'Mañana' ? 'bg-gray-100 text-gray-900' : 'bg-gray-200 text-gray-900';
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-medium text-gray-900">Gestión de Personal</h1>
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm w-full md:w-auto"
        >
          <Plus size={16} strokeWidth={2} />
          Agregar
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">
                  DNI
                </th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Turno
                </th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Caja
                </th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {personal.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{p.nombre}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{p.dni}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{p.rol}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex items-center text-xs rounded ${getTurnoColor(p.turno)}`}>
                      {p.turno}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {p.caja.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-gray-500 hover:text-black mr-3 transition-colors"
                    >
                      <Edit size={16} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
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
        {personal.map((p) => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{p.nombre}</h3>
                <p className="text-xs text-gray-500">DNI: {p.dni}</p>
                <p className="text-xs text-gray-500">{p.rol}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(p)}
                  className="text-gray-500 hover:text-black transition-colors p-1"
                >
                  <Edit size={16} strokeWidth={2} />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-gray-500 hover:text-black transition-colors p-1"
                >
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Turno</p>
                <span className={`inline-block px-2 py-0.5 text-xs rounded ${getTurnoColor(p.turno)}`}>
                  {p.turno}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Caja</p>
                <p className="text-sm font-medium text-gray-900">${p.caja.toFixed(2)}</p>
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
                {editingPersonal ? 'Editar Personal' : 'Agregar Personal'}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2 font-medium">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    placeholder="Nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2 font-medium">
                    DNI
                  </label>
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    placeholder="12345678"
                    maxLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2 font-medium">
                    Rol
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as Rol })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  >
                    <option value="Mozo">Mozo</option>
                    <option value="Cocinero">Cocinero</option>
                    <option value="Ayudante de Cocina">Ayudante de Cocina</option>
                    <option value="Lavadero de Platos">Lavadero de Platos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2 font-medium">
                    Turno
                  </label>
                  <select
                    value={formData.turno}
                    onChange={(e) => setFormData({ ...formData, turno: e.target.value as Turno })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  >
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde (Incluye Noche)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2 font-medium">
                    Caja Asignada (Solo para Mozos)
                  </label>
                  <input
                    type="number"
                    value={formData.caja}
                    onChange={(e) => setFormData({ ...formData, caja: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    placeholder="0.00"
                    step="0.01"
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
