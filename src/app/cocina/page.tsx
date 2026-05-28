// Cocina — lee comandas desde MySQL API con polling cada 5s
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Check, Clock, UtensilsCrossed, ChefHat, CheckCircle, MessageSquareText, Timer, AlertCircle, Eye, ListOrdered, User, Hash, Tag } from 'lucide-react';
import { addToSyncQueue } from '@/components/ServiceWorkerRegister';
import Modal from '@/components/Modal';

// ── Sonido de alerta para comandas con notas (Web Audio API) ──
let audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx;
}

async function playComandaConNotasSound() {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') await ctx.resume();

    // Tres tonos ascendentes: más notorio que el sonido normal
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 — acorde mayor ascendente
    const startTime = ctx.currentTime + 0.05;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + i * 0.15);
      gain.gain.setValueAtTime(0.4, startTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.15 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime + i * 0.15);
      osc.stop(startTime + i * 0.15 + 0.3);
    });

    // También intentar el MP3 como refuerzo
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  } catch {}
}

interface Pedido {
  id: number;
  mesa: string;
  mozo_id?: string;
  mozo_nombre?: string;
  estado: string;
  hora: string;
  fecha: string;
  notas?: string;
  items?: { nombre: string; cantidad: number; notas?: string; categoria?: string }[];
}

function getLocalDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CocinaPage() {
  const [pedidos,     setPedidos]     = useState<Pedido[]>([]);
  const [todosPedidos, setTodosPedidos] = useState<Pedido[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [asistencia, setAsistencia] = useState<{ id: number; hora_llegada: string } | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [cocinaSession, setCocinaSession] = useState<{ id?: string; nombre?: string; turno?: string }>({});
  const [historialAsistencia, setHistorialAsistencia] = useState<{ fecha: string; hora_llegada: string }[]>([]);
  const [showHistorialAsist, setShowHistorialAsist] = useState(false);
  const [errorAsistencia, setErrorAsistencia] = useState('');
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const prevPedidoIdsRef = useRef<Set<number>>(new Set());
  const [nuevaConNotas, setNuevaConNotas] = useState<{ mesa: string; mozo: string; itemsConNotas: number } | null>(null);
  const nuevaConNotasTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [fecha] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString()
      : getLocalDateString()
  );

  // Sincronizar turnos config desde Supabase a localStorage
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

  // Refrescar sesión desde la API para recoger cambios hechos por el admin (turno, foto, etc.)
  useEffect(() => {
    const loadSession = async () => {
      try {
        const stored = localStorage.getItem('ph_cocina_session');
        if (!stored) return;
        const sess = JSON.parse(stored);
        setCocinaSession(sess);
        
        // Sincronizar config de turnos desde Supabase
        await syncTurnosConfig();
        
        // Verificar asistencia de hoy
        const hoy = new Date();
        const fechaStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
        fetch(`/api/asistencia?usuario_id=${sess.id}&fecha=${fechaStr}`)
          .then(res => res.ok ? res.json() : [])
          .then(data => {
            if (data.length > 0) {
              setAsistencia({ id: data[0].id, hora_llegada: data[0].hora_llegada });
            }
          })
          .catch(() => {});
        
        // Cargar historial de asistencias
        fetch(`/api/asistencia?usuario_id=${sess.id}`)
          .then(res => res.ok ? res.json() : [])
          .then(data => {
            if (data.length > 0) {
              setHistorialAsistencia(data.slice(0, 10));
            }
          })
          .catch(() => {});
        
        try {
          const res = await fetch('/api/personal');
          if (res.ok) {
            const personal: any[] = await res.json();
            const updated = personal.find(p => p.id === sess.id && (p.rol === 'cocina' || p.rol === 'ayudante_cocina'));
            if (updated) {
              sess.turno = updated.turno || sess.turno;
              sess.nombre = updated.nombre || sess.nombre;
              sess.foto_url = updated.foto_url || sess.foto_url;
              localStorage.setItem('ph_cocina_session', JSON.stringify(sess));
              setCocinaSession({ ...sess });
            }
          }
        } catch {}
      } catch {}
    };
    loadSession();
  }, []);

  const loadPedidos = useCallback(async () => {
    try {
      const url = `/api/pedidos?fecha=${fecha}&_=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data: Pedido[] = await res.json();
      setTodosPedidos(data);
      setPedidos(showHistory ? data.filter(p => p.estado === 'Entregado') : data.filter(p => p.estado !== 'Entregado'));
    } catch {
      try {
        const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
        const todays = all.filter((p: any) => p.fecha === fecha);
        setTodosPedidos(todays);
        setPedidos(showHistory
          ? todays.filter((p: any) => p.estado === 'Entregado')
          : todays.filter((p: any) => p.estado !== 'Entregado'));
      } catch { setPedidos([]); }
    }
  }, [fecha, showHistory]);

  useEffect(() => {
    loadPedidos();
    const interval = setInterval(loadPedidos, 5000);
    const configInterval = setInterval(syncTurnosConfig, 30000);
    window.addEventListener('storage', loadPedidos);
    return () => { clearInterval(interval); clearInterval(configInterval); window.removeEventListener('storage', loadPedidos); };
  }, [loadPedidos]);

  // ── Detectar nuevas comandas con notas del mozo y reproducir sonido ──
  useEffect(() => {
    if (showHistory) return; // solo en vista activa

    const currentIds = new Set(pedidos.map(p => p.id));
    const prevIds = prevPedidoIdsRef.current;

    // Si es la primera carga, solo guardar IDs sin sonido
    if (prevIds.size === 0) {
      prevPedidoIdsRef.current = currentIds;
      return;
    }

    // Buscar pedidos nuevos que tengan notas del mozo
    for (const pedido of pedidos) {
      if (!prevIds.has(pedido.id) && pedido.estado === 'Pendiente') {
        const itemsConNotas = pedido.items?.filter(i => i.notas && i.notas.trim()) || [];
        if (itemsConNotas.length > 0) {
          // 🔊 Reproducir sonido distintivo
          playComandaConNotasSound();

          // 📳 Vibración
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([300, 150, 300, 150, 300]);
          }

          // Mostrar indicador visual
          setNuevaConNotas({
            mesa: pedido.mesa,
            mozo: pedido.mozo_nombre || 'Mozo',
            itemsConNotas: itemsConNotas.length,
          });

          // Limpiar timeout anterior y agendar nuevo
          if (nuevaConNotasTimeoutRef.current) clearTimeout(nuevaConNotasTimeoutRef.current);
          nuevaConNotasTimeoutRef.current = setTimeout(() => {
            setNuevaConNotas(null);
            nuevaConNotasTimeoutRef.current = null;
          }, 6000);

          break; // un solo sonido por ciclo de polling
        }
      }
    }

    // Actualizar IDs conocidos
    prevPedidoIdsRef.current = currentIds;

    return () => {
      if (nuevaConNotasTimeoutRef.current) clearTimeout(nuevaConNotasTimeoutRef.current);
    };
  }, [pedidos, showHistory]);

  const updateEstado = async (id: number, nuevoEstado: string) => {
    try {
      await fetch(`/api/pedidos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (nuevoEstado === 'Listo') {
        const comanda = pedidos.find(p => p.id === id);
        if (comanda?.mozo_id) {
          fetch('/api/notificaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              usuario_id: comanda.mozo_id,
              titulo: 'Comanda Lista',
              mensaje: `La orden para ${comanda.mesa} está lista para recoger.`
            })
          }).catch(() => {});
        }
      }

      setTimeout(() => loadPedidos(), 600);
    } catch {
      addToSyncQueue('PATCH', `/api/pedidos/${id}`, { estado: nuevoEstado });
      const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
      const updated = all.map((p: any) => p.id === id ? { ...p, estado: nuevoEstado } : p);
      localStorage.setItem('puerto_habana_pedidos', JSON.stringify(updated));
      loadPedidos();
      window.dispatchEvent(new Event('storage'));
    }
  };

  const estadoConfig: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
    Pendiente:  { label: 'Pendiente',  color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-200',  dot: 'bg-orange-400' },
    Preparando: { label: 'Preparando', color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',    dot: 'bg-blue-500' },
    Listo:      { label: 'Listo',      color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200',   dot: 'bg-green-500' },
    Entregado:  { label: 'Entregado',  color: 'text-gray-500',   bg: 'bg-gray-50',    border: 'border-gray-200',    dot: 'bg-gray-400' },
  };

  const estadoAccentBorder: Record<string, string> = {
    Pendiente:  'border-l-orange-400',
    Preparando: 'border-l-blue-500',
    Listo:      'border-l-green-500',
    Entregado:  'border-l-gray-300',
  };

  const getTiempoTranscurrido = (hora: string) => {
    try {
      const [h, m] = hora.split(':').map(Number);
      const ahora = new Date();
      const pedidoTime = new Date();
      pedidoTime.setHours(h, m, 0, 0);
      const diffMin = Math.floor((ahora.getTime() - pedidoTime.getTime()) / 60000);
      if (diffMin < 0) return '0 min';
      if (diffMin < 60) return `${diffMin} min`;
      const hrs = Math.floor(diffMin / 60);
      const mins = diffMin % 60;
      return `${hrs}h ${mins}min`;
    } catch { return ''; }
  };

  const tieneItemsConNotas = (items: Pedido['items']) => 
    items?.some(i => i.notas && i.notas.trim()) ?? false;

  const HORA_TURNO = 16; // antes de 16:00 = mañana, desde 16:00 = noche

  const totalPlatosDia = todosPedidos.reduce((acc, p) => {
    const food = p.items?.filter(i => i.categoria !== 'bebidas') || [];
    return acc + food.reduce((s, i) => s + i.cantidad, 0);
  }, 0);

  const platosManiana = todosPedidos
    .filter(p => parseInt((p.hora || '00:00').split(':')[0], 10) < HORA_TURNO)
    .reduce((acc, p) => {
      const food = p.items?.filter(i => i.categoria !== 'bebidas') || [];
      return acc + food.reduce((s, i) => s + i.cantidad, 0);
    }, 0);

  const platosNoche = todosPedidos
    .filter(p => parseInt((p.hora || '00:00').split(':')[0], 10) >= HORA_TURNO)
    .reduce((acc, p) => {
      const food = p.items?.filter(i => i.categoria !== 'bebidas') || [];
      return acc + food.reduce((s, i) => s + i.cantidad, 0);
    }, 0);

  // Acumulado por turno: cuántos platos se han vendido HASTA este pedido en su mismo turno
  const pedidosConAcumulado = typeof window !== 'undefined' ? (() => {
    const sorted = [...todosPedidos].sort((a, b) => a.id - b.id);
    const mapManiana = new Map<number, number>();
    const mapNoche = new Map<number, number>();
    let accM = 0, accN = 0;
    for (const p of sorted) {
      const food = p.items?.filter(i => i.categoria !== 'bebidas') || [];
      const pTotal = food.reduce((s, i) => s + i.cantidad, 0);
      const horaH = parseInt((p.hora || '00:00').split(':')[0], 10);
      if (horaH < HORA_TURNO) {
        accM += pTotal;
        mapManiana.set(p.id, accM);
      } else {
        accN += pTotal;
        mapNoche.set(p.id, accN);
      }
    }
    return { maniana: mapManiana, noche: mapNoche };
  })() : { maniana: new Map<number, number>(), noche: new Map<number, number>() };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
          <ChefHat size={20} className="text-orange-500" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">Cocina</h1>
          <p className="text-xs text-gray-400 mt-0.5">{fecha}</p>
        </div>
        {cocinaSession.id ? (
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
                if (!cocinaSession.id || registrando) return;
                setErrorAsistencia('');
                const turno = cocinaSession.turno;
                if (turno) {
                  try {
                    const raw = localStorage.getItem('ph_turnos_config');
                    if (raw) {
                      const config = JSON.parse(raw);
                      const diasSemana = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const;
                      type DiaSemana = typeof diasSemana[number];
                      const diasLabels: Record<DiaSemana, string> = {
                        dom: 'Domingo', lun: 'Lunes', mar: 'Martes', mie: 'Miércoles',
                        jue: 'Jueves', vie: 'Viernes', sab: 'Sábado',
                      };
                      const diaHoy = diasSemana[new Date().getDay()];
                      const horarioHoy = config[turno as 'mañana' | 'noche']?.[diaHoy];
                      if (!horarioHoy) {
                        setErrorAsistencia(`Hoy (${diasLabels[diaHoy]}) es descanso para tu turno.`);
                        setTimeout(() => setErrorAsistencia(''), 5000);
                        return;
                      }
                    }
                  } catch {}
                }
                setRegistrando(true);
                try {
                  const res = await fetch('/api/asistencia', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario_id: cocinaSession.id }),
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100 text-orange-600 hover:bg-orange-100 transition-colors text-xs font-medium disabled:opacity-50"
            >
              <Clock size={14} />
              {registrando ? '...' : 'Asistencia'}
            </button>
          )
        ) : null}
        <div className="text-right flex items-center gap-3">
          <div className="text-right">
            <p className="text-xl font-bold text-amber-600">{platosManiana}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">🌅 Mañana</p>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div className="text-right">
            <p className="text-xl font-bold text-indigo-600">{platosNoche}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">🌙 Noche</p>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div className="text-right">
            <p className="text-2xl font-light text-gray-900">{pedidos.length}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              {showHistory ? 'Entregadas' : 'Activas'}
            </p>
          </div>
        </div>
      </div>

      {errorAsistencia && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs font-medium text-red-700">{errorAsistencia}</p>
        </div>
      )}

      {historialAsistencia.length > 0 && showHistorialAsist && (
        <div className="mb-6 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
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

      {/* Toggle Activas / Historial */}
      <div className="flex gap-1.5 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
        <button onClick={() => setShowHistory(false)}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            !showHistory ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}>
          Activas
        </button>
        <button onClick={() => setShowHistory(true)}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            showHistory ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}>
          Historial
        </button>
      </div>

      {/* ─── Indicador de nueva comanda con notas ─── */}
      {nuevaConNotas && (
        <div className="mb-4 animate-in slide-in-from-top-3 fade-in duration-300">
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl shadow-md">
            <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
              <MessageSquareText size={16} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800">
                🔔 ¡Nueva comanda con notas del mozo!
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {nuevaConNotas.mesa} · {nuevaConNotas.mozo} · {nuevaConNotas.itemsConNotas} item{nuevaConNotas.itemsConNotas !== 1 ? 's' : ''} con nota{nuevaConNotas.itemsConNotas !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setNuevaConNotas(null)}
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition-all"
            >
              <span className="text-lg leading-none">&times;</span>
            </button>
          </div>
        </div>
      )}

      {pedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
            <UtensilsCrossed size={24} className="text-gray-300" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-gray-400 font-light">
            {showHistory ? 'No hay comandas entregadas' : 'No hay comandas activas'}
          </p>
          <p className="text-xs text-gray-300 mt-1">
            {showHistory ? '' : 'Las nuevas comandas aparecerán aquí automáticamente'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pedidos.map(p => {
            const cfg = estadoConfig[p.estado] || estadoConfig.Pendiente;
            const accentBorder = estadoAccentBorder[p.estado] || 'border-l-gray-300';
            const foodItems = p.items?.filter(item => item.categoria !== 'bebidas') || [];
            const totalPlatos = foodItems.reduce((s, i) => s + i.cantidad, 0);
            const horaH = parseInt((p.hora || '00:00').split(':')[0], 10);
            const esTurnoManiana = horaH < HORA_TURNO;
            const acumuladoTurno = esTurnoManiana
              ? (pedidosConAcumulado.maniana.get(p.id) || totalPlatos)
              : (pedidosConAcumulado.noche.get(p.id) || totalPlatos);
            const tiempo = getTiempoTranscurrido(p.hora);
            const conNotas = tieneItemsConNotas(p.items);

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border-l-4 ${accentBorder} border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
              >
                {/* ─── Header ─── */}
                <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Número de mesa grande */}
                    <div className={`w-12 h-12 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
                      <span className={`text-lg font-black ${cfg.color}`}>{p.mesa.replace('Mesa ', '')}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-gray-900">{p.mesa}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {p.hora}
                        </span>
                        <span className="text-gray-200">|</span>
                        <span className="flex items-center gap-1">
                          <Timer size={11} />
                          {tiempo}
                        </span>
                        {p.mozo_nombre && (
                          <>
                            <span className="text-gray-200">|</span>
                            <span>{p.mozo_nombre}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>                    {/* Badge total platos */}
                  <div className={`shrink-0 ${cfg.bg} ${cfg.color} px-2.5 py-1 rounded-lg border ${cfg.border} text-center`}>
                    <span className="block text-sm font-black">{totalPlatos}</span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider">Platos</span>
                  </div>
                  {/* Badge acumulado turno */}
                  <div className={`shrink-0 px-2.5 py-1 rounded-lg border text-center ${
                    horaH < HORA_TURNO
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`} title={`Platos acumulados en el turno ${horaH < HORA_TURNO ? 'mañana' : 'noche'}`}>
                    <span className="block text-sm font-black">{acumuladoTurno}</span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider">
                      {horaH < HORA_TURNO ? '🌅 Mañana' : '🌙 Noche'}
                    </span>
                  </div>
                  {/* Botón Ver detalle */}
                  <button
                    onClick={() => { setSelectedPedido(p); setShowDetailModal(true); }}
                    className="shrink-0 p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    title="Ver detalle completo"
                  >
                    <Eye size={16} />
                  </button>
                </div>

                {/* ─── Indicador de notas ─── */}
                {conNotas && (
                  <div className="mx-5 mb-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-1.5">
                    <MessageSquareText size={12} className="text-amber-600" />
                    <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                      Con notas del mozo
                    </span>
                  </div>
                )}

                {/* ─── Items ─── */}
                {foodItems.length > 0 && (
                  <div className="px-5 pb-2 space-y-1.5">
                    {foodItems.map((item, i) => (
                      <div key={i} className={`rounded-xl border p-3 transition-colors ${
                        item.notas && item.notas.trim() 
                          ? 'bg-amber-50/60 border-amber-200 border-l-2 border-l-amber-400' 
                          : 'bg-gray-50 border-gray-100'
                      }`}>
                        <div className="flex items-start gap-3">
                          {/* Cantidad grande */}
                          <span className="font-black text-gray-900 text-lg min-w-[1.8rem] text-center leading-none mt-0.5">
                            {item.cantidad}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {item.nombre.startsWith('🎁') ? (
                                <>
                                  <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm border border-amber-200">
                                    🎁 Cortesía
                                  </span>
                                  <span className="font-medium text-amber-900 text-sm">{item.nombre.replace(/^🎁\s*/, '')}</span>
                                </>
                              ) : (
                                <span className="font-medium text-gray-900 text-sm">{item.nombre}</span>
                              )}
                            </div>
                            {/* Nota del item - más visible */}
                            {item.notas && item.notas.trim() && (
                              <div className="mt-1.5 flex items-start gap-1.5 bg-white/60 rounded-lg px-2.5 py-1.5 border border-amber-100">
                                <MessageSquareText size={11} className="text-amber-500 mt-0.5 shrink-0" />
                                <span className="text-[11px] text-amber-800 font-medium leading-relaxed">
                                  {item.notas}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ─── Nota general de la comanda ─── */}
                {p.notas && (
                  <div className="mx-5 mb-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-2">
                    <AlertCircle size={13} className="text-yellow-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-yellow-800 font-medium leading-relaxed">{p.notas}</p>
                  </div>
                )}

                {/* ─── Acciones ─── */}
                {!showHistory && (
                  <div className="px-5 pt-2 pb-4">
                    {p.estado === 'Pendiente' && (
                      <button
                        onClick={() => updateEstado(p.id, 'Preparando')}
                        className="w-full text-sm font-bold py-3 rounded-xl bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                      >
                        <ChefHat size={16} />
                        Empezar a Preparar
                      </button>
                    )}
                    {p.estado === 'Preparando' && (
                      <button
                        onClick={() => updateEstado(p.id, 'Listo')}
                        className="w-full text-sm font-bold py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <Check size={18} />
                        Listo para Entregar
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal de detalle completo de comanda ─── */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedPedido(null); }}
        title={`Detalle de Comanda — ${selectedPedido?.mesa || ''}`}
      >
        {selectedPedido && (() => {
          const p = selectedPedido;
          const cfg = estadoConfig[p.estado] || estadoConfig.Pendiente;
          const allItems = p.items || [];
          const foodItems = allItems.filter(i => i.categoria !== 'bebidas');
          const bebidasItems = allItems.filter(i => i.categoria === 'bebidas');
          const itemsConNotas = allItems.filter(i => i.notas && i.notas.trim());
          const tiempoTranscurrido = getTiempoTranscurrido(p.hora);

          return (
            <div className="space-y-6">
              {/* ── Info General ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase tracking-wider font-semibold mb-2">
                    <Hash size={12} />
                    Comanda
                  </div>
                  <p className="text-lg font-bold text-gray-900">#{p.id}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase tracking-wider font-semibold mb-2">
                    <UtensilsCrossed size={12} />
                    Mesa
                  </div>
                  <p className="text-lg font-bold text-gray-900">{p.mesa}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase tracking-wider font-semibold mb-2">
                    <User size={12} />
                    Mozo
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.mozo_nombre || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase tracking-wider font-semibold mb-2">
                    <Tag size={12} />
                    Estado
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span>
                    {cfg.label}
                  </span>
                </div>
              </div>

              {/* ── Tiempo ── */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} />
                  Pedido: <strong className="text-gray-700">{p.hora}</strong>
                </span>
                <span className="text-gray-200">|</span>
                <span className="flex items-center gap-1.5">
                  <Timer size={13} />
                  Tiempo transcurrido: <strong className={`${tiempoTranscurrido.includes('h') ? 'text-orange-600' : 'text-gray-700'}`}>{tiempoTranscurrido}</strong>
                </span>
                <span className="text-gray-200">|</span>
                <span className="flex items-center gap-1.5">
                  <ListOrdered size={13} />
                  Total items: <strong className="text-gray-700">{allItems.reduce((s, i) => s + i.cantidad, 0)}</strong>
                </span>
              </div>

              {/* ── Platos ── */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ChefHat size={13} />
                  Platos ({foodItems.reduce((s, i) => s + i.cantidad, 0)} unidades)
                </h3>
                {foodItems.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Sin platos en esta comanda</p>
                ) : (
                  <div className="space-y-2">
                    {foodItems.map((item, i) => (
                      <div
                        key={i}
                        className={`rounded-xl border p-4 transition-colors ${
                          item.notas && item.notas.trim()
                            ? 'bg-amber-50/60 border-amber-200 border-l-4 border-l-amber-400'
                            : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-black text-gray-900 text-xl min-w-[2rem] text-center leading-none mt-0.5">
                            {item.cantidad}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {item.nombre.startsWith('🎁') ? (
                                <>
                                  <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                    🎁 Cortesía
                                  </span>
                                  <span className="font-medium text-amber-900 text-sm">{item.nombre.replace(/^🎁\s*/, '')}</span>
                                </>
                              ) : (
                                <span className="font-medium text-gray-900 text-sm">{item.nombre}</span>
                              )}
                              {item.categoria && (
                                <span className="text-[9px] text-gray-400 uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                  {item.categoria}
                                </span>
                              )}
                            </div>
                            {item.notas && item.notas.trim() && (
                              <div className="mt-2 flex items-start gap-1.5 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                                <MessageSquareText size={12} className="text-amber-500 mt-0.5 shrink-0" />
                                <span className="text-xs text-amber-800 font-medium leading-relaxed">
                                  {item.notas}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Bebidas ── */}
              {bebidasItems.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    🥤 Bebidas ({bebidasItems.reduce((s, i) => s + i.cantidad, 0)} unidades)
                  </h3>
                  <div className="space-y-2">
                    {bebidasItems.map((item, i) => (
                      <div
                        key={i}
                        className={`rounded-xl border p-4 transition-colors ${
                          item.notas && item.notas.trim()
                            ? 'bg-amber-50/60 border-amber-200 border-l-4 border-l-amber-400'
                            : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-black text-gray-900 text-xl min-w-[2rem] text-center leading-none mt-0.5">
                            {item.cantidad}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-900 text-sm">{item.nombre}</span>
                            {item.notas && item.notas.trim() && (
                              <div className="mt-2 flex items-start gap-1.5 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                                <MessageSquareText size={12} className="text-amber-500 mt-0.5 shrink-0" />
                                <span className="text-xs text-amber-800 font-medium leading-relaxed">{item.notas}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Resumen de notas del mozo ── */}
              {itemsConNotas.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MessageSquareText size={13} />
                    Notas del Mozo ({itemsConNotas.length} item{itemsConNotas.length !== 1 ? 's' : ''})
                  </h3>
                  <div className="space-y-2">
                    {itemsConNotas.map((item, i) => (
                      <div key={i} className="bg-white/70 rounded-lg px-3 py-2 border border-amber-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-700">
                            {item.nombre} <span className="text-gray-400 font-normal">x{item.cantidad}</span>
                          </span>
                          {item.categoria === 'bebidas' && <span className="text-[10px] text-gray-400">🥤 Bebida</span>}
                        </div>
                        <p className="text-xs text-amber-800 font-medium">📝 {item.notas}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Nota general ── */}
              {p.notas && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <AlertCircle size={13} />
                    Nota general de la comanda
                  </h3>
                  <p className="text-sm text-yellow-800 font-medium leading-relaxed">{p.notas}</p>
                </div>
              )}

              {/* ── Acciones ── */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {!showHistory && p.estado === 'Pendiente' && (
                    <button
                      onClick={() => { updateEstado(p.id, 'Preparando'); setShowDetailModal(false); }}
                      className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 active:scale-[0.99] transition-all text-sm font-bold"
                    >
                      <ChefHat size={16} />
                      Empezar a Preparar
                    </button>
                  )}
                  {!showHistory && p.estado === 'Preparando' && (
                    <button
                      onClick={() => { updateEstado(p.id, 'Listo'); setShowDetailModal(false); }}
                      className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 active:scale-[0.99] transition-all text-sm font-bold shadow-md"
                    >
                      <Check size={18} />
                      Listo para Entregar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

    </div>
  );
}
