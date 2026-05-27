'use client';

import { useState, useEffect } from 'react';
import { Settings, Users as UsersIcon, Link as LinkIcon, Unlink, Plus, X, Minus, CheckCircle, Package, OctagonX, LayoutGrid, Clock, Wine } from 'lucide-react';
import { addToSyncQueue } from '@/components/ServiceWorkerRegister';
import { subscribeInventario, type InventarioItem } from '@/lib/db';
import NotificacionesToast from '@/components/NotificacionesToast';

interface MesaConfig {
  id: string;
  nombre: string;
  sillas: number;
  unidaCon: string[];
}

const DEFAULT_MESAS: MesaConfig[] = Array.from({ length: 12 }).map((_, i) => ({
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

type MenuItem = { name: string; price: number; category: string };

type DiaSemana = 'dom' | 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab';

const DIAS: DiaSemana[] = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
const DIAS_LABEL: Record<DiaSemana, string> = {
  dom: 'Domingo', lun: 'Lunes', mar: 'Martes', mie: 'Miércoles',
  jue: 'Jueves', vie: 'Viernes', sab: 'Sábado',
};

interface TurnoHorario {
  inicio: string;
  fin: string;
}

interface TurnosConfig {
  mañana: Record<DiaSemana, TurnoHorario | null>;
  noche: Record<DiaSemana, TurnoHorario | null>;
}

const TURNOS_CONFIG_DEFAULT: TurnosConfig = {
  mañana: {
    dom: { inicio: '08:00', fin: '17:00' },
    lun: null,
    mar: { inicio: '09:00', fin: '16:00' },
    mie: { inicio: '09:00', fin: '16:00' },
    jue: { inicio: '09:00', fin: '16:00' },
    vie: { inicio: '09:00', fin: '16:00' },
    sab: { inicio: '08:00', fin: '17:00' },
  },
  noche: {
    dom: { inicio: '17:00', fin: '23:00' },
    lun: null,
    mar: { inicio: '16:00', fin: '23:00' },
    mie: { inicio: '16:00', fin: '23:00' },
    jue: { inicio: '16:00', fin: '23:00' },
    vie: { inicio: '16:00', fin: '23:00' },
    sab: { inicio: '17:00', fin: '23:00' },
  },
};

function getTurnosConfig(): TurnosConfig {
  try {
    const raw = localStorage.getItem('ph_turnos_config');
    if (raw) return JSON.parse(raw);
  } catch {}
  return TURNOS_CONFIG_DEFAULT;
}

function getHoraMinutos(h: string): number {
  const [hor, min] = h.split(':').map(Number);
  return hor * 60 + min;
}

function validarTurnoActivo(turno: string | undefined | null): { activo: boolean; mensaje: string } {
  if (!turno || (turno !== 'mañana' && turno !== 'noche')) {
    return { activo: true, mensaje: '' };
  }
  
  const config = getTurnosConfig();
  const horarios = config[turno as 'mañana' | 'noche'];
  if (!horarios) return { activo: true, mensaje: '' };
  
  const ahora = new Date();
  const diaSemana = DIAS[ahora.getDay()];
  const hoyHorario = horarios[diaSemana];
  
  if (!hoyHorario) {
    return {
      activo: false,
      mensaje: `Hoy (${DIAS_LABEL[diaSemana]}) es descanso para turno ${turno === 'mañana' ? 'Mañana' : 'Noche'}`,
    };
  }
  
  const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
  const inicioMin = getHoraMinutos(hoyHorario.inicio);
  const finMin = getHoraMinutos(hoyHorario.fin);
  
  if (ahoraMin < inicioMin || ahoraMin >= finMin) {
    return {
      activo: false,
      mensaje: `Fuera de horario (turno ${turno === 'mañana' ? 'Mañana' : 'Noche'}: ${hoyHorario.inicio} - ${hoyHorario.fin})`,
    };
  }
  
  return { activo: true, mensaje: '' };
}

function getLocalDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MozoPage() {
  const [activeMesa, setActiveMesa] = useState<MesaConfig | null>(null);
  const [cart, setCart] = useState<{ name: string; price: number; qty: number; category: string; esCortesia?: boolean }[]>([]);
  const [success, setSuccess] = useState(false);
  const [mesasOcupadas, setMesasOcupadas] = useState<Set<string>>(new Set());
  const [tapers, setTapers] = useState<InventarioItem[]>([]);
  const [comidaDinamica, setComidaDinamica] = useState<InventarioItem[]>([]);
  const [bebidasDinamica, setBebidasDinamica] = useState<InventarioItem[]>([]);
  
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [mesas, setMesas] = useState<MesaConfig[]>([]);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [editingSillas, setEditingSillas] = useState<string | null>(null);
  const [turnoInfo, setTurnoInfo] = useState<{ activo: boolean; mensaje: string }>({ activo: true, mensaje: '' });
  const [showHorarioModal, setShowHorarioModal] = useState(false);
  const [horarioMensaje, setHorarioMensaje] = useState('');
  const [mozoSession, setMozoSession] = useState<{ id?: string; nombre?: string; turno?: string }>({});
  const [asistencia, setAsistencia] = useState<{ id: number; hora_llegada: string } | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [historialAsistencia, setHistorialAsistencia] = useState<{ fecha: string; hora_llegada: string }[]>([]);
  const [showHistorialAsist, setShowHistorialAsist] = useState(false);
  const [errorAsistencia, setErrorAsistencia] = useState('');
  const [activeComidaCat, setActiveComidaCat] = useState<string>('Todos');

  useEffect(() => {
    const unsubTapers = subscribeInventario('tapers', (data) => setTapers(data));
    const unsubComida = subscribeInventario('comida', (data) => setComidaDinamica(data));
    const unsubBebidas = subscribeInventario('bebidas', (data) => setBebidasDinamica(data));
    return () => {
      unsubTapers();
      unsubComida();
      unsubBebidas();
    };
  }, []);  // Sincronizar turnos config desde Supabase a localStorage
  const syncTurnosConfig = async () => {
    try {
      const res = await fetch('/api/configuracion?clave=turnos_config');
      if (res.ok) {
        const { valor } = await res.json();
        if (valor) {
          localStorage.setItem('ph_turnos_config', JSON.stringify(valor));
        }
      }
    } catch {}
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('ph_mozo_session') || '{}');
        
        try {
          const res = await fetch('/api/personal');
          if (res.ok) {
            const personal: any[] = await res.json();
            const updated = personal.find(p => p.id === session.id && p.rol === 'mozo');
            if (updated) {
              session.turno = updated.turno || session.turno;
              session.nombre = updated.nombre || session.nombre;
              localStorage.setItem('ph_mozo_session', JSON.stringify(session));
            }
          }
        } catch {}

        // Sincronizar config de turnos desde Supabase
        await syncTurnosConfig();

        setMozoSession(session);
        if (session.turno) {
          setTurnoInfo(validarTurnoActivo(session.turno));
        }
      } catch {}
    };
    
    loadSession();
    
    const interval = setInterval(async () => {
      try {
        // Sincronizar config de turnos periódicamente
        await syncTurnosConfig();
        const session = JSON.parse(localStorage.getItem('ph_mozo_session') || '{}');
        if (session.turno) {
          setTurnoInfo(validarTurnoActivo(session.turno));
        }
      } catch {}
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Verificar asistencia de hoy al cargar
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('ph_mozo_session') || '{}');
    if (!session.id) return;
    
    const hoy = new Date();
    const fechaStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    
    fetch(`/api/asistencia?usuario_id=${session.id}&fecha=${fechaStr}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (data.length > 0) {
          setAsistencia({ id: data[0].id, hora_llegada: data[0].hora_llegada });
        }
      })
      .catch(() => {});
    
    // Cargar historial de asistencias
    fetch(`/api/asistencia?usuario_id=${session.id}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (data.length > 0) {
          setHistorialAsistencia(data.slice(0, 10));
        }
      })
      .catch(() => {});
  }, []);

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
    const fetchMesas = async () => {
      try {
        const fecha = localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString();
        const res = await fetch(`/api/pedidos?fecha=${fecha}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const activas = data.filter((c: any) => c.estado !== 'Entregado');
        setMesasOcupadas(new Set(activas.map((c: any) => c.mesa || c.mesa_nombre)));
      } catch {
        try {
          const pedidos = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
          const hoy = localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString();
          const filtered = pedidos.filter((p: any) => p.fecha === hoy && p.estado !== 'Entregado');
          setMesasOcupadas(new Set(filtered.map((p: any) => p.mesa)));
        } catch {
          setMesasOcupadas(new Set());
        }
      }
    };
    
    fetchMesas();
    const interval = setInterval(fetchMesas, 5000);
    return () => clearInterval(interval);
  }, []);

  const allItems: MenuItem[] = [
    ...comidaDinamica.map(c => ({ name: c.nombre, price: c.precio, category: 'comida' as const })),
    ...bebidasDinamica.map(b => ({ name: b.nombre, price: b.precio, category: 'bebidas' as const })),
    ...tapers.map(t => ({ name: t.nombre, price: t.precio, category: 'tapers' as const })),
  ];

  const toggleCortesia = (itemName: string) => {
    setCart(prev => prev.map(c => c.name === itemName ? { ...c, esCortesia: !c.esCortesia } : c));
  };

  const updateCart = (item: MenuItem, delta: number) => {
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

  const total = cart.reduce((s, c) => c.esCortesia ? s : s + c.price * c.qty, 0);

  // ─── Render helpers ────────────────────────────────────────

  const RenderQtyControls = ({
    itemKey, itemName, itemPrice, qty, category, cart: cartProp, updateCart: updateCartProp, toggleCortesia: toggleCortesiaProp,
  }: {
    itemKey: string;
    itemName: string;
    itemPrice: number;
    qty: number;
    category: string;
    cart: { name: string; price: number; qty: number; category: string; esCortesia?: boolean }[];
    updateCart: (item: MenuItem, delta: number) => void;
    toggleCortesia: (itemName: string) => void;
  }) => (
    <div className="flex items-center gap-1.5">
      <button onClick={() => updateCartProp({ name: itemKey, price: itemPrice, category }, -1)} disabled={qty === 0}
        className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center disabled:opacity-30 hover:bg-red-100 transition-colors">
        <Minus size={12} className="text-red-500" />
      </button>
      <span className="w-5 text-center text-base font-semibold text-gray-900">{qty}</span>
      <button onClick={() => updateCartProp({ name: itemKey, price: itemPrice, category }, 1)}
        className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-200">
        <Plus size={12} />
      </button>
    </div>
  );

  const renderProductItem = (item: MenuItem, qty: number) => {
    const cartItem = cart.find(c => c.name === item.name);
    return (
      <div key={item.name} className="flex justify-between items-center rounded-xl px-4 py-3 border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-900 truncate">
            {qty > 0 && cartItem?.esCortesia && <span className="mr-1">🎁</span>}
            {item.name}
          </p>
          <p className={`text-[11px] ${qty > 0 && cartItem?.esCortesia ? 'text-amber-500' : 'text-gray-400'}`}>
            {qty > 0 && cartItem?.esCortesia ? '🎁 Cortesía' : `S/ ${Number(item.price).toFixed(2)}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {qty > 0 && (
            <button
              onClick={() => { if (cartItem) toggleCortesia(cartItem.name); }}
              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${
                cartItem?.esCortesia
                  ? 'bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100'
                  : 'bg-gray-50 border-gray-200 text-gray-300 hover:text-amber-400 hover:border-amber-200'
              }`}
              title="Marcar como Cortesía"
            >
              🎁
            </button>
          )}
          <RenderQtyControls
            itemKey={item.name}
            itemName={item.name}
            itemPrice={item.price}
            qty={qty}
            category={item.category}
            cart={cart}
            updateCart={updateCart}
            toggleCortesia={toggleCortesia}
          />
        </div>
      </div>
    );
  };

  const handleEnviar = async () => {
    if (!activeMesa || cart.length === 0) return;
    
    if (!turnoInfo.activo && mozoSession.turno) {
      setHorarioMensaje(turnoInfo.mensaje);
      setShowHorarioModal(true);
      return;
    }
    
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
      nombre: c.esCortesia ? `🎁 ${c.name.replace('||', ' ')}` : c.name.replace('||', ' '),
      cantidad: c.qty,
      precio: c.esCortesia ? 0 : c.price,
      categoria: c.category,
      notas: c.esCortesia ? '🎁 Cortesía de la Casa' : null,
    }));

    try {
      await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesa_nombre: mesaName, mozo_id: mozoId, mozo_nombre: mozoNombre, items, fecha, hora }),
      });
      
      // Solo notificar a cocina si hay items de comida
      const tieneComida = items.some(i => i.categoria === 'comida');
      if (tieneComida) {
        fetch('/api/notificaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rol_destino: 'cocina',
            titulo: 'Nueva Comanda',
            mensaje: `El ${mozoNombre} ha enviado un pedido para ${mesaName}`
          })
        }).catch(() => {});
      }

    } catch {
      addToSyncQueue('POST', '/api/pedidos', {
        mesa_nombre: mesaName, mozo_id: mozoId, mozo_nombre: mozoNombre, items, fecha, hora
      });
      const existing = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
      const nuevos = cart.map(c => ({
        id: Date.now() + Math.random(), item: c.esCortesia ? `🎁 ${c.name}` : c.name, cantidad: c.qty,
        mesa: mesaName, precio: c.esCortesia ? 0 : c.price, estado: 'Pendiente', hora,
        notas: c.esCortesia ? '🎁 Cortesía de la Casa' : '', category: c.category, fecha, mozoId, mozoNombre,
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
    <div className="animate-in fade-in duration-300">
      {/* Header minimalista */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
          <LayoutGrid size={20} className="text-blue-500" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">Mesas</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {isConfigMode ? 'Modo configuración' : 'Selecciona una mesa para tomar el pedido'}
          </p>
        </div>          {/* Asistencia */}
          {mozoSession.id && (
            asistencia ? (
              <div
                onClick={() => setShowHistorialAsist(!showHistorialAsist)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-100 text-green-700 text-xs font-medium cursor-pointer hover:bg-green-100 transition-colors"
              >
                <CheckCircle size={14} />
                {asistencia.hora_llegada.slice(0, 5)}
              </div>
            ) : (
              <button
                onClick={async () => {
                  if (!mozoSession.id || registrando) return;
                  setErrorAsistencia('');
                  
                  // Validar si hoy es día laboral
                  const config = getTurnosConfig();
                  const turno = mozoSession.turno;
                  if (turno) {
                    const diasSemana: DiaSemana[] = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
                    const diaHoy = diasSemana[new Date().getDay()];
                    const horarioHoy = config[turno as 'mañana' | 'noche']?.[diaHoy];
                    if (!horarioHoy) {
                      setErrorAsistencia(`Hoy (${DIAS_LABEL[diaHoy]}) es descanso para tu turno. No puedes registrar asistencia.`);
                      setTimeout(() => setErrorAsistencia(''), 5000);
                      return;
                    }
                  }
                  
                  setRegistrando(true);
                  try {
                    const res = await fetch('/api/asistencia', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ usuario_id: mozoSession.id }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setAsistencia({ id: data.data.id, hora_llegada: data.data.hora_llegada });
                    } else if (res.status === 409) {
                      setErrorAsistencia('Ya registraste tu asistencia hoy');
                      setTimeout(() => setErrorAsistencia(''), 3000);
                    }
                  } catch {}
                  setRegistrando(false);
                }}
                disabled={registrando}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-medium disabled:opacity-50"
              >
                <Clock size={14} />
                {registrando ? '...' : 'Asistencia'}
              </button>
            )
          )}
          <button 
            onClick={() => setIsConfigMode(!isConfigMode)}
            className={`w-9 h-9 rounded-lg transition-colors flex items-center justify-center ${
              isConfigMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Settings size={16} strokeWidth={1.5} />
          </button>
        </div>

      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-100 rounded-lg">
          <p className="text-xs font-medium text-green-700">✅ Pedido enviado correctamente</p>
        </div>
      )}

      {errorAsistencia && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs font-medium text-red-700">{errorAsistencia}</p>
        </div>
      )}

      {!turnoInfo.activo && mozoSession.turno && (
        <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-100 rounded-lg">
          <p className="text-xs font-medium text-yellow-800 flex items-center gap-1.5">
            <span>⚠️</span>
            <span>{turnoInfo.mensaje} — No puedes realizar pedidos hasta que inicie tu turno.</span>
          </p>
        </div>
      )}

      {/* Grid de mesas */}
      {!activeMesa && (
        <div>
          {isConfigMode && mergeTarget && (
            <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-medium text-blue-700 flex items-center justify-between">
                <span>Selecciona otra mesa para unir con <b>{mesas.find(x => x.id === mergeTarget)?.nombre}</b></span>
                <button onClick={() => setMergeTarget(null)} className="ml-2"><X size={14}/></button>
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2.5">
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
                    className={`w-full text-left rounded-xl border-2 transition-all ${
                      isMergeTarget
                        ? 'bg-blue-50 border-blue-400 shadow-md'
                        : isConfigMode
                          ? 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-md shadow-sm'
                          : ocupada
                            ? 'bg-white border-red-200 hover:border-red-300 hover:shadow-md shadow-sm'
                            : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 shadow-sm'
                    } p-4`}
                  >
                    <div className="font-semibold text-sm text-gray-900 mb-1.5">{dName}</div>
                    
                    {!isConfigMode ? (
                      <div className={`text-[11px] ${ocupada ? 'text-red-500' : 'text-green-600'}`}>
                        {ocupada ? 'Ocupada' : 'Disponible'}
                        <span className="text-gray-300 mx-1">·</span>
                        {mesa.unidaCon.length === 0 ? `${mesa.sillas} sillas` : 'Grupo'}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center mt-1.5">
                        <div className="flex items-center gap-1 text-gray-400 text-[11px]">
                          <UsersIcon size={12} />
                          {editingSillas === mesa.id ? (
                            <input 
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              autoFocus
                              className="w-12 border border-gray-200 rounded px-1 text-xs"
                              defaultValue={mesa.sillas}
                              onBlur={(e) => {
                                const v = parseInt(e.target.value);
                                if (v > 0) saveMesas(mesas.map(m => m.id === mesa.id ? {...m, sillas: v} : m));
                                setEditingSillas(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span onClick={(e) => { e.stopPropagation(); setEditingSillas(mesa.id); }} className="cursor-pointer hover:text-blue-600 border-b border-dashed border-gray-300">
                              {mesa.sillas} sillas
                            </span>
                          )}
                        </div>
                        {mesa.unidaCon.length > 0 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUnmerge(mesa.id); }}
                            className="text-orange-500 hover:bg-orange-50 p-1 rounded text-[10px] font-medium flex items-center gap-1"
                          >
                            <Unlink size={11} /> Separar
                          </button>
                        )}
                      </div>
                    )}
                  </button>
                  {isConfigMode && mesa.unidaCon.length > 0 && !isMergeTarget && (
                    <div className="absolute -top-1.5 -right-1.5 bg-blue-50 text-blue-500 rounded-full p-1 border border-blue-100">
                      <LinkIcon size={11} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de pedido — minimalista */}
      {activeMesa && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-medium text-gray-900">{getDisplayName(activeMesa)}</h2>
              <p className="text-[11px] text-gray-400">Selecciona los productos</p>
            </div>
            <button onClick={() => { setActiveMesa(null); setCart([]); }} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          {/* Productos */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {['comida', 'bebidas', 'tapers'].map(cat => {
              if (cat === 'comida') {
                if (comidaDinamica.length === 0) return null;
                const categories = ['Todos', ...Array.from(new Set(comidaDinamica.map(c => c.categoria || 'Otros').filter(Boolean)))];
                const filtered = activeComidaCat === 'Todos' ? comidaDinamica : comidaDinamica.filter(c => (c.categoria || 'Otros') === activeComidaCat);
                const items = filtered.map(c => ({ name: c.nombre, price: c.precio, category: 'comida' }));
                
                return (
                  <div key={cat} className="mb-2">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-[10px] font-semibold uppercase text-gray-500 tracking-wider">Carta de Platos</h3>
                    </div>
                    {/* Filtros por botones */}
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {categories.map(c => (
                        <button
                          key={c}
                          onClick={() => setActiveComidaCat(c)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 ${
                            activeComidaCat === c
                              ? 'bg-amber-500 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {items.map(item => {
                        const qty = cart.find(c => c.name === item.name)?.qty || 0;
                        return renderProductItem(item, qty);
                      })}
                    </div>
                  </div>
                );
              }
              if (cat === 'tapers') {
                const items = tapers.map(t => ({ name: t.nombre, price: t.precio, category: 'tapers' }));
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-3">
                      <Package size={14} className="text-gray-400" />
                      <h3 className="text-[10px] font-semibold uppercase text-gray-500 tracking-wider">Envases / Tapers</h3>
                      <span className="text-[10px] text-gray-300">({items.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {items.map(item => {
                        const qty = cart.find(c => c.name === item.name)?.qty || 0;
                        return renderProductItem(item, qty);
                      })}
                    </div>
                  </div>
                );
              }
              // Bebidas — con categorías, tamaños y stock
              if (cat === 'bebidas') {
                if (bebidasDinamica.length === 0) return null;
                // Agrupar por categoría
                const grouped = bebidasDinamica.reduce((acc: Record<string, typeof bebidasDinamica>, b) => {
                  const catName = b.categoria || 'Otras';
                  if (!acc[catName]) acc[catName] = [];
                  acc[catName].push(b);
                  return acc;
                }, {});
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-3">
                      <Wine size={14} className="text-gray-400" />
                      <h3 className="text-[10px] font-semibold uppercase text-gray-500 tracking-wider">Bebidas</h3>
                      <span className="text-[10px] text-gray-300">({bebidasDinamica.length})</span>
                    </div>
                    <div className="space-y-4">
                      {Object.entries(grouped).map(([catName, items]) => (
                        <div key={catName}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[11px] font-semibold text-gray-600">{catName}</span>
                            <span className="text-[10px] text-gray-300">({items.length})</span>
                          </div>
                          <div className="space-y-1.5">
                            {items.map(bebida => {
                              // Si tiene tamaños, mostrar cada tamaño como item separado
                              if (bebida.tamanos && bebida.tamanos.length > 0) {
                                return bebida.tamanos.map((t: any, ti: number) => {
                                  const itemKey = `${bebida.nombre}||${t.nombre}`;
                                  const cartItem = cart.find(c => c.name === itemKey);
                                  const qty = cartItem?.qty || 0;
                                  return (
                                    <div key={itemKey} className="flex justify-between items-center rounded-xl px-4 py-3 border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm text-gray-900 truncate">
                                          {qty > 0 && cartItem?.esCortesia && <span className="mr-1">🎁</span>}
                                          {bebida.nombre} <span className="text-gray-500 font-medium">{t.nombre}</span>
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <p className={`text-[11px] ${qty > 0 && cartItem?.esCortesia ? 'text-amber-500' : 'text-gray-400'}`}>
                                            {qty > 0 && cartItem?.esCortesia ? '🎁 Cortesía' : `S/ ${Number(t.precio).toFixed(2)}`}
                                          </p>
                                          <span className={`text-[10px] ${bebida.cantidad <= (bebida.minimo || 3) ? 'text-red-500' : 'text-gray-400'}`}>
                                            Stock: {bebida.cantidad}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                        {qty > 0 && (
                                          <button
                                            onClick={() => {
                                              const cartItemName = cart.find(c => c.name === itemKey);
                                              if (cartItemName) toggleCortesia(cartItemName.name);
                                            }}
                                            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${
                                              cartItem?.esCortesia
                                                ? 'bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100'
                                                : 'bg-gray-50 border-gray-200 text-gray-300 hover:text-amber-400 hover:border-amber-200'
                                            }`}
                                            title="Marcar como Cortesía"
                                          >
                                            🎁
                                          </button>
                                        )}
                                        <RenderQtyControls
                                          itemKey={itemKey}
                                          itemName={`${bebida.nombre} ${t.nombre}`}
                                          itemPrice={t.precio}
                                          qty={qty}
                                          category="bebidas"
                                          cart={cart}
                                          updateCart={updateCart}
                                          toggleCortesia={toggleCortesia}
                                        />
                                      </div>
                                    </div>
                                  );
                                });
                              }
                              // Sin tamaños, mostrar item normal
                              const qty = cart.find(c => c.name === bebida.nombre)?.qty || 0;
                              return (
                                <div key={bebida.id} className="flex justify-between items-center rounded-xl px-4 py-3 border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-900 truncate">
                                      {qty > 0 && cart.find(c => c.name === bebida.nombre)?.esCortesia && <span className="mr-1">🎁</span>}
                                      {bebida.nombre}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <p className={`text-[11px] ${qty > 0 && cart.find(c => c.name === bebida.nombre)?.esCortesia ? 'text-amber-500' : 'text-gray-400'}`}>
                                        {qty > 0 && cart.find(c => c.name === bebida.nombre)?.esCortesia ? '🎁 Cortesía' : `S/ ${Number(bebida.precio).toFixed(2)}`}
                                      </p>
                                      <span className={`text-[10px] ${bebida.cantidad <= (bebida.minimo || 3) ? 'text-red-500' : 'text-gray-400'}`}>
                                        Stock: {bebida.cantidad}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    <RenderQtyControls
                                      itemKey={bebida.nombre}
                                      itemName={bebida.nombre}
                                      itemPrice={bebida.precio}
                                      qty={qty}
                                      category="bebidas"
                                      cart={cart}
                                      updateCart={updateCart}
                                      toggleCortesia={toggleCortesia}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 bg-white">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-gray-400">
                {cart.reduce((s, c) => s + c.qty, 0)} productos
                {cart.some(c => c.esCortesia) && (
                  <span className="ml-2 text-amber-600">(🎁 {cart.filter(c => c.esCortesia).reduce((s, c) => s + c.qty, 0)} cortesía)</span>
                )}
              </span>
              <span className="text-lg font-medium text-gray-900">S/ {Number(total).toFixed(2)}</span>
            </div>
            <button
              onClick={handleEnviar}
              disabled={cart.length === 0}
              className="w-full bg-blue-600 text-white text-sm font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-30 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-200/50"
            >
              <CheckCircle size={18} strokeWidth={1.5} />
              Enviar a Cocina
            </button>
          </div>
        </div>
      )}

      {/* Historial de asistencias */}
      {historialAsistencia.length > 0 && showHistorialAsist && (
        <div className="mt-4 mb-6 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock size={13} />
            Historial de Asistencias
          </h3>
          <div className="space-y-1.5">
            {historialAsistencia.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-gray-50">
                <span className="text-gray-500">{a.fecha}</span>
                <span className="font-medium text-gray-700">{a.hora_llegada.slice(0, 5)} hrs</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de fuera de horario — minimalista */}
      {showHorarioModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-lg w-[90%] max-w-sm mx-auto p-6 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                <OctagonX size={24} className="text-red-500" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Fuera de Horario</h3>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
                <p className="text-xs font-medium text-amber-800">{horarioMensaje}</p>
              </div>
              <p className="text-xs text-gray-400 mb-5">
                No puedes realizar pedidos hasta que inicie tu turno.
              </p>
              <button
                onClick={() => setShowHorarioModal(false)}
                className="w-full bg-gray-900 text-white text-sm font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificacionesToast rol="mozo" usuarioId={typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('ph_mozo_session') || '{}')?.id) : undefined} />
    </div>
  );
}
