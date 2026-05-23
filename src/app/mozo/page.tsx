'use client';

import { useState, useEffect } from 'react';
import { Settings, Users as UsersIcon, Link as LinkIcon, Unlink, Plus, X, Minus, CheckCircle } from 'lucide-react';
import NotificacionesToast from '@/components/NotificacionesToast';

interface MesaConfig {
  id: string;
  nombre: string;
  sillas: number;
  unidaCon: string[];
}

const DEFAULT_MESAS: MesaConfig[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `mesa-${i + 1}`,
  nombre: `Mesa ${i + 1}`,
  sillas: 4,
  unidaCon: [],
}));

const MENU = [
  { name: 'Ceviche Mixto', price: 45.00, category: 'comida' as const },
  { name: 'Ceviche de Pescado', price: 42.00, category: 'comida' as const },
  { name: 'Arroz con Mariscos', price: 38.00, category: 'comida' as const },
  { name: 'Lomo Saltado', price: 32.00, category: 'comida' as const },
  { name: 'Jalea Mixta', price: 40.00, category: 'comida' as const },
  { name: 'Leche de Tigre', price: 20.00, category: 'comida' as const },
  { name: 'Cerveza Pilsner', price: 12.00, category: 'bebidas' as const },
  { name: 'Inca Kola', price: 5.00, category: 'bebidas' as const },
  { name: 'Chicha Morada', price: 8.00, category: 'bebidas' as const },
  { name: 'Jugo de Naranja', price: 8.00, category: 'bebidas' as const },
];

function getLocalDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MozoPage() {
  const [activeMesa, setActiveMesa] = useState<MesaConfig | null>(null);
  const [cart, setCart] = useState<{ name: string; price: number; qty: number; category: string }[]>([]);
  const [success, setSuccess] = useState(false);
  const [mesasOcupadas, setMesasOcupadas] = useState<Set<string>>(new Set());
  
  // Config mode
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [mesas, setMesas] = useState<MesaConfig[]>([]);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [editingSillas, setEditingSillas] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('puerto_habana_mesas');
      if (stored) {
        setMesas(JSON.parse(stored));
      } else {
        setMesas(DEFAULT_MESAS);
        localStorage.setItem('puerto_habana_mesas', JSON.stringify(DEFAULT_MESAS));
      }
    } catch {
      setMesas(DEFAULT_MESAS);
    }
  }, []);

  const saveMesas = (newMesas: MesaConfig[]) => {
    setMesas(newMesas);
    localStorage.setItem('puerto_habana_mesas', JSON.stringify(newMesas));
  };

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem('ph_mozo_session') || '{}');
      const mozoId = session.id || '';
      const pedidos = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
      const hoy = localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString();
      const filtered = pedidos.filter((p: any) => p.fecha === hoy && p.estado !== 'Listo' && p.mozoId === mozoId);
      setMesasOcupadas(new Set(filtered.map((p: any) => p.mesa)));
    } catch {
      setMesasOcupadas(new Set());
    }
  }, []);

  const updateCart = (item: typeof MENU[0], delta: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.name === item.name);
      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) return prev.filter(c => c.name !== item.name);
        return prev.map(c => c.name === item.name ? { ...c, qty: newQty } : c);
      }
      if (delta > 0) return [...prev, { name: item.name, price: item.price, qty: 1, category: item.category }];
      return prev;
    });
  };

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);

  const handleEnviar = async () => {
    if (!activeMesa || cart.length === 0) return;
    const fecha = typeof window !== 'undefined'
      ? localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString()
      : getLocalDateString();
    const now = new Date();
    const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const mesaName = getDisplayName(activeMesa);

    let mozoId: string | null = null;
    let mozoNombre = 'Mozo';
    try {
      const session = JSON.parse(localStorage.getItem('ph_mozo_session') || '{}');
      if (session?.nombre) { mozoId = session.id || null; mozoNombre = session.nombre; }
    } catch {}

    const items = cart.map(c => ({
      nombre: c.name, cantidad: c.qty, precio: c.price, categoria: c.category,
    }));

    try {
      // Guardar en MySQL via API
      await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesa_nombre: mesaName, mozo_id: mozoId, mozo_nombre: mozoNombre, items, fecha, hora }),
      });
      
      // Notificar a cocina
      fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rol_destino: 'cocina',
          titulo: 'Nueva Comanda',
          mensaje: `El ${mozoNombre} ha enviado un nuevo pedido para la ${mesaName}`
        })
      }).catch(() => {});

    } catch {
      // Fallback localStorage si la API falla
      const existing = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
      const nuevos = cart.map(c => ({
        id: Date.now() + Math.random(), item: c.name, cantidad: c.qty,
        mesa: mesaName, precio: c.price, estado: 'Pendiente', hora,
        notas: '', category: c.category, fecha, mozoId, mozoNombre,
      }));
      localStorage.setItem('puerto_habana_pedidos', JSON.stringify([...nuevos, ...existing]));
    }

    setCart([]);
    setActiveMesa(null);
    setSuccess(true);
    setMesasOcupadas(prev => { const next = new Set(prev); next.add(mesaName); return next; });
    window.dispatchEvent(new Event('storage'));
    setTimeout(() => setSuccess(false), 3000);
  };

  const getDisplayName = (m: MesaConfig) => {
    if (m.unidaCon.length === 0) return m.nombre;
    const allIds = [m.id, ...m.unidaCon].sort();
    const group = mesas.filter(x => allIds.includes(x.id)).map(x => x.nombre);
    return group.join(' + ');
  };

  const getGroupLeader = (m: MesaConfig) => {
    if (m.unidaCon.length === 0) return m;
    const allIds = [m.id, ...m.unidaCon].sort();
    return mesas.find(x => x.id === allIds[0]) || m;
  };

  const handleMerge = (mesa2Id: string) => {
    if (!mergeTarget || mergeTarget === mesa2Id) {
      setMergeTarget(null);
      return;
    }
    const m1 = mesas.find(x => x.id === mergeTarget);
    const m2 = mesas.find(x => x.id === mesa2Id);
    if (!m1 || !m2) return;

    const newMesas = mesas.map(m => {
      if (m.id === m1.id) return { ...m, unidaCon: [...new Set([...m.unidaCon, m2.id, ...m2.unidaCon])] };
      if (m.id === m2.id) return { ...m, unidaCon: [...new Set([...m.unidaCon, m1.id, ...m1.unidaCon])] };
      // Also update any others already in the group
      if (m1.unidaCon.includes(m.id) || m2.unidaCon.includes(m.id)) {
         return { ...m, unidaCon: [...new Set([...m.unidaCon, m1.id, m2.id, ...m1.unidaCon, ...m2.unidaCon].filter(id => id !== m.id))] };
      }
      return m;
    });
    saveMesas(newMesas);
    setMergeTarget(null);
  };

  const handleUnmerge = (mesaId: string) => {
    const mesa = mesas.find(x => x.id === mesaId);
    if (!mesa) return;
    
    const newMesas = mesas.map(m => {
      if (m.id === mesaId) return { ...m, unidaCon: [] };
      if (mesa.unidaCon.includes(m.id)) {
        return { ...m, unidaCon: m.unidaCon.filter(id => id !== mesaId) };
      }
      return m;
    });
    saveMesas(newMesas);
  };

  // Group mesas for display
  const displayMesas: MesaConfig[] = [];
  const processed = new Set<string>();
  
  mesas.forEach(m => {
    if (processed.has(m.id)) return;
    const leader = getGroupLeader(m);
    if (!processed.has(leader.id)) {
      displayMesas.push(leader);
      leader.unidaCon.forEach(id => processed.add(id));
      processed.add(leader.id);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NotificacionesToast rol="mozo" usuarioId={typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('ph_mozo_session') || '{}')?.id) : undefined} />
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Puerto Habana — Mesas</h1>
        <button 
          onClick={() => setIsConfigMode(!isConfigMode)}
          className={`p-2 rounded-xl transition-colors ${isConfigMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          <Settings size={20} />
        </button>
      </div>

      {success && (
        <div className="mx-4 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
          ✅ Pedido enviado a cocina correctamente
        </div>
      )}

      {/* Grid de mesas */}
      {!activeMesa && (
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-4">
            {isConfigMode ? 'Modo configuración: Edita sillas o une mesas' : 'Selecciona una mesa para tomar el pedido'}
          </p>
          
          {isConfigMode && mergeTarget && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm flex justify-between items-center">
              <span>Selecciona otra mesa para unir con <b>{mesas.find(x => x.id === mergeTarget)?.nombre}</b></span>
              <button onClick={() => setMergeTarget(null)}><X size={16}/></button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {(isConfigMode ? mesas : displayMesas).map(mesa => {
              const dName = isConfigMode ? mesa.nombre : getDisplayName(mesa);
              const ocupada = !isConfigMode && mesasOcupadas.has(dName);
              const isMergeTarget = isConfigMode && mergeTarget === mesa.id;
              
              return (
                <div key={mesa.id} className="relative">
                  <button
                    onClick={() => { 
                      if (isConfigMode) {
                        if (mergeTarget) handleMerge(mesa.id);
                        else setMergeTarget(mesa.id);
                      } else {
                        setActiveMesa(mesa); 
                        setCart([]); 
                      }
                    }}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                      isMergeTarget ? 'bg-blue-50 border-blue-500 shadow-md transform scale-[1.02]' :
                      isConfigMode ? 'bg-white border-gray-200 hover:border-blue-300' :
                      ocupada
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-green-50 border-green-200 text-green-700 hover:shadow-md'
                    }`}
                  >
                    <div className="font-bold text-lg mb-1">{dName}</div>
                    
                    {!isConfigMode ? (
                      <div className={`text-xs font-medium ${ocupada ? 'text-red-500' : 'text-green-600'}`}>
                        {ocupada ? 'Ocupada' : 'Disponible'} • {mesa.unidaCon.length === 0 ? `${mesa.sillas} sillas` : 'Grupo'}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <UsersIcon size={12} />
                          {editingSillas === mesa.id ? (
                            <input 
                              type="number"
                              autoFocus
                              className="w-12 border border-gray-300 rounded px-1"
                              defaultValue={mesa.sillas}
                              onBlur={(e) => {
                                const v = parseInt(e.target.value);
                                if (v > 0) saveMesas(mesas.map(m => m.id === mesa.id ? {...m, sillas: v} : m));
                                setEditingSillas(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span onClick={(e) => { e.stopPropagation(); setEditingSillas(mesa.id); }} className="cursor-pointer hover:text-blue-600 border-b border-dashed border-gray-400">
                              {mesa.sillas} sillas
                            </span>
                          )}
                        </div>
                        {mesa.unidaCon.length > 0 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUnmerge(mesa.id); }}
                            className="text-orange-500 hover:bg-orange-50 p-1 rounded flex items-center gap-1 text-[10px] font-bold uppercase"
                          >
                            <Unlink size={12} /> Separar
                          </button>
                        )}
                      </div>
                    )}
                  </button>
                  {isConfigMode && mesa.unidaCon.length > 0 && !isMergeTarget && (
                    <div className="absolute -top-2 -right-2 bg-blue-100 text-blue-600 rounded-full p-1 border border-blue-200 shadow-sm" title="Unida">
                      <LinkIcon size={12} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de pedido */}
      {activeMesa && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white sticky top-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{getDisplayName(activeMesa)}</h2>
              <p className="text-xs text-gray-500">Selecciona los productos</p>
            </div>
            <button onClick={() => { setActiveMesa(null); setCart([]); }} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {(['comida', 'bebidas'] as const).map(cat => (
              <div key={cat}>
                <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">{cat}</h3>
                <div className="space-y-2">
                  {MENU.filter(m => m.category === cat).map(item => {
                    const qty = cart.find(c => c.name === item.name)?.qty || 0;
                    return (
                      <div key={item.name} className="flex justify-between items-center bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">S/ {Number(item.price).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateCart(item, -1)} disabled={qty === 0}
                            className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center disabled:opacity-30">
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center font-semibold text-sm">{qty}</span>
                          <button onClick={() => updateCart(item, 1)}
                            className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-500">{cart.reduce((s, c) => s + c.qty, 0)} productos</span>
              <span className="text-xl font-bold text-gray-900">S/ {Number(total).toFixed(2)}</span>
            </div>
            <button
              onClick={handleEnviar}
              disabled={cart.length === 0}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              <CheckCircle size={20} />
              Enviar a Cocina
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
