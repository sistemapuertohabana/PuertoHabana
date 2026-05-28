'use client';

import { useState, useEffect, useMemo } from 'react';
import { Wine, Package, Plus, Search, X, DollarSign, Barcode, ScanLine } from 'lucide-react';
import { subscribeInventario, addInventarioItem, updateInventarioItem, type InventarioItem } from '@/lib/db';
import InventoryBarcodeScanner from '@/components/InventoryBarcodeScanner';

type TabType = 'bebidas' | 'tapers';

export default function MozoInventarioPage() {
  const [tab, setTab] = useState<TabType>('bebidas');
  const [bebidas, setBebidas] = useState<InventarioItem[]>([]);
  const [tapers, setTapers] = useState<InventarioItem[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', precio: 0, cantidad: 0, categoria: '', unidad: 'unidad', codigo_barras: '' });
  const [adding, setAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);

  // Detail modal state
  const [detailItem, setDetailItem] = useState<InventarioItem | null>(null);
  const [updatingStock, setUpdatingStock] = useState(false);

  const handleUpdateStock = async (id: string, currentQty: number, delta: number) => {
    const newQty = Math.max(0, currentQty + delta);
    setUpdatingStock(true);
    try {
      await updateInventarioItem(tab, id, { cantidad: newQty });
      if (detailItem && detailItem.id === id) {
        setDetailItem({ ...detailItem, cantidad: newQty });
      }
      setSuccessMsg(`Stock actualizado a ${newQty}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      alert('Error al actualizar stock');
    }
    setUpdatingStock(false);
  };

  useEffect(() => {
    const unsubBebidas = subscribeInventario('bebidas', (data) => setBebidas(data));
    const unsubTapers = subscribeInventario('tapers', (data) => setTapers(data));
    return () => {
      unsubBebidas();
      unsubTapers();
    };
  }, []);

  // Low stock detection
  const lowStockItems = useMemo(() => {
    const all = [...bebidas, ...tapers];
    return all.filter(i => i.cantidad <= (i.minimo || 3));
  }, [bebidas, tapers]);

  const currentData = tab === 'bebidas' ? bebidas : tapers;

  const filtered = search
    ? currentData.filter(item =>
        item.nombre.toLowerCase().includes(search.toLowerCase())
      )
    : currentData;

  // Handle barcode scan result
  const handleBarcodeScan = (result: { barcode: string; productInfo?: { nombre?: string; precio?: number } }) => {
    setFormData({
      nombre: result.productInfo?.nombre || formData.nombre || '',
      precio: result.productInfo?.precio ?? formData.precio ?? 0,
      cantidad: formData.cantidad || 0,
      categoria: formData.categoria || '',
      unidad: formData.unidad || 'unidad',
      codigo_barras: result.barcode || formData.codigo_barras || '',
    });
    setShowScanner(false);
    setShowAddModal(true);
  };

  const handleAdd = async () => {
    if (!formData.nombre.trim() || formData.precio <= 0) {
      alert('Ingresa al menos el nombre y precio');
      return;
    }
    setAdding(true);
    try {
      await addInventarioItem(tab, {
        nombre: formData.nombre.trim(),
        precio: formData.precio,
        cantidad: formData.cantidad || 0,
        categoria: formData.categoria || (tab === 'bebidas' ? 'Refrescos' : 'Envase'),
        unidad: formData.unidad || 'unidad',
      });
      setSuccessMsg(`✅ "${formData.nombre}" agregado a ${tab}`);
      setFormData({ nombre: '', precio: 0, cantidad: 0, categoria: '', unidad: 'unidad', codigo_barras: '' });
      setShowAddModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      alert('Error al agregar. Intenta de nuevo.');
    }
    setAdding(false);
  };

  return (
    <div className="animate-in fade-in duration-300 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500 mt-1">Bebidas y tapers disponibles</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowScanner(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-semibold shadow-md"
          >
            <Barcode size={16} />
            Escanear
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold shadow-md"
          >
            <Plus size={16} />
            Agregar {tab === 'bebidas' ? 'Bebida' : 'Taper'}
          </button>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm font-medium text-green-700">
          {successMsg}
        </div>
      )}

      {/* Alerta de stock bajo */}
      {lowStockItems.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5 shrink-0">⚠️</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-red-800">
                Stock Bajo — {lowStockItems.length} producto{lowStockItems.length !== 1 ? 's' : ''} por agotarse
              </h3>
              <p className="text-[10px] text-red-600 mt-0.5 mb-2">
                Reponer a tiempo para evitar quedarte sin stock
              </p>
              <div className="flex flex-wrap gap-1.5">
                {lowStockItems.map(item => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-red-200 rounded-full text-[10px] font-medium text-red-700"
                  >
                    {item.nombre}
                    <span className="text-red-400 font-semibold">({item.cantidad} {item.unidad || 'unid'})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
        <button
          onClick={() => setTab('bebidas')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            tab === 'bebidas'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wine size={16} />
          Bebidas
          <span className="text-xs text-gray-400">({bebidas.length})</span>
        </button>
        <button
          onClick={() => setTab('tapers')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            tab === 'tapers'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package size={16} />
          Tapers
          <span className="text-xs text-gray-400">({tapers.length})</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Buscar ${tab}...`}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
          {tab === 'bebidas' ? (
            <Wine size={48} className="mx-auto text-gray-200 mb-3" />
          ) : (
            <Package size={48} className="mx-auto text-gray-200 mb-3" />
          )}
          <p className="text-sm text-gray-500">
            {search ? 'Sin resultados' : `No hay ${tab} registrados`}
          </p>
          {!search && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Agregar {tab === 'bebidas' ? 'bebida' : 'taper'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setDetailItem(item)}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{item.nombre}</h3>
                  <p className="text-xs text-gray-400">
                    {item.categoria || item.tipo || tab}
                  </p>
                </div>
                <span className="text-sm font-bold text-blue-600 shrink-0 ml-2">
                  S/ {Number(item.precio).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs mt-3">
                <span className="text-gray-500">
                  Stock:{' '}
                  <span
                    className={`font-semibold ${
                      item.cantidad <= (item.minimo || 3)
                        ? 'text-red-600'
                        : 'text-gray-800'
                    }`}
                  >
                    {item.cantidad} {item.unidad || 'unid'}
                  </span>
                </span>
                {item.costo != null && Number(item.costo) > 0 && (
                  <span className="text-gray-400">Costo: S/ {Number(item.costo).toFixed(2)}</span>
                )}
              </div>

              {/* Tamaños para bebidas */}
              {item.tamanos && item.tamanos.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1">
                    {item.tamanos.map((t: any, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-md text-[10px]"
                      >
                        <span className="font-medium text-gray-600">{t.nombre}</span>
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

      {/* Modal detallado del producto */}
      {detailItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailItem(null);
          }}
        >
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-gray-900 truncate">{detailItem.nombre}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {detailItem.categoria || detailItem.tipo || tab}
                </p>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0 ml-2"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-4">
              {/* Precios */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider">Precio Venta</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    S/ {Number(detailItem.precio).toFixed(2)}
                  </p>
                </div>
                <div className={`rounded-xl p-4 border ${
                  detailItem.cantidad <= (detailItem.minimo || 3)
                    ? 'bg-red-50 border-red-100'
                    : 'bg-green-50 border-green-100'
                }`}>
                  <p className="text-xs font-semibold uppercase tracking-wider ${
                    detailItem.cantidad <= (detailItem.minimo || 3)
                      ? 'text-red-500'
                      : 'text-green-500'
                  }">Stock</p>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={() => handleUpdateStock(detailItem.id, detailItem.cantidad, -1)}
                      disabled={updatingStock || detailItem.cantidad <= 0}
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 font-bold"
                    >
                      -
                    </button>
                    <p className={`text-2xl font-bold ${
                      detailItem.cantidad <= (detailItem.minimo || 3)
                        ? 'text-red-700'
                        : 'text-green-700'
                    }`}>
                      {detailItem.cantidad} <span className="text-sm font-medium">{detailItem.unidad || 'unid'}</span>
                    </p>
                    <button
                      onClick={() => handleUpdateStock(detailItem.id, detailItem.cantidad, 1)}
                      disabled={updatingStock}
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Costo y margen */}
              {detailItem.costo != null && Number(detailItem.costo) > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Costo</p>
                      <p className="text-sm font-bold text-gray-900">S/ {Number(detailItem.costo).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Ganancia</p>
                      <p className="text-sm font-bold text-emerald-600">
                        S/ {(Number(detailItem.precio) - Number(detailItem.costo)).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Margen</p>
                      <p className={`text-sm font-bold ${
                        detailItem.precio > detailItem.costo ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {detailItem.precio > 0
                          ? `${((detailItem.precio - detailItem.costo) / detailItem.precio * 100).toFixed(0)}%`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tamaños/Presentaciones */}
              {detailItem.tamanos && detailItem.tamanos.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Presentaciones
                  </h4>
                  <div className="space-y-2">
                    {detailItem.tamanos.map((t: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                        <span className="text-sm font-medium text-gray-900">{t.nombre}</span>
                        <span className="text-sm font-bold text-blue-600">S/ {Number(t.precio).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Código de barras */}
              {detailItem.codigo_barras && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Código de Barras</p>
                  <p className="text-sm font-mono font-medium text-gray-700 mt-1">{detailItem.codigo_barras}</p>
                </div>
              )}

              {/* Valor total */}
              <div className="bg-gray-900 rounded-xl p-4 text-white">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Valor Total en Stock</p>
                <p className="text-xl font-bold mt-1">
                  S/ {(Number(detailItem.precio) * Number(detailItem.cantidad)).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setDetailItem(null)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90dvh]">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Agregar {tab === 'bebidas' ? 'Bebida' : 'Taper'}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Escanea o completa los datos
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Escanear código de barras */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Escanear Código</p>
                  <button
                    onClick={() => setShowScanner(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <ScanLine size={14} />
                    Escanear
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.codigo_barras || ''}
                    onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                    placeholder="Código de barras..."
                  />
                  <button
                    onClick={async () => {
                      if (!formData.codigo_barras) return;
                      try {
                        const res = await fetch(`/api/inventario?codigo_barras=${encodeURIComponent(formData.codigo_barras)}`);
                        if (res.ok) {
                          const data = await res.json();
                          if (data && data.length > 0) {
                            const p = data[0];
                            setFormData({
                              nombre: p.nombre || formData.nombre,
                              precio: p.precio || formData.precio,
                              cantidad: formData.cantidad,
                              categoria: p.categoria || formData.categoria,
                              unidad: p.unidad || formData.unidad,
                              codigo_barras: p.codigo_barras || formData.codigo_barras || '',
                            });
                            alert(`✅ Producto encontrado: ${p.nombre}`);
                          } else {
                            alert('⚠️ Producto no encontrado en inventario');
                          }
                        }
                      } catch {
                        alert('⚠️ Error al buscar producto');
                      }
                    }}
                    className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
                  >
                    Buscar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                  placeholder={`Nombre del ${tab === 'bebidas' ? 'bebida' : 'taper'}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Categoría / Tipo</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm bg-white"
                >
                  <option value="">
                    {tab === 'bebidas' ? 'Seleccionar categoría' : 'Seleccionar tipo'}
                  </option>
                  {tab === 'bebidas' ? (
                    <>
                      <option value="Gaseosas">Gaseosas</option>
                      <option value="Chichas">Chichas</option>
                      <option value="Cervezas">Cervezas</option>
                      <option value="Sporade">Sporade</option>
                      <option value="Aguas">Aguas</option>
                    </>
                  ) : (
                    <>
                      <option value="Envase">Envase</option>
                      <option value="Empaque">Empaque</option>
                      <option value="Accesorios">Accesorios</option>
                      <option value="Utensilios">Utensilios</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    <DollarSign size={14} className="inline mr-1" />
                    Precio
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.precio || ''}
                      onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cantidad</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.cantidad || ''}
                    onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unidad</label>
                <select
                  value={formData.unidad}
                  onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm bg-white"
                >
                  <option value="unidad">Unidad</option>
                  <option value="botella">Botella</option>
                  <option value="lata">Lata</option>
                  <option value="L">Litro</option>
                  <option value="ml">Mililitro</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100 shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdd}
                  disabled={adding || !formData.nombre.trim()}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-50 shadow-md"
                >
                  {adding ? 'Agregando...' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
