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

type ActiveSection = 'comida' | 'bebidas' | 'tapers' | 'insumos' | 'nuevo-plato';

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

  // Estados para Insumos
  const [insumos, setInsumos] = useState<any[]>([]);

  // Suscripciones en tiempo real a Firebase
  useEffect(() => {
    const unsubComida = subscribeInventario('comida', (data) => setComida(data));
    const unsubBebidas = subscribeInventario('bebidas', (data) => setBebidas(data));
    const unsubTapers = subscribeInventario('tapers', (data) => setTapers(data));
    const unsubInsumos = subscribeInventario('insumos', (data) => setInsumos(data));
    return () => {
      unsubComida();
      unsubBebidas();
      unsubTapers();
      unsubInsumos();
    };
  }, []);

  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Estados para el formulario de nuevo plato
  const [nombrePlato, setNombrePlato] = useState('');
  const [categoriaPlato, setCategoriaPlato] = useState('');
  const [selectedInsumos, setSelectedInsumos] = useState<{[key: string]: number}>({});
  const [precioManual, setPrecioManual] = useState(false);
  const [precioPlato, setPrecioPlato] = useState(0);
  const [cantidadPlato, setCantidadPlato] = useState(10);
  const [creandoPlato, setCreandoPlato] = useState(false);

  const totalComida = comida.reduce((sum, c) => sum + (c.precio * c.cantidad), 0);
  const totalBebidas = bebidas.reduce((sum, b) => sum + (b.precio * b.cantidad), 0);
  const totalTapers = tapers.reduce((sum, t) => sum + (t.precio * t.cantidad), 0);
  const totalInsumos = insumos.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);
  const totalIngresos = totalComida + totalBebidas + totalTapers;

  // Funciones para manejar modales
  const handleAdd = () => {
    setEditingItem(null);
    if (activeSection === 'tapers') {
      setFormData({ nombre: '', tipo: '', precio: 0, cantidad: 0, unidad: 'unidad' });
    } else if (activeSection === 'insumos') {
      setFormData({ nombre: '', categoria: '', precio: 0, cantidad: 0, unidad: 'unidad', minimo: 5 });
    } else {
      setFormData({ nombre: '', categoria: '', precio: 0, cantidad: 0 });
    }
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    if (activeSection === 'tapers') {
      setFormData({ nombre: item.nombre, tipo: item.tipo, precio: item.precio, cantidad: item.cantidad, unidad: item.unidad || 'unidad' });
    } else if (activeSection === 'insumos') {
      setFormData({ nombre: item.nombre, categoria: item.categoria, precio: item.precio, cantidad: item.cantidad, unidad: item.unidad || 'unidad', minimo: item.minimo || 5 });
    } else {
      setFormData({ nombre: item.nombre, categoria: item.categoria, precio: item.precio, cantidad: item.cantidad });
    }
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este elemento?')) return;
    const seccion = activeSection as 'comida' | 'bebidas' | 'tapers' | 'insumos';
    await deleteInventarioItem(seccion, id);
  };

  const handleSave = async () => {
    const seccion = activeSection as 'comida' | 'bebidas' | 'tapers' | 'insumos';
    if (editingItem) {
      await updateInventarioItem(seccion, editingItem.id, formData);
    } else {
      await addInventarioItem(seccion, formData);
    }
    setShowModal(false);
  };

  // Calcular costo total de insumos seleccionados
  const costoInsumos = Object.entries(selectedInsumos).reduce((total, [id, cantidad]) => {
    const insumo = insumos.find(i => String(i.id) === id);
    return total + (insumo ? insumo.precio * cantidad : 0);
  }, 0);

  // Calcular platos posibles
  const platosPosibles = Object.keys(selectedInsumos).length > 0
    ? Math.min(...Object.entries(selectedInsumos).map(([id, cantidad]) => {
        const insumo = insumos.find(i => String(i.id) === id);
        return insumo ? Math.floor(insumo.cantidad / cantidad) : 0;
      }))
    : 0;

  const sugerirPrecio = () => {
    const sugerido = costoInsumos * 1.5;
    setPrecioPlato(Math.round(sugerido * 100) / 100);
    setPrecioManual(false);
  };

  const handleCrearPlato = async () => {
    if (!nombrePlato.trim()) { alert('Ingresa un nombre para el plato'); return; }
    if (Object.keys(selectedInsumos).length === 0) { alert('Selecciona al menos un insumo'); return; }
    if (precioPlato <= 0) { alert('Ingresa o genera un precio'); return; }

    setCreandoPlato(true);
    try {
      await addInventarioItem('comida', {
        nombre: nombrePlato.trim(),
        categoria: categoriaPlato || 'Platos Fuertes',
        precio: precioPlato,
        cantidad: cantidadPlato,
      });
      // Resetear formulario
      setNombrePlato('');
      setCategoriaPlato('');
      setSelectedInsumos({});
      setPrecioPlato(0);
      setPrecioManual(false);
      setCantidadPlato(10);
      alert('¡Plato creado exitosamente!');
    } catch {
      alert('Error al crear el plato. Intenta de nuevo.');
    }
    setCreandoPlato(false);
  };

  // Función para obtener los datos actuales según la sección activa
  const getCurrentData = () => {
    switch (activeSection) {
      case 'comida': return comida;
      case 'bebidas': return bebidas;
      case 'tapers': return tapers;
      case 'insumos': return insumos;
      default: return [];
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'comida': return 'Gestión de Comida';
      case 'bebidas': return 'Gestión de Bebidas';
      case 'tapers': return 'Gestión de Tapers';
      case 'insumos': return 'Gestión de Insumos';
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
          Agregar {activeSection === 'comida' ? 'Platillo' : activeSection === 'bebidas' ? 'Bebida' : activeSection === 'insumos' ? 'Insumo' : 'Taper'}
        </button>
      </div>

      {/* Gráfico de resumen */}
      <div className="border rounded-lg p-6 mb-8 bg-white border-gray-200">
        <h2 className="text-xl font-medium mb-6 text-gray-900">Resumen de Inventario</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
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
          
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-teal-100 rounded-full flex items-center justify-center">
              <Package size={32} className="text-teal-600" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Insumos</h3>
            <p className="text-2xl font-bold text-teal-600">S/ {Number(totalInsumos).toFixed(2)}</p>
            <p className="text-sm text-gray-500">{insumos.length} insumos</p>
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
          onClick={() => setActiveSection('insumos')}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
            activeSection === 'insumos'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Package size={16} strokeWidth={2} />
          Insumos
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
            {/* Encabezado con botón para ir a Insumos */}
            <div className="flex justify-between items-center">
              <h4 className="text-base font-medium text-gray-900">Insumos Disponibles en Inventario</h4>
              <button
                onClick={() => setActiveSection('insumos')}
                className="flex items-center gap-2 bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-colors text-sm"
              >
                <Plus size={14} />
                Gestionar Insumos
              </button>
            </div>

            {/* Grid de insumos desde inventario */}
            {insumos.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                <Package size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No hay insumos registrados</p>
                <p className="text-xs text-gray-400 mt-1">Ve a la pestaña <strong>Insumos</strong> para agregarlos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {insumos.map((ins) => (
                  <div key={ins.id} className={`p-3 rounded-lg border transition-all duration-200 ${
                    selectedInsumos[ins.id] 
                      ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}>
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        checked={!!selectedInsumos[ins.id]}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInsumos({...selectedInsumos, [ins.id]: 1});
                          } else {
                            const newSelected = {...selectedInsumos};
                            delete newSelected[ins.id];
                            setSelectedInsumos(newSelected);
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{ins.nombre}</p>
                        <p className="text-xs text-gray-500">S/ {Number(ins.precio).toFixed(2)}</p>
                        <p className="text-xs text-gray-400">Stock: {ins.cantidad} {ins.unidad || 'unid'}</p>
                      </div>
                    </div>
                    {selectedInsumos[ins.id] && (
                      <div className="mt-2 flex items-center gap-2">
                        <label className="text-xs text-gray-500">Cant:</label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          max={ins.cantidad}
                          value={selectedInsumos[ins.id]}
                          onChange={(e) => setSelectedInsumos({...selectedInsumos, [ins.id]: parseFloat(e.target.value) || 0})}
                          className="flex-1 w-16 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
                        />
                        <span className="text-xs text-gray-400">{ins.unidad || 'unid'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Formulario del plato */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-base font-medium text-gray-900 mb-4">Crear Nuevo Plato</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2 font-medium">Nombre del Plato</label>
                  <input
                    type="text"
                    value={nombrePlato}
                    onChange={(e) => setNombrePlato(e.target.value)}
                    placeholder="Ej: Ceviche Especial"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2 font-medium">Categoría</label>
                  <select
                    value={categoriaPlato}
                    onChange={(e) => setCategoriaPlato(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200 transition-colors bg-white text-gray-900"
                  >
                    <option value="">Seleccionar categoría</option>
                    <option value="Ceviches">Ceviches</option>
                    <option value="Platos Fuertes">Platos Fuertes</option>
                    <option value="Entradas">Entradas</option>
                    <option value="Postres">Postres</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2 font-medium">Cantidad en Stock</label>
                  <input
                    type="number"
                    min="1"
                    value={cantidadPlato}
                    onChange={(e) => setCantidadPlato(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2 font-medium">Precio de Venta</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={precioPlato}
                        onChange={(e) => { setPrecioPlato(parseFloat(e.target.value) || 0); setPrecioManual(true); }}
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${
                          precioManual 
                            ? 'border-blue-400 focus:border-blue-500 focus:ring-blue-200' 
                            : 'border-teal-400 focus:border-teal-500 focus:ring-teal-200'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      onClick={sugerirPrecio}
                      disabled={Object.keys(selectedInsumos).length === 0}
                      className="px-3 py-2 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      Poner Precio
                    </button>
                  </div>
                  {!precioManual && precioPlato > 0 && (
                    <p className="text-xs text-teal-600 mt-1">✓ Precio calculado automáticamente</p>
                  )}
                  {precioManual && precioPlato > 0 && (
                    <p className="text-xs text-blue-600 mt-1">✎ Precio ingresado manualmente</p>
                  )}
                </div>
              </div>
            </div>

            {/* Resumen de costos — solo si hay precio definido */}
            {Object.keys(selectedInsumos).length > 0 && precioPlato > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Resumen del Plato</h5>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Costo de insumos:</span>
                    <span className="font-medium text-gray-900">S/ {costoInsumos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Ganancia estimada:</span>
                    <span className={`font-medium ${precioPlato - costoInsumos >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      S/ {(precioPlato - costoInsumos).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Margen:</span>
                    <span className={`font-medium ${costoInsumos > 0 ? (precioPlato / costoInsumos - 1) * 100 >= 30 ? 'text-emerald-600' : 'text-amber-600' : 'text-gray-400'}`}>
                      {costoInsumos > 0 ? `${((precioPlato / costoInsumos - 1) * 100).toFixed(1)}%` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Platos posibles con stock actual:</span>
                    <span className="font-medium text-gray-900">{platosPosibles}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Precio final:</span>
                    <span className="text-lg font-semibold text-gray-900">S/ {precioPlato.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje informativo cuando hay insumos pero falta precio */}
            {Object.keys(selectedInsumos).length > 0 && precioPlato <= 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-800">Falta definir el precio</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Usa el botón <strong>"Poner Precio"</strong> para calcularlo automáticamente (costo × 1.5) 
                    o ingrésalo manualmente en el campo de texto.
                  </p>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCrearPlato}
                disabled={creandoPlato || !nombrePlato.trim() || Object.keys(selectedInsumos).length === 0 || precioPlato <= 0}
                className="flex-1 bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creandoPlato ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Creando...</>
                ) : 'Crear Plato'}
              </button>
              <button
                onClick={() => {
                  setNombrePlato('');
                  setCategoriaPlato('');
                  setSelectedInsumos({});
                  setPrecioPlato(0);
                  setPrecioManual(false);
                  setCantidadPlato(10);
                }}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
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
                  {editingItem ? 'Editar' : 'Agregar'} {activeSection === 'comida' ? 'Platillo' : activeSection === 'bebidas' ? 'Bebida' : activeSection === 'insumos' ? 'Insumo' : 'Taper'}
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
                    placeholder={`Nombre del ${activeSection === 'comida' ? 'platillo' : activeSection === 'bebidas' ? 'bebida' : activeSection === 'insumos' ? 'insumo' : 'taper'}`}
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
                    {activeSection === 'insumos' && (
                      <>
                        <option value="Pescados">Pescados</option>
                        <option value="Mariscos">Mariscos</option>
                        <option value="Carnes">Carnes</option>
                        <option value="Verduras">Verduras</option>
                        <option value="Frutas">Frutas</option>
                        <option value="Abarrotes">Abarrotes</option>
                        <option value="Lácteos">Lácteos</option>
                        <option value="Especias">Especias</option>
                        <option value="Otros">Otros</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Campo de unidad para insumos y tapers */}
                {(activeSection === 'insumos' || activeSection === 'tapers') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Unidad</label>
                    <select
                      value={formData.unidad || 'unidad'}
                      onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 bg-white"
                    >
                      <option value="unidad">Unidad</option>
                      <option value="kg">Kilogramo (kg)</option>
                      <option value="g">Gramo (g)</option>
                      <option value="L">Litro (L)</option>
                      <option value="ml">Mililitro (ml)</option>
                      <option value="lb">Libra (lb)</option>
                      <option value="oz">Onza (oz)</option>
                      <option value="docena">Docena</option>
                    </select>
                  </div>
                )}

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

    </div>
  );
}