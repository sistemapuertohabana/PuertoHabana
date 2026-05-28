'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Utensils, Wine, Package, Barcode, Camera, Image as ImageIcon, DollarSign, AlertTriangle, History, TrendingUp, X as XIcon, ScanLine, CheckCircle } from 'lucide-react';
import {
  subscribeInventario,
  addInventarioItem,
  updateInventarioItem,
  deleteInventarioItem,
  type InventarioMovimiento,
} from '@/lib/db';
import InventoryBarcodeScanner from '@/components/InventoryBarcodeScanner';

// Interfaces
interface Comida {
  id: string;
  nombre: string;
  categoria?: string;
  precio: number;
  cantidad: number;
  costo?: number;
  minimo?: number;
  unidad?: string;
  codigo_barras?: string;
  imagen_url?: string;
  tamanos?: Array<{nombre: string; precio: number; costo?: number}>;
}

interface Bebida {
  id: string;
  nombre: string;
  categoria?: string;
  precio: number;
  cantidad: number;
  costo?: number;
  minimo?: number;
  codigo_barras?: string;
  imagen_url?: string;
  tamanos?: Array<{nombre: string; precio: number; costo?: number}>;
}

interface Taper {
  id: string;
  nombre: string;
  tipo?: string;
  precio: number;
  cantidad: number;
  costo?: number;
  minimo?: number;
  unidad?: string;
  codigo_barras?: string;
  imagen_url?: string;
}

