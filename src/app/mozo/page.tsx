'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Link as LinkIcon, X, Minus, CheckCircle, Users, Edit2, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchMesas, juntarMesas, separarMesas, updateMesa } from '@/lib/db/mesas';
import { fetchProductosActivos } from '@/lib/db/productos';
import { createComandaWithItems } from '@/lib/db/pedidos';
import { getLocalDateString } from '@/hooks/usePedidosRealtime';
import { createClient } from '@/lib/supabase/client';
import type { MesaRow, ProductoRow } from '@/lib/database.types';
import CobrarBoleta from '@/components/CobrarBoleta';
import { fetchPedidosByFecha } from '@/lib/db/pedidos';
import { flatToPedidoUI } from '@/lib/pedido-mapper';

export default function MozoMesasPage() {
  const { profile } = useAuth();
  const [mesas, setMesas] = useState<MesaRow[]>([]);
  const [productos, setProductos] = useState<ProductoRow[]>([]);
  const [isJoinMode, setIsJoinMode] = useState(false);
  const [selectedMesas, setSelectedMesas] = useState<number[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [activeMesaIds, setActiveMesaIds] = useState<number[]>([]);
  const [cart, setCart] = useState<{ id: number; qty: number }[]>([]);
  const [editingCapacidad, setEditingCapacidad] = useState<number | null>(null);
  const [tempCapacidad, setTempCapacidad] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [openComanda, setOpenComanda] = useState<{
    comandaId: string;
    mesaId: number;
    mesaLabel: string;
    hora: string;
    pedidos: ReturnType<typeof flatToPedidoUI>[];
  } | null>(null);
  const [showCobrar, setShowCobrar] = useState(false);

  const syncDate = () => {
    setCurrentDate(localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString());
  };

  const loadMesas = useCallback(async () => {
    const data = await fetchMesas();
    setMesas(data);
  }, []);

  const loadProductos = useCallback(async () => {
    const data = await fetchProductosActivos();
    setProductos(data);
  }, []);

  useEffect(() => {
    setMounted(true);
    syncDate();
    loadMesas();
    loadProductos();

    const supabase = createClient();
    const channel = supabase
      .channel('mozo-mesas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, () => loadMesas())
      .subscribe();

    window.addEventListener('storage', syncDate);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('storage', syncDate);
    };
  }, [loadMesas, loadProductos]);

  const handleMesaClick = (id: number) => {
    if (!isJoinMode) return;
    if (selectedMesas.includes(id)) {
      setSelectedMesas(selectedMesas.filter((m) => m !== id));
    } else if (selectedMesas.length < 2) {
      setSelectedMesas([...selectedMesas, id]);
    }
  };

  const juntarMesasHandler = async () => {
    if (selectedMesas.length !== 2) return;
    await juntarMesas(selectedMesas[0], selectedMesas[1]);
    setIsJoinMode(false);
    setSelectedMesas([]);
    await loadMesas();
  };

  const separarMesasHandler = async (a: number, b: number) => {
    await separarMesas(a, b);
    await loadMesas();
  };

  const openOrder = (ids: number[]) => {
    if (isJoinMode) return;
    setActiveMesaIds(ids);
    setCart([]);
    setIsOrderModalOpen(true);
    setShowCobrar(false);
    setOpenComanda(null);
  };

  const openCobrar = async (mesaId: number, mesaLabel: string) => {
    const fecha = currentDate || getLocalDateString();
    const flat = await fetchPedidosByFecha(fecha);
    const pedidos = flat
      .map(flatToPedidoUI)
      .filter((p) => p.mesaId === mesaId && p.comanda_estado !== 'cerrada');
    const comandaId = pedidos[0]?.comandaId;
    if (!comandaId || !pedidos.length) {
      alert('No hay comanda abierta para esta mesa.');
      return;
    }
    setOpenComanda({
      comandaId,
      mesaId,
      mesaLabel,
      hora: pedidos[0].hora,
      pedidos,
    });
    setShowCobrar(true);
  };

  const updateCart = (productoId: number, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === productoId);
      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) return prev.filter((i) => i.id !== productoId);
        return prev.map((i) => (i.id === productoId ? { ...i, qty: newQty } : i));
      }
      if (delta > 0) return [...prev, { id: productoId, qty: delta }];
      return prev;
    });
  };

  const totalCartPrice = cart.reduce((total, item) => {
    const mi = productos.find((m) => m.id === item.id);
    return total + (mi ? Number(mi.precio) * item.qty : 0);
  }, 0);

  const submitOrder = async () => {
    if (!profile) return alert('Sesión no válida');
    if (cart.length === 0) return alert('No has agregado productos a la comanda.');

    const fecha = currentDate || getLocalDateString();
    const primaryMesaId = activeMesaIds[0];

    try {
      await createComandaWithItems(
        primaryMesaId,
        profile.id,
        fecha,
        cart.map((c) => {
          const p = productos.find((m) => m.id === c.id)!;
          return {
            productoId: p.id,
            nombre: p.nombre,
            precio: Number(p.precio),
            cantidad: c.qty,
            categoria: p.categoria,
          };
        })
      );

      for (const mid of activeMesaIds) {
        await updateMesa(mid, { estado: 'Ocupada' });
      }
      await loadMesas();
      setIsOrderModalOpen(false);
      setCart([]);
      alert('¡Comanda enviada a cocina exitosamente!');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al enviar comanda');
    }
  };

  const saveCapacidad = async (id: number) => {
    if (tempCapacidad < 1) return;
    await updateMesa(id, { capacidad: tempCapacidad });
    setEditingCapacidad(null);
    await loadMesas();
  };

  const getEstadoStyles = (estado: string, isJoined: boolean) => {
    if (isJoined) return 'bg-indigo-50 border-indigo-300 text-indigo-800';
    switch (estado) {
      case 'Disponible':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'Ocupada':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'Reservada':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const processedIds = new Set<number>();
  const renderGroups: (
    | { type: 'single'; mesa: MesaRow }
    | { type: 'joined'; a: MesaRow; b: MesaRow }
  )[] = [];

  mesas.forEach((mesa) => {
    if (processedIds.has(mesa.id)) return;
    if (mesa.juntada_con_id) {
      const pareja = mesas.find((m) => m.id === mesa.juntada_con_id);
      if (pareja && !processedIds.has(pareja.id)) {
        renderGroups.push({ type: 'joined', a: mesa, b: pareja });
        processedIds.add(mesa.id);
        processedIds.add(pareja.id);
        return;
      }
    }
    renderGroups.push({ type: 'single', mesa });
    processedIds.add(mesa.id);
  });

  const getActiveLabel = () => {
    return activeMesaIds.map((id) => mesas.find((m) => m.id === id)?.numero).filter(Boolean).join(' + ');
  };

  if (!mounted) return null;

  return (
    <div className="animate-in fade-in duration-300 pb-20 lg:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl md:text-4xl font-medium text-gray-900">Mesas y Comandas</h1>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-200">
              Operando: {currentDate}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {profile ? `Mozo: ${profile.nombre}` : ''} · {isJoinMode ? `Unir mesas (${selectedMesas.length}/2)` : 'Clic en mesa para pedido o cobro.'}
          </p>
        </div>
        <div className="flex gap-2">
          {isJoinMode ? (
            <>
              <button
                onClick={() => { setIsJoinMode(false); setSelectedMesas([]); }}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium"
              >
                Cancelar
              </button>
              {selectedMesas.length >= 2 && (
                <button onClick={juntarMesasHandler} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold">
                  Confirmar Unión
                </button>
              )}
            </>
          ) : (
            <button onClick={() => setIsJoinMode(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold">
              <LinkIcon size={18} /> Unir Mesas
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {renderGroups.map((group) => {
          if (group.type === 'joined') {
            const { a, b } = group;
            return (
              <div key={`j-${a.id}-${b.id}`} className="col-span-1 sm:col-span-2">
                <div className="relative bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200/60 rounded-3xl p-6">
                  <div className="text-center mb-4 font-bold text-indigo-800">{a.numero} + {b.numero}</div>
                  <button onClick={() => openOrder([a.id, b.id])} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mb-2">
                    <Plus size={18} className="inline mr-1" /> Tomar Pedido
                  </button>
                  {a.estado === 'Ocupada' && (
                    <button onClick={() => openCobrar(a.id, `${a.numero} + ${b.numero}`)} className="w-full bg-green-600 text-white font-bold py-2 rounded-xl text-sm">
                      Cobrar / Boleta
                    </button>
                  )}
                  <button onClick={() => separarMesasHandler(a.id, b.id)} className="mt-3 text-xs text-indigo-400 w-full">
                    Separar mesas
                  </button>
                </div>
              </div>
            );
          }

          const { mesa } = group;
          const isSelected = selectedMesas.includes(mesa.id);
          return (
            <div
              key={mesa.id}
              onClick={() => (isJoinMode ? handleMesaClick(mesa.id) : openOrder([mesa.id]))}
              className={`relative rounded-3xl border-2 p-6 cursor-pointer transition-all ${getEstadoStyles(mesa.estado, false)} ${isSelected ? 'ring-4 ring-indigo-500/20' : ''}`}
            >
              <div className="text-center">
                <h3 className="text-2xl font-black mb-2">{mesa.numero}</h3>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/80">{mesa.estado}</span>
                <div className="mt-4 flex justify-center" onClick={(e) => e.stopPropagation()}>
                  {editingCapacidad === mesa.id ? (
                    <div className="flex gap-1 items-center">
                      <input type="number" value={tempCapacidad} min={1} onChange={(e) => setTempCapacidad(parseInt(e.target.value) || 1)} className="w-12 text-xs border rounded px-1" />
                      <button onClick={() => saveCapacidad(mesa.id)}><Check size={14} /></button>
                    </div>
                  ) : (
                    <span className="text-sm font-bold cursor-pointer" onClick={() => { setEditingCapacidad(mesa.id); setTempCapacidad(mesa.capacidad); }}>
                      {mesa.capacidad} sillas <Edit2 size={12} className="inline" />
                    </span>
                  )}
                </div>
                {mesa.estado === 'Ocupada' && !isJoinMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openCobrar(mesa.id, mesa.numero); }}
                    className="mt-3 w-full bg-green-600 text-white text-sm font-bold py-2 rounded-xl"
                  >
                    Cobrar / Boleta
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCobrar && openComanda && profile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-lg mb-4">Cobrar — {openComanda.mesaLabel}</h3>
            <CobrarBoleta
              pedidos={openComanda.pedidos}
              comandaId={openComanda.comandaId}
              mesaId={openComanda.mesaId}
              mesaLabel={openComanda.mesaLabel}
              mozoNombre={profile.nombre}
              fecha={currentDate}
              hora={openComanda.hora}
              userId={profile.id}
              onSuccess={() => { setShowCobrar(false); loadMesas(); }}
            />
            <button onClick={() => setShowCobrar(false)} className="mt-4 w-full text-sm text-gray-500">Cerrar</button>
          </div>
        </div>
      )}

      {isOrderModalOpen && activeMesaIds.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-bold">Nueva Comanda</h2>
                <p className="text-sm text-gray-500">{getActiveLabel()}</p>
              </div>
              <button onClick={() => setIsOrderModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {(['comida', 'bebidas'] as const).map((cat) => (
                <div key={cat}>
                  <h3 className="text-sm font-bold uppercase text-gray-400 mb-3">{cat}</h3>
                  <div className="space-y-2">
                    {productos.filter((m) => m.categoria === cat).map((item) => {
                      const qty = cart.find((c) => c.id === item.id)?.qty || 0;
                      return (
                        <div key={item.id} className="flex justify-between p-3 border rounded-xl">
                          <div>
                            <p className="font-medium text-sm">{item.nombre}</p>
                            <p className="text-xs text-gray-500">S/ {Number(item.precio).toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => updateCart(item.id, -1)} disabled={qty === 0}><Minus size={12} /></button>
                            <span className="font-semibold text-sm w-4 text-center">{qty}</span>
                            <button onClick={() => updateCart(item.id, 1)}><Plus size={12} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-5 border-t">
              <div className="flex justify-between mb-4">
                <span className="text-sm text-gray-500">Total:</span>
                <span className="text-xl font-bold">S/ {totalCartPrice.toFixed(2)}</span>
              </div>
              <button onClick={submitOrder} className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2">
                <CheckCircle size={20} /> Enviar a Cocina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
