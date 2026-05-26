'use client';

import { useState, useEffect } from 'react';
import { Wine, Package, Plus, Search, X, DollarSign } from 'lucide-react';
import { subscribeInventario, addInventarioItem, type InventarioItem } from '@/lib/db';

type TabType = 'bebidas' | 'tapers';

export default function MozoInventarioPage() {
  const [tab, setTab] = useState<TabType>('bebidas');
  const [bebidas, setBebidas] = useState<InventarioItem[]>([]);
  const [tapers, setTapers] = useState<InventarioItem[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', precio: 0, cantidad: 0, categoria: '', unidad: 'unidad' });
  const [adding, setAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const unsubBebidas = subscribeInventario('bebidas', (data) => setBebidas(data));
    const unsubTapers = subscribeInventario('tapers', (data) => setTapers(data));
    return () => {
      unsubBebidas();
      unsubTapers();
    };
  }, []);

  const currentData = tab === 'bebidas' ? bebidas : tapers;

  const filtered = search
    ? currentData.filter(item =>
        item.nombre.toLowerCase().includes(search.toLowerCase())
      )
    : currentData;

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
      setFormData({ nombre: '', precio: 0, cantidad: 0, categoria: '', unidad: 'unidad' });
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
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold shadow-md"
        >
          <Plus size={16} />
          Agregar {tab === 'bebidas' ? 'Bebida' : 'Taper'}
        </button>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm font-medium text-green-700">
          {successMsg}
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
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
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
                      item.cantidad <= (item.minimo || 5)
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
                  El administrador podrá editar los detalles después
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
                      <option value="Cervezas">Cervezas</option>
                      <option value="Refrescos">Refrescos</option>
                      <option value="Cócteles">Cócteles</option>
                      <option value="Jugos">Jugos</option>
                      <option value="Vinos">Vinos</option>
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