type ActiveSection = 'comida' | 'bebidas' | 'tapers' | 'insumos' | 'nuevo-plato' | 'historial' | 'alertas';

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

  // Filtro por turno
  const [turnoFilter, setTurnoFilter] = useState<string>('todos');

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

  // Scanner & nuevos campos
  const [showScanner, setShowScanner] = useState(false);
  const [movimientos, setMovimientos] = useState<InventarioMovimiento[]>([]);
  const [itemsConBajoStock, setItemsConBajoStock] = useState<any[]>([]);

  // Historial de adiciones para Bebidas
  const [showAdditionsHistory, setShowAdditionsHistory] = useState(false);
  const [adiciones, setAdiciones] = useState<any[]>([]);
  const [loadingAdditions, setLoadingAdditions] = useState(false);
  const [adicionesSearch, setAdicionesSearch] = useState('');
  const [historialSearch, setHistorialSearch] = useState('');

  // Cargar movimientos y alertas
  useEffect(() => {
    const loadMovimientos = async () => {
      try {
        const res = await fetch('/api/inventario/stock?limit=20');
        if (res.ok) {
          setMovimientos(await res.json());
        }
      } catch {}
    };
    loadMovimientos();

    // Detectar items con bajo stock
    const checkLowStock = () => {
      const allItems = [...comida, ...bebidas, ...tapers, ...insumos];
      const low = allItems.filter(i => i.cantidad <= (i.minimo || 3));
      setItemsConBajoStock(low);
    };
    checkLowStock();
  }, [comida, bebidas, tapers, insumos]);

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

  const isFractionable = (nombre: string) => {
    const n = nombre.toLowerCase();
    return n.includes('chicha') || n.includes('maracuya') || n.includes('limonada') || n.includes('refresco');
  };

  const formatStock = (cantidad: number, unidad: string, nombre: string) => {
    if (isFractionable(nombre)) {
      const jarras = Math.floor(cantidad / 3);
      const vasos = cantidad % 3;
      if (jarras === 0 && vasos === 0) return '0 Vasos';
      if (jarras === 0) return `${vasos} Vaso(s)`;
      if (vasos === 0) return `${jarras} Jarra(s)`;
      return `${jarras} Jarra(s) y ${vasos} Vaso(s)`;
    }
    return `${cantidad} ${unidad || 'unid'}`;
  };

  // Funciones para manejar modales
  const handleAdd = () => {
    setEditingItem(null);
    if (activeSection === 'tapers') {
      setFormData({ nombre: '', tipo: '', precio: 0, cantidad: 0, unidad: 'unidad', codigo_barras: '', imagen_url: '', costo: 0, turno: 'ambos' });
    } else if (activeSection === 'insumos') {
      setFormData({ nombre: '', categoria: '', precio: 0, cantidad: 0, unidad: 'unidad', minimo: 3, codigo_barras: '', imagen_url: '', costo: 0, turno: 'ambos' });
    } else if (activeSection === 'bebidas') {
      setFormData({ nombre: '', categoria: '', precio: 0, cantidad: 0, codigo_barras: '', imagen_url: '', costo: 0, tamanos: [], turno: 'ambos' });
    } else if (activeSection === 'comida') {
      setFormData({ nombre: '', categoria: '', precio: 0, cantidad: 0, codigo_barras: '', imagen_url: '', costo: 0, tamanos: [], turno: 'ambos' });
    } else {
      setFormData({ nombre: '', categoria: '', precio: 0, cantidad: 0, codigo_barras: '', imagen_url: '', costo: 0, turno: 'ambos' });
    }
    setShowModal(true);
  };

  // Manejar escaneo de código de barras
  const handleBarcodeScan = (result: { barcode: string; productInfo?: { nombre?: string; precio?: number; imagen_url?: string } }) => {
    setFormData({
      ...formData,
      codigo_barras: result.barcode,
      nombre: result.productInfo?.nombre || formData.nombre || '',
      precio: result.productInfo?.precio ?? formData.precio ?? 0,
      imagen_url: result.productInfo?.imagen_url || formData.imagen_url || '',
    });
    setShowScanner(false);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    const baseForm = {
      nombre: item.nombre,
      categoria: item.categoria,
      tipo: item.tipo,
      precio: item.precio,
      cantidad: item.cantidad,
      codigo_barras: item.codigo_barras || '',
      imagen_url: item.imagen_url || '',
      costo: item.costo || 0,
      tamanos: item.tamanos || [],
      turno: item.turno || 'ambos',
    };
    if (activeSection === 'tapers') {
      setFormData({ ...baseForm, tipo: item.tipo, unidad: item.unidad || 'unidad' });
    } else if (activeSection === 'insumos') {
      setFormData({ ...baseForm, unidad: item.unidad || 'unidad', minimo: item.minimo || 3 });
    } else {
      setFormData(baseForm);
    }
    setShowModal(true);
  };

  const loadAdditionsHistory = async () => {
    setLoadingAdditions(true);
    try {
      const res = await fetch('/api/inventario/stock?seccion=bebidas&tipo=entrada&limit=100');
      if (res.ok) {
        setAdiciones(await res.json());
      }
    } catch {}
    setLoadingAdditions(false);
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
    let data: any[] = [];
    switch (activeSection) {
      case 'comida': data = comida; break;
      case 'bebidas': data = bebidas; break;
      case 'tapers': data = tapers; break;
      case 'insumos': data = insumos; break;
      default: return [];
    }
    // Filtrar por turno
    if (turnoFilter !== 'todos') {
      data = data.filter(item => !item.turno || item.turno === 'ambos' || item.turno === turnoFilter);
    }
    return data;
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'comida': return 'Gestión de Comida';
      case 'bebidas': return 'Gestión de Bebidas';
      case 'tapers': return 'Gestión de Tapers';
      case 'insumos': return 'Gestión de Insumos';
      case 'nuevo-plato': return 'Crear Nuevo Plato';
      case 'historial': return 'Historial de Movimientos';
      case 'alertas': return 'Alertas de Stock';
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
        <div className="flex gap-2">
          {activeSection !== 'comida' && (
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm bg-green-600 text-white hover:bg-green-700"
            >
              <Barcode size={16} strokeWidth={2} />
              Escanear
            </button>
          )}
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus size={16} strokeWidth={2} />
            Agregar {activeSection === 'comida' ? 'Platillo' : activeSection === 'bebidas' ? 'Bebida' : activeSection === 'insumos' ? 'Insumo' : 'Taper'}
          </button>
        </div>
      </div>

      {/* Stock Alerts Banner */}
      {itemsConBajoStock.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800">
                Stock Bajo - {itemsConBajoStock.length} producto{itemsConBajoStock.length !== 1 ? 's' : ''}
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {itemsConBajoStock.slice(0, 5).map(item => (
                  <span key={item.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-red-200 rounded-full text-xs font-medium text-red-700">
                    {item.nombre} <span className="text-red-400">({formatStock(item.cantidad, item.unidad || 'unid', item.nombre)})</span>
                  </span>
                ))}
                {itemsConBajoStock.length > 5 && (
                  <span className="text-xs text-red-500 font-medium self-center">+{itemsConBajoStock.length - 5} más</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Botones de navegación — scroll horizontal en mobile */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
        <button
          onClick={() => setActiveSection('historial')}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
            activeSection === 'historial'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <History size={16} strokeWidth={2} />
          Historial
        </button>
        <button
          onClick={() => setActiveSection('alertas')}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
            activeSection === 'alertas'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <AlertTriangle size={16} strokeWidth={2} />
          Alertas
        </button>
      </div>

      {/* Filtro por Turno */}
      {activeSection !== 'nuevo-plato' && activeSection !== 'historial' && activeSection !== 'alertas' && !(activeSection === 'bebidas' && showAdditionsHistory) && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">Turno:</span>
          <div className="flex gap-1.5">
            {[
              { value: 'todos', label: 'Todos' },
              { value: 'maniana', label: '🌅 Mañana' },
              { value: 'tarde', label: '☀️ Tarde' },
              { value: 'ambos', label: '🔄 Ambos' },
            ].map(t => (
              <button
                key={t.value}
                onClick={() => setTurnoFilter(t.value)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  turnoFilter === t.value
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contenido dinámico según la sección activa */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{getSectionTitle()}</h3>
          {activeSection === 'bebidas' && (
            <button
              onClick={() => {
                if (!showAdditionsHistory) loadAdditionsHistory();
                setShowAdditionsHistory(!showAdditionsHistory);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                showAdditionsHistory
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {showAdditionsHistory ? (
                <><Wine size={14} /> Ver Stock</>
              ) : (
                <><History size={14} /> Ver Adiciones</>
              )}
            </button>
          )}
        </div>
        
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
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9.]*"
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
                    <option value="Duo">Duo</option>
                    <option value="Entradas">Entradas</option>
                    <option value="Postres">Postres</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2 font-medium">Cantidad en Stock</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
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
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9.]*"
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
        ) : activeSection === 'historial' ? (
          /* Vista de historial de movimientos */
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <h4 className="text-base font-medium text-gray-900 shrink-0">Historial de Movimientos</h4>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar producto, nota, ref..."
                    value={historialSearch}
                    onChange={(e) => setHistorialSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-gray-50 transition-all"
                  />
                  {historialSearch && (
                    <button onClick={() => setHistorialSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <XIcon size={14} />
                    </button>
                  )}
                </div>
                {movimientos.length > 0 && (
                  <button
                    onClick={async () => {
                      if (!confirm('¿Estás seguro de eliminar todo el historial de movimientos? Esta acción no se puede deshacer.')) return;
                      try {
                        const res = await fetch('/api/inventario/stock', { method: 'DELETE' });
                        if (res.ok) {
                          setMovimientos([]);
                          alert('Historial de movimientos eliminado correctamente.');
                        } else {
                          const err = await res.json();
                          alert('Error: ' + (err.error || 'No se pudo eliminar el historial'));
                        }
                      } catch {
                        alert('Error de conexión al intentar eliminar el historial.');
                      }
                    }}
                    className="flex items-center justify-center w-10 h-10 sm:w-auto sm:px-3 sm:py-2 bg-red-50 text-red-600 border border-red-100 text-xs font-semibold rounded-xl hover:bg-red-100 transition-colors shrink-0"
                    title="Limpiar todo el historial"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline ml-1.5">Limpiar</span>
                  </button>
                )}
              </div>
            </div>

            {(() => {
              const term = historialSearch.toLowerCase().trim();
              const filteredMovs = movimientos.filter(m => 
                !term || 
                (m.inventario?.nombre || '').toLowerCase().includes(term) ||
                (m.inventario?.seccion || '').toLowerCase().includes(term) ||
                (m.notas || '').toLowerCase().includes(term) ||
                (m.referencia || '').toLowerCase().includes(term) ||
                (m.tipo || '').toLowerCase().includes(term)
              );

              return filteredMovs.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                  {historialSearch ? (
                    <>
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                      <p className="text-sm font-medium text-gray-900">No hay resultados para "{historialSearch}"</p>
                      <p className="text-xs text-gray-500 mt-1">Prueba buscando por otro nombre o referencia.</p>
                      <button onClick={() => setHistorialSearch('')} className="mt-3 text-sm text-blue-600 hover:underline font-medium">Borrar búsqueda</button>
                    </>
                  ) : (
                    <>
                      <History size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-medium text-gray-900">No hay movimientos registrados aún</p>
                      <p className="text-xs text-gray-500 mt-1">Los movimientos se registran automáticamente al crear pedidos o ajustar stock.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMovs.map((mov: any) => (
                  <div key={mov.id} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      mov.tipo === 'entrada' ? 'bg-green-100' : mov.tipo === 'salida' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      {mov.tipo === 'entrada' ? (
                        <Plus size={16} className="text-green-600" />
                      ) : mov.tipo === 'salida' ? (
                        <span className="text-red-600 font-bold">−</span>
                      ) : (
                        <span className="text-yellow-600">~</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        {mov.inventario?.nombre || `Item #${mov.inventario_id}`}
                        <span className="text-[10px] font-medium text-gray-500 capitalize bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                          {mov.inventario?.seccion || 'Desconocido'}
                        </span>
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2.5 text-xs">
                        <div className="bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                          <span className="text-gray-500">Tenías antes:</span>
                          <span className="ml-1.5 font-bold text-gray-800 text-sm">{mov.stock_anterior}</span>
                        </div>
                        
                        <div className={`px-2.5 py-1.5 rounded-lg font-medium shadow-sm border ${
                          mov.tipo === 'entrada' ? 'bg-green-50 text-green-700 border-green-200' : 
                          mov.tipo === 'salida' ? 'bg-red-50 text-red-700 border-red-200' : 
                          'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {mov.tipo === 'entrada' ? '+ Agregaste:' : mov.tipo === 'salida' ? '- Se vendió/retiró:' : '~ Ajustaste:'}
                          <span className="ml-1.5 font-bold text-sm">{mov.cantidad}</span>
                        </div>
                        
                        <div className="bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 shadow-sm">
                          <span className="text-blue-700">Ahora tienes:</span>
                          <span className="ml-1.5 font-extrabold text-blue-900 text-sm">{mov.stock_nuevo}</span>
                        </div>
                      </div>

                      {(mov.notas || mov.referencia) && (
                        <div className="mt-2.5 p-2 bg-gray-50 rounded-md border border-gray-100 flex items-start gap-1.5">
                          <span className="text-[11px] text-gray-400 mt-0.5">📝 Detalle:</span>
                          <p className="text-[11px] text-gray-600 leading-snug">
                            {mov.notas && <span className="italic">{mov.notas}</span>}
                            {mov.referencia && <span className="font-medium text-gray-500 ml-1">({mov.referencia} #{mov.referencia_id})</span>}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 self-start">
                      <p className="text-[10px] font-medium text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-md shadow-sm">
                        {new Date(mov.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          </div>
        ) : activeSection === 'alertas' ? (
          /* Vista de alertas de stock */
          <div>
            <h4 className="text-base font-medium text-gray-900 mb-2">Alertas de Stock Bajo</h4>
            <p className="text-xs text-gray-500 mb-4">
              Productos cuya cantidad está por debajo del mínimo establecido.
            </p>
            {itemsConBajoStock.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                <CheckCircle size={32} className="mx-auto text-green-300 mb-2" />
                <p className="text-sm text-gray-500">Todo en orden</p>
                <p className="text-xs text-gray-400 mt-1">No hay productos con stock bajo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {itemsConBajoStock.map(item => {
                  const margen = item.precio > 0 && item.costo ? ((item.precio - item.costo) / item.precio * 100).toFixed(0) : null;
                  return (
                    <div key={item.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={16} className="text-red-500 shrink-0" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{item.nombre}</h4>
                            <p className="text-xs text-gray-500">{item.categoria || item.tipo || item.seccion}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Stock actual</span>
                            <span className="font-bold text-red-600">{formatStock(item.cantidad, item.unidad || 'unid', item.nombre)}</span>
                          </div>
                          <div className="w-full bg-red-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (item.cantidad / (item.minimo || 3)) * 100)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">Mínimo: {item.minimo || 3} {item.unidad || 'unid'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-500">Precio</p>
                          <p className="text-sm font-bold text-gray-900">S/ {Number(item.precio).toFixed(2)}</p>
                          {margen && (
                            <p className={`text-xs font-medium ${Number(margen) >= 30 ? 'text-green-600' : Number(margen) > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {margen}% margen
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setFormData({
                            nombre: item.nombre,
                            categoria: item.categoria,
                            tipo: item.tipo,
                            precio: item.precio,
                            cantidad: item.cantidad,
                            unidad: item.unidad || 'unidad',
                            minimo: item.minimo || 3,
                            codigo_barras: item.codigo_barras,
                            imagen_url: item.imagen_url,
                            costo: item.costo,
                            tamanos: item.tamanos,
                          });
                          setShowModal(true);
                        }}
                        className="mt-3 w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
                      >
                        Reabastecer / Editar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeSection === 'bebidas' && showAdditionsHistory ? (
          /* Vista de historial de adiciones para Bebidas */
          <div>
            {loadingAdditions ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-400">Cargando historial de adiciones...</p>
              </div>
            ) : adiciones.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                <Wine size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No hay adiciones registradas</p>
                <p className="text-xs text-gray-400 mt-1">Las adiciones se registran automáticamente cuando el mozo agrega bebidas al inventario.</p>
              </div>
            ) : (
              <>
                {/* Buscador en el historial */}
                <div className="mb-4 relative">
                  <input
                    type="text"
                    value={adicionesSearch}
                    onChange={(e) => setAdicionesSearch(e.target.value)}
                    placeholder="🔍 Buscar en adiciones..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                  />
                </div>

                {/* Resumen por bebida */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    📊 Resumen por Bebida
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(() => {
                      // Filtrar por búsqueda
                      const adicionesFiltradas = adicionesSearch
                        ? adiciones.filter(m => (m.inventario?.nombre || '').toLowerCase().includes(adicionesSearch.toLowerCase()))
                        : adiciones;
                      // Agrupar por nombre de bebida
                      const grouped: Record<string, { total: number; count: number; precio: number; movimientos: any[] }> = {};
                      for (const mov of adicionesFiltradas) {
                        const nombre = mov.inventario?.nombre || `Item #${mov.inventario_id}`;
                        if (!grouped[nombre]) {
                          grouped[nombre] = { total: 0, count: 0, precio: mov.inventario?.precio || 0, movimientos: [] };
                        }
                        grouped[nombre].total += mov.cantidad;
                        grouped[nombre].count += 1;
                        grouped[nombre].movimientos.push(mov);
                      }
                      return Object.entries(grouped).sort((a, b) => b[1].total - a[1].total).map(([nombre, data]) => (
                        <div key={nombre} className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="text-sm font-bold text-gray-900 truncate flex-1">{nombre}</h5>
                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full ml-2 shrink-0">
                              {data.count}x
                            </span>
                          </div>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-xs text-gray-500">Total agregado</p>
                              <p className="text-xl font-bold text-green-700">{data.total} <span className="text-sm font-medium">unid</span></p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Precio</p>
                              <p className="text-sm font-bold text-gray-900">S/ {Number(data.precio).toFixed(2)}</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2">
                            Valor total: S/ {(data.total * data.precio).toFixed(2)}
                          </p>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Detalle de adiciones */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <History size={14} />
                    Detalle de Adiciones
                  </h4>
                  <div className="space-y-2">
                    {(adicionesSearch
                      ? adiciones.filter(m => (m.inventario?.nombre || '').toLowerCase().includes(adicionesSearch.toLowerCase()))
                      : adiciones
                    ).map((mov: any) => (
                      <div key={mov.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:border-green-200 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <Plus size={14} className="text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {mov.inventario?.nombre || `Item #${mov.inventario_id}`}
                            </span>
                            <span className="text-xs font-bold text-green-600">+{mov.cantidad}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Stock: {mov.stock_anterior} → {mov.stock_nuevo}
                            {mov.notas && <span className="ml-1">• {mov.notas}</span>}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-gray-400">
                            {new Date(mov.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {mov.inventario?.precio && (
                            <p className="text-[10px] text-gray-500 font-medium">
                              S/ {Number(mov.inventario.precio).toFixed(2)} c/u
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Vista de tarjetas para móvil y escritorio */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getCurrentData().map((item: any) => (                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Imagen thumbnail */}
                    {item.imagen_url ? (
                      <img
                        src={item.imagen_url}
                        alt={item.nombre}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : null}
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{item.nombre}</h4>
                      <p className="text-xs text-gray-500">{activeSection === 'tapers' ? item.tipo : item.categoria}</p>
                      {item.codigo_barras && (
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">#{item.codigo_barras}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
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
                    <p className="text-xs text-gray-500">Venta</p>
                    <p className="text-sm font-medium text-gray-900">S/ {Number(item.precio).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Stock</p>
                    <p className={`text-sm font-medium ${item.cantidad <= (item.minimo || 3) ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatStock(item.cantidad, item.unidad || 'unid', item.nombre)}
                    </p>
                  </div>
                  {item.turno && (
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.turno === 'maniana' ? 'bg-amber-100 text-amber-700' :
                        item.turno === 'tarde' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {item.turno === 'maniana' ? '🌅 Mañana' : item.turno === 'tarde' ? '☀️ Tarde' : '🔄 Ambos'}
                      </span>
                    </div>
                  )}
                  {item.costo > 0 && (
                    <>
                      <div>
                        <p className="text-xs text-gray-500">Costo</p>
                        <p className="text-sm font-medium text-gray-900">S/ {Number(item.costo).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Margen</p>
                        <p className={`text-sm font-medium ${item.precio - item.costo > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.precio > 0 ? `${(((item.precio - item.costo) / item.precio) * 100).toFixed(0)}%` : '—'}
                        </p>
                      </div>
                    </>
                  )}
                  {!item.costo && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-sm font-medium text-gray-900">S/ {(Number(item.precio) * Number(item.cantidad)).toFixed(2)}</p>
                    </div>
                  )}
                </div>

                {/* Tamaños para bebidas */}
                {item.tamanos && item.tamanos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Presentaciones</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tamanos.map((t: any, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-[10px]">
                          <span className="font-medium text-gray-700">{t.nombre}</span>
                          <span className="text-gray-400">S/ {Number(t.precio).toFixed(2)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de escáner de código de barras */}
      {showScanner && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowScanner(false);
          }}
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <InventoryBarcodeScanner
              onScan={handleBarcodeScan}
              onClose={() => setShowScanner(false)}
            />
          </div>
        </div>
      )}

      {/* Modal — responsive con scroll interno y footer fijo */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[95dvh] sm:max-h-[90vh]">
            {/* Header — siempre visible */}
            <div className="px-5 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex justify-between items-start shrink-0">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate pr-2">
                  {editingItem ? 'Editar' : 'Agregar'} {activeSection === 'comida' ? 'Platillo' : activeSection === 'bebidas' ? 'Bebida' : activeSection === 'insumos' ? 'Insumo' : 'Taper'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {editingItem ? 'Modifica los datos del elemento' : 'Completa la información'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-4 sm:py-6 overscroll-contain">
              <div className="space-y-4 sm:space-y-6">
                {/* Código de Barras */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                    <Barcode size={14} /> Código de Barras
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.codigo_barras || ''}
                      onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm"
                      placeholder="Ej: 7750101001000"
                    />
                    <button
                      type="button"
                      onClick={() => setShowScanner(true)}
                      className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 transition-colors text-gray-600"
                      title="Escanear código de barras"
                    >
                      <ScanLine size={18} />
                    </button>
                  </div>
                </div>

                {/* Imagen URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                    <ImageIcon size={14} /> URL de Imagen
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.imagen_url || ''}
                      onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                    {formData.imagen_url && (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                        <img src={formData.imagen_url} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.nombre || ''}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm"
                    placeholder={`Nombre del ${activeSection === 'comida' ? 'platillo' : activeSection === 'bebidas' ? 'bebida' : activeSection === 'insumos' ? 'insumo' : 'taper'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                    {activeSection === 'tapers' ? 'Tipo' : 'Categoría'}
                  </label>
                  <select
                    value={activeSection === 'tapers' ? (formData.tipo || '') : (formData.categoria || '')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      ...(activeSection === 'tapers' ? { tipo: e.target.value } : { categoria: e.target.value })
                    })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 bg-white text-sm"
                  >
                    <option value="">Seleccionar {activeSection === 'tapers' ? 'tipo' : 'categoría'}</option>
                    {activeSection === 'comida' && (
                      <>
                        <option value="Ceviches">Ceviches</option>
                        <option value="Platos Fuertes">Platos Fuertes</option>
                        <option value="Duo">Duo</option>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Unidad</label>
                    <select
                      value={formData.unidad || 'unidad'}
                      onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 bg-white text-sm"
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

                {/* Turno */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                    <span>🕐</span> Turno
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'ambos', label: 'Ambos' },
                      { value: 'maniana', label: '🌅 Mañana' },
                      { value: 'tarde', label: '☀️ Tarde' },
                    ].map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, turno: t.value })}
                        className={`flex-1 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                          formData.turno === t.value
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                      <DollarSign size={14} className="inline mr-1" />
                      Precio Venta
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">S/</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                        value={formData.precio || ''}
                        onChange={(e) => setFormData({ ...formData, precio: e.target.value === '' ? 0 : e.target.value })}
                        className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                      <TrendingUp size={14} className="inline mr-1" />
                      Precio Costo
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">S/</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                        value={formData.costo || ''}
                        onChange={(e) => setFormData({ ...formData, costo: e.target.value === '' ? 0 : e.target.value })}
                        className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    {formData.precio > 0 && formData.costo > 0 && (
                      <p className={`text-xs mt-1 ${formData.precio > formData.costo ? 'text-green-600' : 'text-red-600'}`}>
                        Margen: S/ {(formData.precio - formData.costo).toFixed(2)} ({((formData.precio - formData.costo) / formData.precio * 100).toFixed(0)}%)
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                    Cantidad {isFractionable(formData.nombre || '') ? '(en Vasos)' : ''}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.cantidad || ''}
                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 text-sm"
                    placeholder="0"
                  />
                  {isFractionable(formData.nombre || '') && (
                    <div className="mt-2 text-xs font-bold text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      Visual: {formatStock(formData.cantidad || 0, formData.unidad || 'unid', formData.nombre || '')}
                    </div>
                  )}
                  {isFractionable(formData.nombre || '') && (
                    <div className="flex gap-2 mt-2">
                      <button type="button" onClick={() => setFormData({...formData, cantidad: (formData.cantidad||0) + 3})} className="flex-1 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-200 transition-colors shadow-sm">+1 Jarra</button>
                      <button type="button" onClick={() => setFormData({...formData, cantidad: Math.max(0, (formData.cantidad||0) - 3)})} className="flex-1 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors border border-red-100">-1 Jarra</button>
                    </div>
                  )}
                </div>

                {/* Editor de Tamaños / Presentaciones */}
                {(activeSection === 'bebidas' || activeSection === 'comida') && (
                  <div className="border-t border-gray-100 pt-4 sm:pt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                      Tamaños / Presentaciones
                    </label>
                    <p className="text-xs text-gray-400 mb-3 sm:mb-4">
                      Agrega presentaciones como <strong>Individual</strong>, <strong>Duo</strong>, <strong>Familiar</strong> con sus precios
                    </p>
                    <div className="space-y-2 sm:space-y-3">
                      {(formData.tamanos || []).map((t: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <input
                            type="text"
                            value={t.nombre}
                            onChange={(e) => {
                              const nuevos = [...(formData.tamanos || [])];
                              nuevos[idx] = { ...nuevos[idx], nombre: e.target.value };
                              setFormData({ ...formData, tamanos: nuevos });
                            }}
                            placeholder="Nombre"
                            className="flex-1 min-w-0 px-2.5 sm:px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                          />
                          <div className="relative w-20 sm:w-24 shrink-0">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">S/</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={t.precio || ''}
                              onChange={(e) => {
                                const nuevos = [...(formData.tamanos || [])];
                                nuevos[idx] = { ...nuevos[idx], precio: parseFloat(e.target.value) || 0 };
                                setFormData({ ...formData, tamanos: nuevos });
                              }}
                              placeholder="Precio"
                              className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const nuevos = (formData.tamanos || []).filter((_: any, i: number) => i !== idx);
                              setFormData({ ...formData, tamanos: nuevos });
                            }}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          >
                            <XIcon size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const nuevos = [...(formData.tamanos || []), { nombre: '', precio: 0, costo: 0 }];
                          setFormData({ ...formData, tamanos: nuevos });
                        }}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors w-full justify-center"
                      >
                        <Plus size={14} />
                        Agregar Tamaño
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer — siempre visible al final del scroll */}
            <div className="px-5 sm:px-8 py-4 sm:py-6 bg-gray-50 rounded-b-2xl border-t border-gray-100 shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 text-sm font-semibold"
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