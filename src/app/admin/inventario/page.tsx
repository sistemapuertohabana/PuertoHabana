'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Utensils, Wine, Package } from 'lucide-react';
import {
  subscribeInventario,
  addInventarioItem,
  updateInventarioItem,
  deleteInventarioItem,
} from '@/lib/db';

// Interfaces
interface Comida {
  id: string;
  nombre: string;
  categoria?: string;
  precio: number;
  cantidad: number;
}

interface Bebida {
  id: string;
  nombre: string;
  categoria?: string;
  precio: number;
  cantidad: number;
}

interface Taper {
  id: string;
  nombre: string;
  tipo?: string;
  precio: number;
  cantidad: number;
}

type ActiveSection = 'comida' | 'bebidas' | 'tapers' | 'nuevo-plato';

export default function InventarioPage() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('comida');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Estados para Comida
  const [comida, setComida] = useState<Comida[]>([]);

  // Estados para Bebidas
  const [bebidas, setBebidas] = useState<Bebida[]>([]);

  // Estados para Tapers
  const [tapers, setTapers] = useState<Taper[]>([]);

  // Suscripciones en tiempo real a Firebase
  useEffect(() => {
    const unsubComida = subscribeInventario('comida', (data) => setComida(data));
    const unsubBebidas = subscribeInventario('bebidas', (data) => setBebidas(data));
    const unsubTapers = subscribeInventario('tapers', (data) => setTapers(data));
    return () => {
      unsubComida();
      unsubBebidas();
      unsubTapers();
    };
  }, []);

  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Estados para ingredientes (local, no persisten en DB)
  const [ingredientes, setIngredientes] = useState([
    { id: 1, nombre: 'Pescado', cantidad: 10, unidad: 'kg', precio: 25.00 },
    { id: 2, nombre: 'Limón', cantidad: 50, unidad: 'unidades', precio: 0.50 },
    { id: 3, nombre: 'Cebolla', cantidad: 30, unidad: 'unidades', precio: 0.30 },
    { id: 4, nombre: 'Cilantro', cantidad: 20, unidad: 'unidades', precio: 0.20 },
    { id: 5, nombre: 'Ají', cantidad: 15, unidad: 'unidades', precio: 0.40 },
    { id: 6, nombre: 'Arroz', cantidad: 5, unidad: 'kg', precio: 4.00 },
    { id: 7, nombre: 'Mariscos', cantidad: 8, unidad: 'kg', precio: 30.00 },
  ]);
  const [selectedIngredientes, setSelectedIngredientes] = useState<{[key: number]: number}>({});
  const [editingIngrediente, setEditingIngrediente] = useState<any>(null);
  const [ingredienteForm, setIngredienteForm] = useState({ nombre: '', cantidad: 0, unidad: 'kg', precio: 0 });
  const [showIngredienteModal, setShowIngredienteModal] = useState(false);

  const totalComida = comida.reduce((sum, c) => sum + (c.precio * c.cantidad), 0);
  const totalBebidas = bebidas.reduce((sum, b) => sum + (b.precio * b.cantidad), 0);
  const totalTapers = tapers.reduce((sum, t) => sum + (t.precio * t.cantidad), 0);
  const totalIngresos = totalComida + totalBebidas + totalTapers;

  // Funciones para manejar modales
  const handleAdd = () => {
    setEditingItem(null);
    if (activeSection === 'tapers') {
      setFormData({ nombre: '', tipo: '', precio: 0, cantidad: 0 });
    } else {
      setFormData({ nombre: '', categoria: '', precio: 0, cantidad: 0 });
    }
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    if (activeSection === 'tapers') {
      setFormData({ nombre: item.nombre, tipo: item.tipo, precio: item.precio, cantidad: item.cantidad });
    } else {
      setFormData({ nombre: item.nombre, categoria: item.categoria, precio: item.precio, cantidad: item.cantidad });
    }
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este elemento?')) return;
    const seccion = activeSection as 'comida' | 'bebidas' | 'tapers';
    await deleteInventarioItem(seccion, id);
  };

  const handleSave = async () => {
    const seccion = activeSection as 'comida' | 'bebidas' | 'tapers';
    if (editingItem) {
      await updateInventarioItem(seccion, editingItem.id, formData);
    } else {
      await addInventarioItem(seccion, formData);
    }
    setShowModal(false);
  };

  // Funciones para manejar ingredientes
  const handleAddIngrediente = () => {
    setEditingIngrediente(null);
    setIngredienteForm({ nombre: '', cantidad: 0, unidad: 'kg', precio: 0 });
    setShowIngredienteModal(true);
  };

  const handleEditIngrediente = (ing: any) => {
    setEditingIngrediente(ing);
    setIngredienteForm({ nombre: ing.nombre, cantidad: ing.cantidad, unidad: ing.unidad, precio: ing.precio });
    setShowIngredienteModal(true);
  };

  const handleDeleteIngrediente = (id: number) => {
    if (confirm('¿Está seguro de eliminar este ingrediente?')) {
      setIngredientes(ingredientes.filter(i => i.id !== id));
    }
  };

  const handleSaveIngrediente = () => {
    if (editingIngrediente) {
      setIngredientes(ingredientes.map(i => 
        i.id === editingIngrediente.id 
          ? { ...i, ...ingredienteForm }
          : i
      ));
    } else {
      const newIngrediente = {
        id: Math.max(...ingredientes.map(i => i.id), 0) + 1,
        ...ingredienteForm,
      };
      setIngredientes([...ingredientes, newIngrediente]);
    }
    setShowIngredienteModal(false);
  };

  // Función para obtener los datos actuales según la sección activa
  const getCurrentData = () => {
    switch (activeSection) {
      case 'comida': return comida;
      case 'bebidas': return bebidas;
      case 'tapers': return tapers;
      default: return [];
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'comida': return 'Gestión de Comida';
      case 'bebidas': return 'Gestión de Bebidas';
      case 'tapers': return 'Gestión de Tapers';
      case 'nuevo-plato': return 'Crear Nuevo Plato';
      default: return 'Inventario';
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-medium text-gray-900">Inventario General</h1>
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm w-full md:w-auto bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus size={16} strokeWidth={2} />
          Agregar {activeSection === 'comida' ? 'Platillo' : activeSection === 'bebidas' ? 'Bebida' : 'Taper'}
        </button>
      </div>

      {/* Gráfico de resumen */}
      <div className="border rounded-lg p-6 mb-8 bg-white border-gray-200">
        <h2 className="text-xl font-medium mb-6 text-gray-900">Resumen de Inventario</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Utensils size={32} className="text-blue-600" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Comida</h3>
            <p className="text-2xl font-bold text-blue-600">S/ {Number(totalComida).toFixed(2)}</p>
            <p className="text-sm text-gray-500">{comida.length} platillos</p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Wine size={32} className="text-green-600" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Bebidas</h3>
            <p className="text-2xl font-bold text-green-600">S/ {Number(totalBebidas).toFixed(2)}</p>
            <p className="text-sm text-gray-500">{bebidas.length} bebidas</p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Package size={32} className="text-orange-600" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Tapers</h3>
            <p className="text-2xl font-bold text-orange-600">S/ {Number(totalTapers).toFixed(2)}</p>
            <p className="text-sm text-gray-500">{tapers.length} productos</p>
          </div>
        </div>

        <div className="text-center pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">Total Ingresos</p>
          <p className="text-3xl font-bold text-gray-900">S/ {Number(totalIngresos).toFixed(2)}</p>
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="flex flex-col sm:flex-row gap-2 mb-8">
        <button
          onClick={() => setActiveSection('comida')}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
            activeSection === 'comida'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Utensils size={16} strokeWidth={2} />
          Comida
        </button>
        <button
          onClick={() => setActiveSection('bebidas')}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
            activeSection === 'bebidas'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Wine size={16} strokeWidth={2} />
          Bebidas
        </button>
        <button
          onClick={() => setActiveSection('tapers')}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
            activeSection === 'tapers'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Package size={16} strokeWidth={2} />
          Tapers
        </button>
        <button
          onClick={() => setActiveSection('nuevo-plato')}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
            activeSection === 'nuevo-plato'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Plus size={16} strokeWidth={2} />
          Crear Plato
        </button>
      </div>

      {/* Contenido dinámico según la sección activa */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{getSectionTitle()}</h3>
        
        {activeSection === 'nuevo-plato' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-medium text-gray-900">Ingredientes Disponibles</h4>
              <button
                onClick={handleAddIngrediente}
                className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                <Plus size={14} />
                Agregar Ingrediente
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {ingredientes.map((ing) => (
                <div key={ing.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{ing.nombre}</span>
                      <p className="text-xs text-gray-500 mt-1">S/ {Number(ing.precio).toFixed(2)} / {ing.unidad}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditIngrediente(ing)}
                        className="text-gray-500 hover:text-black transition-colors p-1"
                      >
                        <Edit size={14} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => handleDeleteIngrediente(ing.id)}
                        className="text-gray-500 hover:text-black transition-colors p-1"
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cantidad:</span>
                    <span className="text-sm font-medium text-gray-900">{ing.cantidad} {ing.unidad}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-base font-medium text-gray-900 mb-4">Estimar Nuevo Plato</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2 font-medium">Nombre del Plato</label>
                  <input
                    type="text"
                    placeholder="Ej: Ceviche Especial"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2 font-medium">Seleccionar Ingredientes</label>
                  <div className="space-y-2">
                    {ingredientes.map((ing) => (
                      <div key={ing.id} className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300"
                          checked={!!selectedIngredientes[ing.id]}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIngredientes({...selectedIngredientes, [ing.id]: 1});
                            } else {
                              const newSelected = {...selectedIngredientes};
                              delete newSelected[ing.id];
                              setSelectedIngredientes(newSelected);
                            }
                          }}
                        />
                        <span className="text-sm text-gray-900">{ing.nombre}</span>
                        {selectedIngredientes[ing.id] && (
                          <input
                            type="number"
                            min="0"
                            max={ing.cantidad}
                            value={selectedIngredientes[ing.id]}
                            onChange={(e) => setSelectedIngredientes({...selectedIngredientes, [ing.id]: parseFloat(e.target.value) || 0})}
                            placeholder="Cantidad"
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
                          />
                        )}
                        <span className="text-xs text-gray-500">/ {ing.cantidad} {ing.unidad}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Costo de ingredientes:</span>
                    <span className="text-base font-medium text-gray-900">
                      S/ {Object.entries(selectedIngredientes).reduce((total, [id, cantidad]) => {
                        const ing = ingredientes.find(i => i.id === parseInt(id));
                        return total + (ing ? ing.precio * cantidad : 0);
                      }, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Ganancia (50%):</span>
                    <span className="text-base font-medium text-gray-900">
                      S/ {(Object.entries(selectedIngredientes).reduce((total, [id, cantidad]) => {
                        const ing = ingredientes.find(i => i.id === parseInt(id));
                        return total + (ing ? ing.precio * cantidad : 0);
                      }, 0) * 0.5).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-base font-medium text-gray-900">Precio sugerido:</span>
                    <span className="text-xl font-semibold text-gray-900">
                      S/ {(Object.entries(selectedIngredientes).reduce((total, [id, cantidad]) => {
                        const ing = ingredientes.find(i => i.id === parseInt(id));
                        return total + (ing ? ing.precio * cantidad : 0);
                      }, 0) * 1.5).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Platos posibles:</span>
                    <span className="text-base font-medium text-gray-900">
                      {Object.keys(selectedIngredientes).length > 0 ? Math.min(...Object.entries(selectedIngredientes).map(([id, cantidad]) => {
                        const ing = ingredientes.find(i => i.id === parseInt(id));
                        return ing ? Math.floor(ing.cantidad / cantidad) : 0;
                      })) : 0}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                    Crear Plato
                  </button>
                  <button 
                    onClick={() => setSelectedIngredientes({})}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Vista de tarjetas para móvil y escritorio */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getCurrentData().map((item: any) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{item.nombre}</h4>
                    <p className="text-xs text-gray-500">{activeSection === 'tapers' ? item.tipo : item.categoria}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-gray-500 hover:text-black transition-colors p-1"
                    >
                      <Edit size={16} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-500 hover:text-black transition-colors p-1"
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Precio</p>
                    <p className="text-sm font-medium text-gray-900">S/ {Number(item.precio).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cantidad</p>
                    <p className="text-sm font-medium text-gray-900">{item.cantidad}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-sm font-medium text-gray-900">S/ {(Number(item.precio) * Number(item.cantidad)).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {editingItem ? 'Editar' : 'Agregar'} {activeSection === 'comida' ? 'Platillo' : activeSection === 'bebidas' ? 'Bebida' : 'Taper'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editingItem ? 'Modifica los datos del elemento' : 'Completa la información del nuevo elemento'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Body */}
            <div className="px-8 py-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.nombre || ''}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 placeholder-gray-400"
                    placeholder={`Nombre del ${activeSection === 'comida' ? 'platillo' : activeSection === 'bebidas' ? 'bebida' : 'taper'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {activeSection === 'tapers' ? 'Tipo' : 'Categoría'}
                  </label>
                  <select
                    value={activeSection === 'tapers' ? (formData.tipo || '') : (formData.categoria || '')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      ...(activeSection === 'tapers' ? { tipo: e.target.value } : { categoria: e.target.value })
                    })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 bg-white"
                  >
                    <option value="">Seleccionar {activeSection === 'tapers' ? 'tipo' : 'categoría'}</option>
                    {activeSection === 'comida' && (
                      <>
                        <option value="Ceviches">Ceviches</option>
                        <option value="Platos Fuertes">Platos Fuertes</option>
                        <option value="Entradas">Entradas</option>
                        <option value="Postres">Postres</option>
                      </>
                    )}
                    {activeSection === 'bebidas' && (
                      <>
                        <option value="Cervezas">Cervezas</option>
                        <option value="Refrescos">Refrescos</option>
                        <option value="Cócteles">Cócteles</option>
                        <option value="Jugos">Jugos</option>
                        <option value="Vinos">Vinos</option>
                      </>
                    )}
                    {activeSection === 'tapers' && (
                      <>
                        <option value="Envase">Envase</option>
                        <option value="Empaque">Empaque</option>
                        <option value="Accesorios">Accesorios</option>
                        <option value="Utensilios">Utensilios</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Precio
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">S/</span>
                    <input
                      type="number"
                      value={formData.precio || 0}
                      onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    value={formData.cantidad || 0}
                    onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-gray-50 rounded-b-2xl border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 text-sm font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ingredientes */}
      {showIngredienteModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowIngredienteModal(false);
            }
          }}
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingIngrediente ? 'Editar' : 'Agregar'} Ingrediente
                </h2>
              </div>
              <button
                onClick={() => setShowIngredienteModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={ingredienteForm.nombre}
                    onChange={(e) => setIngredienteForm({ ...ingredienteForm, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    placeholder="Nombre del ingrediente"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad</label>
                    <input
                      type="number"
                      value={ingredienteForm.cantidad}
                      onChange={(e) => setIngredienteForm({ ...ingredienteForm, cantidad: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                      placeholder="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Unidad</label>
                    <select
                      value={ingredienteForm.unidad}
                      onChange={(e) => setIngredienteForm({ ...ingredienteForm, unidad: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors bg-white"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                      <option value="unidades">unidades</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Precio (S/)</label>
                  <input
                    type="number"
                    value={ingredienteForm.precio}
                    onChange={(e) => setIngredienteForm({ ...ingredienteForm, precio: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={handleSaveIngrediente}
                  className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowIngredienteModal(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold"
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