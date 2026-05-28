'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, CheckCircle2, Clock, Package, Plus, Minus, X, Search, CreditCard, Wine } from 'lucide-react';
import Link from 'next/link';
import { subscribeInventario, type InventarioItem } from '@/lib/db';
import Boleta from '@/components/Boleta';
import ComandaTicket from '@/components/ComandaTicket';

interface Comanda {
  id: number;
  mesa: string;
  mozo_id?: string;
  mozo_nombre?: string;
  estado: string;
  hora: string;
  fecha: string;
  total: number;
  created_at?: string;
  items?: { id?: number; nombre: string; cantidad: number; precio: number; categoria?: string; notas?: string; estado?: string; created_at?: string }[];
}

function getLocalDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MozoHistorialPage() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [pagoModalData, setPagoModalData] = useState<Comanda | null>(null);
  const [boletaData, setBoletaData] = useState<any>(null);
  const [comandaTicketData, setComandaTicketData] = useState<any>(null);
  const [pagoInputs, setPagoInputs] = useState({ yape: '', efectivo: '' });
  const [tapers, setTapers] = useState<InventarioItem[]>([]);
  const [taperModalData, setTaperModalData] = useState<Comanda | null>(null);
  const [taperCart, setTaperCart] = useState<{ nombre: string; precio: number; qty: number }[]>([]);
  const [taperSuccess, setTaperSuccess] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());

  // Estado para "Agregar items" a una comanda activa
  const [addItemsModal, setAddItemsModal] = useState<Comanda | null>(null);
  const [addItemsCart, setAddItemsCart] = useState<{ name: string; price: number; qty: number; category: string }[]>([]);
  const [comidaDinamica, setComidaDinamica] = useState<InventarioItem[]>([]);
  const [bebidasDinamica, setBebidasDinamica] = useState<InventarioItem[]>([]);
  const [addItemsSuccess, setAddItemsSuccess] = useState(false);
  const [addItemsSending, setAddItemsSending] = useState(false);
  const [activeComidaCat, setActiveComidaCat] = useState<string>('Todos');
  const [activeBebidaCat, setActiveBebidaCat] = useState<string>('Todos');

  // Split de cuenta (dividir items en nueva comanda)
  const [splitModalData, setSplitModalData] = useState<Comanda | null>(null);
  const [splitSelectedIds, setSplitSelectedIds] = useState<Set<number>>(new Set());
  const [splitSending, setSplitSending] = useState(false);
  const [splitSuccess, setSplitSuccess] = useState<{ originalId: number; newId: number; newTotal: number } | null>(null);

  // Éxito de pago parcial — mostrar resumen y opción de imprimir solo items pagados
  const [partialPaymentSuccess, setPartialPaymentSuccess] = useState<{
    comandaId: number;
    mesa: string;
    mozoNombre: string;
    fecha: string;
    hora: string;
    items: { item: string; cantidad: number; precio: number; notas?: string }[];
    metodo: string;
    total: number;
  } | null>(null);

  // Cliente para boleta electrónica / WhatsApp
  const [clienteHist, setClienteHist] = useState<{ id: number; nombre: string; dni?: string; ruc?: string; telefono?: string } | null>(null);
  const [showClienteSearchHist, setShowClienteSearchHist] = useState(false);
  const [clienteSearchHist, setClienteSearchHist] = useState('');
  const [clientesHist, setClientesHist] = useState<any[]>([]);
  const [showNewClienteHistForm, setShowNewClienteHistForm] = useState(false);
  const [newClienteHistForm, setNewClienteHistForm] = useState({ nombre: '', dni: '', ruc: '', telefono: '', email: '' });
  const [sendingWhatsAppHist, setSendingWhatsAppHist] = useState(false);
  const [sendingSunatHist, setSendingSunatHist] = useState(false);
  const [toastHist, setToastHist] = useState<string | null>(null);
  const [showAllMozos, setShowAllMozos] = useState(false);

  const [fecha] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString()
      : getLocalDateString()
  );

  // Suscribirse a inventario
  useEffect(() => {
    const unsubTapers = subscribeInventario('tapers', (data) => setTapers(data));
    const unsubComida = subscribeInventario('comida', (data) => setComidaDinamica(data));
    const unsubBebidas = subscribeInventario('bebidas', (data) => setBebidasDinamica(data));
    return () => {
      unsubTapers();
      unsubComida();
      unsubBebidas();
    };
  }, []);

  // ── Yape QR Modal ────────────────────────────────────────────────
  const [yapeQRData, setYapeQRData] = useState<{ comandaId: number; total: number; yapeMonto: number; efectivoMonto: number; metodo: string } | null>(null);
  const [qrDataUrlHist, setQrDataUrlHist] = useState<string>('');

  function getYapeConfig() {
    try {
      const stored = localStorage.getItem('ph_pago_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          numero: parsed.yapeNumero || '942 902 367',
          nombre: parsed.yapeNombre || 'PUERTO HABANA',
          qrImage: parsed.yapeQRImage || '',
        };
      }
    } catch {}
    return { numero: '942 902 367', nombre: 'PUERTO HABANA', qrImage: '' };
  }

  // Generar QR al abrir el modal
  useEffect(() => {
    if (!yapeQRData) return;
    const yapeConfig = getYapeConfig();
    if (yapeConfig.qrImage) {
      // Tiene imagen QR propia
      setQrDataUrlHist(yapeConfig.qrImage);
    } else {
      // Generar QR desde el número
      import('qrcode').then((QRCode) => {
        QRCode.toDataURL(yapeConfig.numero, {
          width: 280,
          margin: 2,
          color: { dark: '#7408B6', light: '#FFFFFF' },
        }).then(setQrDataUrlHist).catch(() => {});
      });
    }
  }, [yapeQRData]);

  // Sincronizar pago_config desde Supabase
  useEffect(() => {
    const syncPagoConfig = async () => {
      try {
        const res = await fetch('/api/configuracion?clave=pago_config');
        if (res.ok) {
          const { valor } = await res.json();
          if (valor) {
            localStorage.setItem('ph_pago_config', JSON.stringify(valor));
          }
        }
      } catch {}
    };
    syncPagoConfig();
  }, []);

  // Búsqueda de clientes para boleta electrónica
  useEffect(() => {
    if (!showClienteSearchHist) return;
    const debounce = setTimeout(async () => {
      if (clienteSearchHist.length < 2) {
        setClientesHist([]);
        return;
      }
      try {
        const res = await fetch(`/api/clientes?search=${encodeURIComponent(clienteSearchHist)}&limit=10`);
        if (res.ok) setClientesHist(await res.json());
      } catch {}
    }, 300);
    return () => clearTimeout(debounce);
  }, [clienteSearchHist, showClienteSearchHist]);

  // Toast auto-clear
  useEffect(() => { if (!toastHist) return; const t = setTimeout(() => setToastHist(null), 3000); return () => clearTimeout(t); }, [toastHist]);

  // Modal detallado
  const [detailModal, setDetailModal] = useState<Comanda | null>(null);
  
  // Solo muestra las comandas del mozo logueado
  const mozoId = typeof window !== 'undefined'
    ? (() => { try { return JSON.parse(localStorage.getItem('ph_mozo_session') || '{}').id || ''; } catch { return ''; } })()
    : '';

  const loadComandas = useCallback(async () => {
    try {
      const res = await fetch(`/api/pedidos?fecha=${fecha}&_=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data: any[] = await res.json();
      // Mapear mesa_nombre → mesa (la API devuelve mesa_nombre)
      const mapped: Comanda[] = data.map((c: any) => ({
        id: c.id,
        mesa: c.mesa || c.mesa_nombre || '',
        mozo_id: c.mozo_id,
        mozo_nombre: c.mozo_nombre,
        estado: c.estado,
        hora: c.hora,
        fecha: c.fecha,
        total: Number(c.total) || 0,          items: (c.items || []).map((i: any) => ({
          id: i.id,
          nombre: i.nombre,
          cantidad: i.cantidad,
          precio: Number(i.precio) || 0,
          categoria: i.categoria,
          notas: i.notas,
          estado: i.estado,
        })),
      }));
      // Filtrar por mozo solo si no está activo "Todas las comandas"
      const mozoComandas = (mozoId && !showAllMozos) ? mapped.filter(c => c.mozo_id === mozoId) : mapped;
      
      // Cada comanda se muestra independientemente (sin fusionar por mesa+estado)
      setComandas(mozoComandas.sort((a, b) => new Date(`${b.fecha}T${b.hora}`).getTime() - new Date(`${a.fecha}T${a.hora}`).getTime()));
    } catch {
      // Fallback localStorage
      try {
        const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
        const hoy = all.filter((p: any) => p.fecha === fecha);
        // Agrupar por mesa+hora+mozo para mantener items del mismo pedido juntos,
        // pero sin fusionar pedidos diferentes de la misma mesa
        const grouped: Record<string, Comanda> = {};
        hoy.forEach((p: any) => {
          const key = `${p.mesa}-${p.hora}-${p.mozoNombre || 'Mozo'}`;
          if (!grouped[key]) {
            grouped[key] = { id: p.id, mesa: p.mesa, mozo_nombre: p.mozoNombre, mozo_id: p.mozoId, estado: p.estado, hora: p.hora, fecha: p.fecha, total: 0, items: [] };
          }
          grouped[key].total += p.precio * p.cantidad;
          grouped[key].items?.push({ nombre: p.item, cantidad: p.cantidad, precio: p.precio, notas: p.notas });
        });
        const mozoComandasFallback = Object.values(grouped).filter(c => !mozoId || showAllMozos || c.mozo_id === mozoId);
        setComandas(mozoComandasFallback.sort((a, b) => new Date(`${b.fecha}T${b.hora}`).getTime() - new Date(`${a.fecha}T${a.hora}`).getTime()));
      } catch { setComandas([]); }
    }
    setLoading(false);
  }, [fecha, mozoId, showAllMozos]);

  useEffect(() => {
    loadComandas();
    const interval = setInterval(loadComandas, 5000);
    window.addEventListener('storage', loadComandas);
    return () => { clearInterval(interval); window.removeEventListener('storage', loadComandas); };
  }, [loadComandas, showAllMozos]);

  const confirmarCobro = async (id: number, metodo: string, paidItemIds?: number[]) => {
    // Save client info before closing modal
    if (clienteHist?.nombre && (clienteHist?.dni || clienteHist?.ruc)) {
      try {
        localStorage.setItem(`ph_cliente_comanda_${id}`, JSON.stringify({
          nombre: clienteHist.nombre,
          documento: (clienteHist.ruc || clienteHist.dni || '').trim(),
        }));
      } catch {}
    }

    const isPartial = paidItemIds && paidItemIds.length > 0 && paidItemIds.length < (pagoModalData?.items?.length || 0);

    // Guardar snapshot de items pagados ANTES de cerrar el modal
    const paidItemsSnapshot = isPartial && pagoModalData?.items && paidItemIds
      ? pagoModalData.items.filter(i => i.id && paidItemIds.includes(i.id))
      : [];
    const mesaSnapshot = pagoModalData?.mesa || '';
    const mozoSnapshot = pagoModalData?.mozo_nombre || 'Mozo';
    const fechaSnapshot = pagoModalData?.fecha || '';
    const horaSnapshot = pagoModalData?.hora || '';

    // Capturar total antes de limpiar modal (para notificación a admin)
    const totalSnapshot = isPartial
      ? paidItemsSnapshot.reduce((s, i) => s + i.precio * i.cantidad, 0)
      : pagoModalData?.total || 0;

    // Cierra el modal de inmediato (optimistic UI)
    setPagoModalData(null);
    setPagoInputs({ yape: '', efectivo: '' });
    setSelectedItemIds(new Set());

    try {
      const body: any = { estado: 'Entregado', metodo_pago: metodo };
      if (isPartial) {
        body.paid_item_ids = paidItemIds;
        delete body.estado; // no cambiar estado de la comanda si es parcial
      }
      const res = await fetch(`/api/pedidos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('API error');

      // Mostrar resumen del pago parcial con opción de imprimir
      if (isPartial && paidItemsSnapshot.length > 0) {
        setPartialPaymentSuccess({
          comandaId: id,
          mesa: mesaSnapshot,
          mozoNombre: mozoSnapshot,
          fecha: fechaSnapshot,
          hora: horaSnapshot,
          items: paidItemsSnapshot.map(i => ({ item: i.nombre, cantidad: i.cantidad, precio: i.precio, notas: i.notas })),
          metodo,
          total: paidItemsSnapshot.reduce((s, i) => s + i.precio * i.cantidad, 0),
        });
      }

      // Notificar al admin en tiempo real — destacando mesa y monto
      fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rol_destino: 'admin',
          titulo: isPartial ? '💰 Pago Parcial' : '💰 Nuevo Pago',
          mensaje: isPartial
            ? `${mesaSnapshot} · S/ ${totalSnapshot.toFixed(2)} · ${paidItemIds!.length} items (${metodo})`
            : `${mesaSnapshot} · S/ ${totalSnapshot.toFixed(2)} · Pagado con ${metodo}`
        })
      }).catch(() => {});

    } catch {
      // Fallback: marcar en localStorage
      // Nota: pago parcial no soportado en localStorage fallback
      if (!isPartial) {
        const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
        localStorage.setItem('puerto_habana_pedidos', JSON.stringify(
          all.map((p: any) => p.id === id ? { ...p, estado: 'Entregado', metodo_pago: metodo } : p)
        ));
      }
    } finally {
      // Recargar después de un pequeño delay para asegurar que la BD actualizó
      setTimeout(() => loadComandas(), 600);
    }
  };

  const toggleItemSelection = (itemId: number) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handlePagoModalOpen = (c: Comanda) => {
    setPagoModalData(c);
    setPagoInputs({ yape: '', efectivo: '' });
    setClienteHist(null);
    // Solo seleccionar items que NO estén ya pagados
    setSelectedItemIds(new Set((c.items || []).filter(i => i.id && i.estado !== 'Entregado').map(i => i.id!).filter(Boolean)));
  };

  const total = comandas.reduce((s, c) => s + Number(c.total), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Pedidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{fecha}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase font-semibold">Total del Día</p>
          <p className="text-2xl font-bold text-blue-600 mb-1">S/ {Number(total).toFixed(2)}</p>
          <Link 
            href="/mozo/reportes"
            className="inline-block text-[10px] bg-blue-100 text-blue-700 px-3 py-1.5 rounded font-bold hover:bg-blue-200 transition-colors"
          >
            Ver Reporte
          </Link>
        </div>
      </div>

      {/* Toggle: Mis comandas / Todas */}
      <div className="px-4 md:px-6 max-w-4xl mx-auto mt-4 mb-2">
        <button
          onClick={() => setShowAllMozos(!showAllMozos)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            showAllMozos
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {showAllMozos ? 'Ver solo mis comandas' : 'Ver todas las comandas'}
        </button>
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comandas.length === 0 ? (
          <div className="mt-12 text-center border-2 border-dashed border-gray-200 py-16 rounded-2xl bg-white">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-sm text-gray-500 uppercase font-medium tracking-widest">Sin pedidos registrados hoy</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comandas.map(c => (
              <div key={c.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                <div onClick={() => setDetailModal(c)} className="cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-gray-900">{c.mesa}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={12} /> {c.hora}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          c.estado === 'Pendiente'  ? 'bg-orange-100 text-orange-600' :
                          c.estado === 'Preparando'? 'bg-blue-100 text-blue-600'     :
                          c.estado === 'Listo'     ? 'bg-green-100 text-green-600'   :
                          'bg-gray-100 text-gray-600'
                        }`}>{c.estado}</span>
                      </div>
                      {c.mozo_nombre && <p className="text-xs text-gray-400 mt-0.5">Mozo: {c.mozo_nombre}</p>}
                      {c.items && <p className="text-xs text-gray-400 mt-0.5">{c.items.reduce((s, i) => s + i.cantidad, 0)} productos</p>}
                    </div>
                    <p className="text-base font-bold text-gray-900">S/ {Number(c.total).toFixed(2)}</p>
                  </div>

                  {c.items && c.items.length > 0 && (
                    <ul className="space-y-1 mb-3">
                      {c.items.map((item, i) => {
                        const isPaid = item.estado === 'Entregado';
                        return (
                          <li key={i} className={`text-sm flex items-center gap-2 ${isPaid ? 'text-green-600/60' : 'text-gray-700'}`}>
                            {isPaid ? (
                              <span className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </span>
                            ) : (
                              <span className="font-bold text-gray-900">{item.cantidad}×</span>
                            )}
                            <span className={isPaid ? 'line-through' : ''}>{item.nombre}</span>
                            {isPaid && (
                              <span className="text-[9px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full ml-1 shrink-0">Pagado</span>
                            )}
                            <span className={`ml-auto ${isPaid ? 'text-green-600/60' : 'text-gray-400'}`}>S/ {(Number(item.precio) * Number(item.cantidad)).toFixed(2)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                
                <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setComandaTicketData({
                    mesa: c.mesa,
                    mozoNombre: c.mozo_nombre || 'Mozo',
                    fecha: c.fecha,
                    hora: c.hora,
                    items: (c.items || []).map((i: any) => ({ nombre: i.nombre, cantidad: i.cantidad, notas: i.notas, categoria: i.categoria }))
                  })} className="flex-shrink-0 bg-orange-50 text-orange-700 px-2.5 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 hover:bg-orange-100 transition-colors text-[11px]">
                    🍳 Comanda
                  </button>
                  {(() => {
                    let clienteGuardado: any = null;
                    try { const raw = localStorage.getItem('ph_cliente_comanda_' + c.id); if (raw) clienteGuardado = JSON.parse(raw); } catch {}
                    const enabled = Number(c.total) > 0;
                    return (
                      <button
                        onClick={() => {
                          setBoletaData({
                            mesa: c.mesa,
                            mozoNombre: c.mozo_nombre || 'Mozo',
                            fecha: c.fecha,
                            hora: c.hora,
                            items: (c.items || []).map((i: any) => ({ item: i.nombre, cantidad: i.cantidad, precio: i.precio, notas: i.notas })),
                            clienteNombre: clienteGuardado?.nombre || '',
                            clienteDocumento: clienteGuardado?.documento || '',
                          });
                        }}
                        className={'flex-1 px-2.5 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 transition-colors text-[11px] ' + (enabled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-300 cursor-not-allowed')}
                      >
                        🧾 Boleta
                      </button>
                    );
                  })()}
                  {c.estado === 'Entregado' && tapers.length > 0 && (
                    <button onClick={() => { setTaperModalData(c); setTaperCart([]); }}
                      className="flex-shrink-0 bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 hover:bg-emerald-200 transition-colors text-[11px]">
                      <Package size={12} /> Tapers
                    </button>
                  )}
                  {c.estado !== 'Entregado' && c.estado !== 'Cerrado' && (
                    <button onClick={() => {
                      setAddItemsModal(c);
                      setAddItemsCart([]);
                      setAddItemsSuccess(false);
                    }}
                      className="flex-shrink-0 bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 hover:bg-blue-100 transition-colors text-[11px]">
                      <Plus size={12} /> Agregar
                    </button>
                  )}
                  {c.estado !== 'Entregado' && c.estado !== 'Cerrado' && c.items && c.items.filter(i => i.id && i.estado !== 'Entregado').length > 1 && (
                    <button onClick={() => {
                      setSplitModalData(c);
                      setSplitSelectedIds(new Set());
                      setSplitSuccess(null);
                    }}
                      className="flex-shrink-0 bg-violet-50 text-violet-700 px-2.5 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 hover:bg-violet-100 transition-colors text-[11px]">
                      ✂️ Dividir
                    </button>
                  )}
                  {c.estado !== 'Entregado' && c.estado !== 'Cerrado' && Number(c.total) > 0 && (
                    <button onClick={() => handlePagoModalOpen(c)}
                      className="flex-1 bg-gray-900 text-white px-2.5 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 hover:bg-black transition-colors text-[11px]">
                      <CheckCircle2 size={12} /> Cobrar
                    </button>
                  )}
                  {c.estado !== 'Entregado' && c.estado !== 'Cerrado' && Number(c.total) === 0 && (
                    <button onClick={() => confirmarCobro(c.id, 'Cortesía')}
                      className="flex-1 bg-amber-500 text-white px-2.5 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 hover:bg-amber-600 transition-colors text-[11px]">
                      🎁 Cortesía
                    </button>
                  )}
                </div>

                {/* Modal de Pago Mixto / Vuelto */}
                {/* Modal: Agregar items a comanda activa */}
                {addItemsModal?.id === c.id && (
                  <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
                      <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="text-xl font-bold text-gray-900">Agregar productos a {c.mesa}</h3>
                        <button onClick={() => setAddItemsModal(null)} className="p-1.5 hover:bg-gray-100 rounded-full">
                          <X size={20} className="text-gray-400" />
                        </button>
                      </div>

                      {addItemsSuccess && (
                        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
                          ✓ Productos agregados correctamente a la comanda
                        </div>
                      )}

                      {addItemsSending && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm font-medium flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          Enviando productos...
                        </div>
                      )}

                      <div className="flex-1 overflow-y-auto space-y-5">
                        {/* Comida */}
                        {comidaDinamica.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Platos</h4>
                            </div>
                            {(() => {
                              const cats = ['Todos', ...Array.from(new Set(comidaDinamica.map(c => c.categoria || 'Otros').filter(Boolean)))];
                              const filtered = activeComidaCat === 'Todos' ? comidaDinamica : comidaDinamica.filter(c => (c.categoria || 'Otros') === activeComidaCat);
                              return (
                                <>
                                  <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                                    {cats.map(c => (
                                      <button key={c} onClick={() => setActiveComidaCat(c)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors shrink-0 ${
                                          activeComidaCat === c ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                      >{c}</button>
                                    ))}
                                  </div>
                                  <div className="space-y-1">
                                    {filtered.map(item => {
                                      const qty = addItemsCart.find(c => c.name === item.nombre)?.qty || 0;
                                      return (
                                        <div key={item.nombre} className="flex justify-between items-center rounded-lg px-3 py-2.5 border border-gray-100 bg-white hover:border-gray-200 transition-all">
                                          <div className="min-w-0 flex-1">
                                            <p className="text-sm text-gray-900 truncate">{item.nombre}</p>
                                            <p className="text-[11px] text-gray-400">S/ {Number(item.precio).toFixed(2)}</p>
                                          </div>
                                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                            <button onClick={() => setAddItemsCart(prev => {
                                              const existing = prev.find(c => c.name === item.nombre);
                                              if (existing) {
                                                if (existing.qty <= 1) return prev.filter(c => c.name !== item.nombre);
                                                return prev.map(c => c.name === item.nombre ? {...c, qty: c.qty - 1} : c);
                                              }
                                              return prev;
                                            })} disabled={qty === 0}
                                              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-30 hover:bg-gray-200">
                                              <Minus size={12} className="text-gray-500" />
                                            </button>
                                            <span className="w-5 text-center font-semibold text-sm">{qty}</span>
                                            <button onClick={() => setAddItemsCart(prev => {
                                              const existing = prev.find(c => c.name === item.nombre);
                                              if (existing) return prev.map(c => c.name === item.nombre ? {...c, qty: c.qty + 1} : c);
                                              return [...prev, { name: item.nombre, price: item.precio, qty: 1, category: 'comida' }];
                                            })}
                                              className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all">
                                              <Plus size={12} />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {/* Bebidas */}
                        {bebidasDinamica.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Wine size={14} className="text-gray-400" />
                              <h4 className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Bebidas</h4>
                            </div>
                            {(() => {
                              const cats = ['Todos', ...Array.from(new Set(bebidasDinamica.map(b => b.categoria || 'Otras').filter(Boolean)))];
                              const filtered = activeBebidaCat === 'Todos' ? bebidasDinamica : bebidasDinamica.filter(b => (b.categoria || 'Otras') === activeBebidaCat);
                              return (
                                <>
                                  <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                                    {cats.map(c => (
                                      <button key={c} onClick={() => setActiveBebidaCat(c)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors shrink-0 ${
                                          activeBebidaCat === c ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                      >{c}</button>
                                    ))}
                                  </div>
                                  <div className="space-y-1">
                                    {filtered.map(bebida => {
                                      if (bebida.tamanos && bebida.tamanos.length > 0) {
                                        return bebida.tamanos.map((t: any, ti: number) => {
                                          const itemKey = `${bebida.nombre}||${t.nombre}`;
                                          const qty = addItemsCart.find(c => c.name === itemKey)?.qty || 0;
                                          return (
                                            <div key={itemKey} className="flex justify-between items-center rounded-lg px-3 py-2.5 border border-gray-100 bg-white hover:border-gray-200 transition-all">
                                              <div className="min-w-0 flex-1">
                                                <p className="text-sm text-gray-900 truncate">{bebida.nombre} <span className="text-gray-500 font-medium">{t.nombre}</span></p>
                                                <p className="text-[11px] text-gray-400">S/ {Number(t.precio).toFixed(2)}</p>
                                              </div>
                                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                <button onClick={() => setAddItemsCart(prev => {
                                                  const existing = prev.find(c => c.name === itemKey);
                                                  if (existing) {
                                                    if (existing.qty <= 1) return prev.filter(c => c.name !== itemKey);
                                                    return prev.map(c => c.name === itemKey ? {...c, qty: c.qty - 1} : c);
                                                  }
                                                  return prev;
                                                })} disabled={qty === 0}
                                                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-30 hover:bg-gray-200">
                                                  <Minus size={12} className="text-gray-500" />
                                                </button>
                                                <span className="w-5 text-center font-semibold text-sm">{qty}</span>
                                                <button onClick={() => setAddItemsCart(prev => {
                                                  const existing = prev.find(c => c.name === itemKey);
                                                  if (existing) return prev.map(c => c.name === itemKey ? {...c, qty: c.qty + 1} : c);
                                                  return [...prev, { name: itemKey, price: t.precio, qty: 1, category: 'bebidas' }];
                                                })}
                                                  className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all">
                                                  <Plus size={12} />
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        });
                                      }
                                      const qty = addItemsCart.find(c => c.name === bebida.nombre)?.qty || 0;
                                      return (
                                        <div key={bebida.id} className="flex justify-between items-center rounded-lg px-3 py-2.5 border border-gray-100 bg-white hover:border-gray-200 transition-all">
                                          <div className="min-w-0 flex-1">
                                            <p className="text-sm text-gray-900 truncate">{bebida.nombre}</p>
                                            <p className="text-[11px] text-gray-400">S/ {Number(bebida.precio).toFixed(2)}</p>
                                          </div>
                                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                            <button onClick={() => setAddItemsCart(prev => {
                                              const existing = prev.find(c => c.name === bebida.nombre);
                                              if (existing) {
                                                if (existing.qty <= 1) return prev.filter(c => c.name !== bebida.nombre);
                                                return prev.map(c => c.name === bebida.nombre ? {...c, qty: c.qty - 1} : c);
                                              }
                                              return prev;
                                            })} disabled={qty === 0}
                                              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-30 hover:bg-gray-200">
                                              <Minus size={12} className="text-gray-500" />
                                            </button>
                                            <span className="w-5 text-center font-semibold text-sm">{qty}</span>
                                            <button onClick={() => setAddItemsCart(prev => {
                                              const existing = prev.find(c => c.name === bebida.nombre);
                                              if (existing) return prev.map(c => c.name === bebida.nombre ? {...c, qty: c.qty + 1} : c);
                                              return [...prev, { name: bebida.nombre, price: bebida.precio, qty: 1, category: 'bebidas' }];
                                            })}
                                              className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all">
                                              <Plus size={12} />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {/* Tapers */}
                        {tapers.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Package size={14} className="text-gray-400" />
                              <h4 className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Envases / Tapers</h4>
                            </div>
                            <div className="space-y-1">
                              {tapers.map(t => {
                                const qty = addItemsCart.find(c => c.name === t.nombre)?.qty || 0;
                                return (
                                  <div key={t.nombre} className="flex justify-between items-center rounded-lg px-3 py-2.5 border border-gray-100 bg-white hover:border-gray-200 transition-all">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm text-gray-900 truncate">{t.nombre}</p>
                                      <p className="text-[11px] text-gray-400">S/ {Number(t.precio).toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                      <button onClick={() => setAddItemsCart(prev => {
                                        const existing = prev.find(c => c.name === t.nombre);
                                        if (existing) {
                                          if (existing.qty <= 1) return prev.filter(c => c.name !== t.nombre);
                                          return prev.map(c => c.name === t.nombre ? {...c, qty: c.qty - 1} : c);
                                        }
                                        return prev;
                                      })} disabled={qty === 0}
                                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-30 hover:bg-gray-200">
                                        <Minus size={12} className="text-gray-500" />
                                      </button>
                                      <span className="w-5 text-center font-semibold text-sm">{qty}</span>
                                      <button onClick={() => setAddItemsCart(prev => {
                                        const existing = prev.find(c => c.name === t.nombre);
                                        if (existing) return prev.map(c => c.name === t.nombre ? {...c, qty: c.qty + 1} : c);
                                        return [...prev, { name: t.nombre, price: t.precio, qty: 1, category: 'tapers' }];
                                      })}
                                        className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all">
                                        <Plus size={12} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {addItemsCart.length > 0 && (
                        <div className="border-t border-gray-200 pt-3 mt-3 mb-2 shrink-0">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-500">{addItemsCart.reduce((s, c) => s + c.qty, 0)} productos</span>
                            <span className="text-base font-bold text-gray-900">S/ {addItemsCart.reduce((s, c) => s + c.price * c.qty, 0).toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 mt-1 shrink-0">
                        <button onClick={() => { setAddItemsModal(null); setAddItemsCart([]); setAddItemsSuccess(false); }}
                          className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 rounded-2xl transition-colors">
                          Cancelar
                        </button>
                        <button
                          disabled={addItemsCart.length === 0 || addItemsSending}
                          onClick={async () => {
                            if (addItemsSending) return;
                            setAddItemsSending(true);
                            try {
                              const res = await fetch(`/api/pedidos/${c.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  items: addItemsCart.map(ci => ({
                                    nombre: ci.name.includes('||')
                                      ? `${ci.name.split('||')[0]} (${ci.name.split('||')[1]})`
                                      : ci.name,
                                    cantidad: ci.qty,
                                    precio: ci.price,
                                    categoria: ci.category,
                                  }))
                                }),
                              });
                              if (!res.ok) throw new Error('Error al agregar items');
                              setAddItemsSuccess(true);
                              setAddItemsCart([]);
                              setTimeout(() => {
                                setAddItemsModal(null);
                                setAddItemsSuccess(false);
                                loadComandas();
                              }, 1200);
                            } catch {
                              alert('Error al agregar productos. Intente de nuevo.');
                            } finally {
                              setAddItemsSending(false);
                            }
                          }}
                          className="flex-1 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-2xl transition-colors disabled:opacity-50 shadow-md"
                        >
                          Agregar {addItemsCart.length > 0 ? `(${addItemsCart.reduce((s, c) => s + c.qty, 0)} items)` : 'Productos'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Modal de Dividir Cuenta */}
                {splitModalData?.id === c.id && (
                  <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
                      <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="text-xl font-bold text-gray-900">✂️ Dividir cuenta — {c.mesa}</h3>
                        <button onClick={() => { setSplitModalData(null); setSplitSuccess(null); }} className="p-1.5 hover:bg-gray-100 rounded-full">
                          <X size={20} className="text-gray-400" />
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 mb-4">
                        Selecciona los items que quieres <b>mover a una nueva comanda separada</b>.
                        Los items no seleccionados se quedarán en esta comanda.
                      </p>

                      {splitSuccess && splitSuccess.originalId === c.id ? (
                        <div className="py-6 text-center">
                          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">✂️</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900 mb-1">¡Cuenta dividida!</p>
                          <p className="text-sm text-gray-500 mb-2">
                            Se creó una nueva comanda separada con los items seleccionados.
                          </p>
                          <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Comanda original ({c.mesa})</span>
                              <span className="font-bold text-gray-900">S/ {(Number(c.total) - splitSuccess.newTotal).toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                              <span className="text-gray-600">Nueva comanda #{splitSuccess.newId}</span>
                              <span className="font-bold text-violet-600">S/ {splitSuccess.newTotal.toFixed(2)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => { setSplitModalData(null); setSplitSuccess(null); loadComandas(); }}
                            className="w-full py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors"
                          >
                            Entendido
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Lista de items con checkboxes */}
                          <div className="flex-1 overflow-y-auto mb-4 space-y-1">
                            {c.items && c.items.filter(i => i.id && i.estado !== 'Entregado').map((item) => {
                              const itemId = item.id!;
                              const isSelected = splitSelectedIds.has(itemId);
                              return (
                                <div
                                  key={itemId}
                                  onClick={() => {
                                    setSplitSelectedIds(prev => {
                                      const next = new Set(prev);
                                      if (next.has(itemId)) next.delete(itemId);
                                      else next.add(itemId);
                                      return next;
                                    });
                                  }}
                                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors border ${
                                    isSelected
                                      ? 'bg-violet-50 border-violet-200'
                                      : 'bg-white border-gray-100 hover:border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                      isSelected
                                        ? 'bg-violet-600 border-violet-600'
                                        : 'border-gray-300'
                                    }`}>
                                      {isSelected && (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                      )}
                                    </div>
                                    <span className="text-sm text-gray-900 truncate">
                                      {item.cantidad}× {item.nombre}
                                    </span>
                                  </div>
                                  <span className="text-sm font-semibold text-gray-700 ml-2 shrink-0">
                                    S/ {(item.precio * item.cantidad).toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Preview del split */}
                          {(() => {
                            const itemsConId = (c.items || []).filter(i => i.id);
                            const selectedItems = itemsConId.filter(i => splitSelectedIds.has(i.id!));
                            const remainingItems = itemsConId.filter(i => !splitSelectedIds.has(i.id!));
                            const selectedTotal = selectedItems.reduce((s, i) => s + i.precio * i.cantidad, 0);
                            const remainingTotal = remainingItems.reduce((s, i) => s + i.precio * i.cantidad, 0);
                            const canSplit = selectedItems.length > 0 && remainingItems.length > 0;

                            return (
                              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 mb-4 shrink-0">
                                <p className="text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-2">Vista previa</p>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                      {c.mesa} <span className="text-gray-400">({remainingItems.length} items)</span>
                                    </span>
                                    <span className="font-bold text-gray-900">S/ {remainingTotal.toFixed(2)}</span>
                                  </div>
                                  <div className="border-t border-gray-200 pt-1.5 flex justify-between text-sm">
                                    <span className="text-violet-600 font-medium">
                                      Nueva comanda <span className="text-violet-400">({selectedItems.length} items)</span>
                                    </span>
                                    <span className="font-bold text-violet-600">S/ {selectedTotal.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {splitSending && (
                            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm font-medium flex items-center gap-2 shrink-0">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              Dividiendo cuenta...
                            </div>
                          )}

                          <div className="flex gap-3 shrink-0">
                            <button onClick={() => { setSplitModalData(null); setSplitSuccess(null); }}
                              className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 rounded-2xl transition-colors">
                              Cancelar
                            </button>
                            <button
                              disabled={(() => {
                                const itemsConId = (c.items || []).filter(i => i.id);
                                const selectedItems = itemsConId.filter(i => splitSelectedIds.has(i.id!));
                                const remainingItems = itemsConId.filter(i => !splitSelectedIds.has(i.id!));
                                return !(selectedItems.length > 0 && remainingItems.length > 0) || splitSending;
                              })()}
                              onClick={async () => {
                                if (splitSending) return;
                                const itemsConId = (c.items || []).filter(i => i.id);
                                const selectedItems = itemsConId.filter(i => splitSelectedIds.has(i.id!));
                                const remainingItems = itemsConId.filter(i => !splitSelectedIds.has(i.id!));
                                if (!(selectedItems.length > 0 && remainingItems.length > 0)) return;

                                setSplitSending(true);
                                try {
                                  const res = await fetch('/api/pedidos/split', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      comanda_id: c.id,
                                      item_ids: selectedItems.map(i => i.id!),
                                    }),
                                  });
                                  const data = await res.json();
                                  if (!res.ok) {
                                    throw new Error(data.error || 'Error al dividir');
                                  }
                                  setSplitSuccess({
                                    originalId: c.id,
                                    newId: data.new_comanda.id,
                                    newTotal: data.new_comanda.total,
                                  });
                                  setSplitSelectedIds(new Set());
                                } catch (err: any) {
                                  alert('Error: ' + (err.message || 'No se pudo dividir la cuenta'));
                                } finally {
                                  setSplitSending(false);
                                }
                              }}
                              className="flex-1 py-3 bg-violet-600 text-white font-bold hover:bg-violet-700 rounded-2xl transition-colors disabled:opacity-50 shadow-md"
                            >
                              Confirmar División
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Modal de Tapers para comandas Entregado */}
                {taperModalData?.id === c.id && (
                  <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Agregar Tapers a {c.mesa}</h3>
                        <button onClick={() => setTaperModalData(null)} className="p-1.5 hover:bg-gray-100 rounded-full">
                          <X size={20} className="text-gray-400" />
                        </button>
                      </div>

                      {taperSuccess && (
                        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
                          ✓ Tapers agregados correctamente
                        </div>
                      )}

                      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                        {tapers.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-8">No hay tapers disponibles en inventario</p>
                        ) : (
                          tapers.map(t => {
                            const qty = taperCart.find(tc => tc.nombre === t.nombre)?.qty || 0;
                            return (
                              <div key={t.nombre} className="flex justify-between items-center bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <div>
                                  <p className="font-medium text-sm text-gray-900">{t.nombre}</p>
                                  <p className="text-xs text-gray-500">S/ {Number(t.precio).toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button onClick={() => setTaperCart(prev => {
                                    const existing = prev.find(tc => tc.nombre === t.nombre);
                                    if (existing) {
                                      if (existing.qty <= 1) return prev.filter(tc => tc.nombre !== t.nombre);
                                      return prev.map(tc => tc.nombre === t.nombre ? {...tc, qty: tc.qty - 1} : tc);
                                    }
                                    return prev;
                                  })} disabled={qty === 0}
                                    className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center disabled:opacity-30">
                                    <Minus size={12} />
                                  </button>
                                  <span className="w-5 text-center font-semibold text-sm">{qty}</span>
                                  <button onClick={() => setTaperCart(prev => {
                                    const existing = prev.find(tc => tc.nombre === t.nombre);
                                    if (existing) return prev.map(tc => tc.nombre === t.nombre ? {...tc, qty: tc.qty + 1} : tc);
                                    return [...prev, { nombre: t.nombre, precio: t.precio, qty: 1 }];
                                  })}
                                    className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {taperCart.length > 0 && (
                        <div className="border-t border-gray-200 pt-3 mb-3">
                          <p className="text-xs text-gray-500 mb-2">
                            {taperCart.reduce((s, tc) => s + tc.qty, 0)} tapers · S/ {taperCart.reduce((s, tc) => s + tc.precio * tc.qty, 0).toFixed(2)}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button onClick={() => { setTaperModalData(null); setTaperCart([]); setTaperSuccess(false); }}
                          className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 rounded-2xl transition-colors">
                          Cancelar
                        </button>
                        <button
                          disabled={taperCart.length === 0}
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/pedidos/${c.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  items: taperCart.map(tc => ({
                                    nombre: tc.nombre,
                                    cantidad: tc.qty,
                                    precio: tc.precio,
                                    categoria: 'tapers',
                                  }))
                                }),
                              });
                              if (!res.ok) throw new Error('Error al agregar tapers');
                              setTaperSuccess(true);
                              setTaperCart([]);
                              setTimeout(() => {
                                setTaperModalData(null);
                                setTaperSuccess(false);
                                loadComandas();
                              }, 1500);
                            } catch {
                              alert('Error al agregar tapers. Intente de nuevo.');
                            }
                          }}
                          className="flex-1 py-3 bg-emerald-600 text-white font-bold hover:bg-emerald-700 rounded-2xl transition-colors disabled:opacity-50 shadow-md"
                        >
                          Agregar a Comanda
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {pagoModalData?.id === c.id && (
                  <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                      <h3 className="text-xl font-bold mb-1 text-center text-gray-900">Cobrar Mesa {c.mesa}{(() => { const total = (c.items || []).filter(i => i.id).length; const sel = selectedItemIds.size; if (total > 0 && sel > 0 && sel < total) return <span className="ml-2 text-sm font-bold text-amber-500">(Parcial)</span>; return null; })()}</h3>
                      <p className="text-center text-3xl font-black text-blue-600 mb-6">S/ {(() => {
                        const itemsConId = (c.items || []).filter(i => i.id);
                        const selected = itemsConId.length > 0
                          ? itemsConId.filter(i => selectedItemIds.has(i.id!))
                          : (c.items || []);
                        return selected.reduce((s, i) => s + i.precio * i.cantidad, 0);
                      })().toFixed(2)}</p>

                      {/* ─── Selección de items (pago parcial) ─── */}
                      {c.items && c.items.length > 0 && c.items.some(i => i.id) && (
                        <div className="mb-4 border border-gray-200 rounded-xl overflow-hidden">
                          {(() => {
                            const unpaidItems = (c.items || []).filter(i => i.id && i.estado !== 'Entregado');
                            const hasUnpaid = unpaidItems.length > 0;
                            return (
                              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                  {hasUnpaid ? 'Items del Pedido' : 'Items (todos pagados)'}
                                </span>
                                {hasUnpaid && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400">
                                      {selectedItemIds.size} de {unpaidItems.length} seleccionados
                                    </span>
                                    <button
                                      onClick={() => {
                                        const unpaidIds = new Set(unpaidItems.map(i => i.id!).filter(Boolean));
                                        if (selectedItemIds.size === unpaidItems.length) {
                                          setSelectedItemIds(new Set());
                                        } else {
                                          setSelectedItemIds(unpaidIds);
                                        }
                                      }}
                                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                      {selectedItemIds.size === unpaidItems.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                            {c.items.map((item) => {
                              const isPaid = item.estado === 'Entregado';
                              const itemId = item.id!;
                              const isSelected = selectedItemIds.has(itemId);
                              return (
                                <div
                                  key={itemId}
                                  onClick={() => !isPaid && toggleItemSelection(itemId)}
                                  className={`flex items-center justify-between px-3 py-2.5 transition-colors ${
                                    isPaid
                                      ? 'bg-gray-50 cursor-default'
                                      : isSelected ? 'bg-blue-50 cursor-pointer' : 'bg-white cursor-pointer hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    {isPaid ? (
                                      <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center shrink-0">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                      </div>
                                    ) : (
                                      <div onClick={(e) => { e.stopPropagation(); !isPaid && toggleItemSelection(itemId); }} className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                                        isSelected
                                          ? 'bg-blue-600 border-blue-600'
                                          : 'border-gray-300'
                                      }`}>
                                        {isSelected && (
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"/>
                                          </svg>
                                        )}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <span className={`text-sm font-medium truncate block ${isPaid ? 'text-green-600/60 line-through' : 'text-gray-900'}`}>
                                        {item.cantidad}× {item.nombre}
                                      </span>
                                      {isPaid && (
                                        <span className="text-[9px] font-bold text-green-600">✓ Pagado</span>
                                      )}
                                      {!isPaid && item.notas && (
                                        <span className="text-[10px] text-amber-600 truncate block">📝 {item.notas}</span>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`text-sm font-semibold ml-2 shrink-0 ${isPaid ? 'text-green-600/60' : 'text-gray-700'}`}>
                                    S/ {(item.precio * item.cantidad).toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Sección Cliente (boleta electrónica) */}
                      <div className="mb-4">
                        <button
                          onClick={() => { setShowClienteSearchHist(true); setClienteSearchHist(''); setClientesHist([]); }}
                          className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-dashed border-gray-300 px-3 py-2 rounded-lg transition-colors"
                        >
                          <Search size={13} />
                          {clienteHist
                            ? `🧑 ${clienteHist.nombre}${clienteHist.dni ? ` · ${clienteHist.dni}` : ''}`
                            : 'Buscar o registrar cliente (opcional para boleta)'}
                        </button>
                        {clienteHist && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={async () => {
                                setSendingSunatHist(true);
                                try {
                                  const res = await fetch('/api/sunat/enviar', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      comanda_id: c.id,
                                      cliente_id: clienteHist.id,
                                      tipo_doc: 'boleta',
                                      cliente: {
                                        tipo_doc: clienteHist.ruc ? 'RUC' : 'DNI',
                                        numero_doc: clienteHist.ruc || clienteHist.dni || '00000000',
                                        razon_social: clienteHist.nombre,
                                      },
                                      items: (c.items || []).map(i => ({
                                        nombre: i.nombre,
                                        cantidad: i.cantidad,
                                        precio: i.precio,
                                      })),
                                      observaciones: `Mesa: ${c.mesa}`,
                                    }),
                                  });
                                  const data = await res.json();
                                  setToastHist(data.success
                                    ? `✅ Boleta ${data.boleta?.numero_doc || ''} emitida`
                                    : `❌ Error: ${data.mensaje || data.error}`);
                                } catch {
                                  setToastHist('❌ Error al emitir boleta');
                                } finally { setSendingSunatHist(false); }
                              }}
                              disabled={sendingSunatHist}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2.5 rounded-xl text-xs font-bold hover:from-amber-600 hover:to-orange-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none shadow-md"
                            >
                              {sendingSunatHist ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                  <polyline points="14 2 14 8 20 8"/>
                                  <line x1="16" y1="13" x2="8" y2="13"/>
                                  <line x1="16" y1="17" x2="8" y2="17"/>
                                </svg>
                              )}
                              {sendingSunatHist ? 'Enviando...' : 'Boleta Electrónica'}
                            </button>
                            <button
                              onClick={() => {
                                setPagoModalData(null);
                                setBoletaData({
                                  mesa: c.mesa,
                                  mozoNombre: c.mozo_nombre || 'Mozo',
                                  fecha: c.fecha,
                                  hora: c.hora,
                                  items: (c.items || []).map((i: any) => ({ item: i.nombre, cantidad: i.cantidad, precio: i.precio })),
                                  clienteNombre: clienteHist.nombre,
                                  clienteDocumento: clienteHist.ruc || clienteHist.dni
                                });
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors shadow-sm"
                            >
                              🖨️ Ticket
                            </button>
                            {clienteHist.telefono && (
                              <button
                                onClick={async () => {
                                  setSendingWhatsAppHist(true);
                                  const items = (c.items || []).map(i => ({
                                    nombre: i.nombre,
                                    cantidad: i.cantidad,
                                    precio: i.precio,
                                  }));
                                  try {
                                    const res = await fetch('/api/whatsapp/enviar', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        tipo: 'boleta',
                                        telefono: clienteHist.telefono,
                                        cliente_nombre: clienteHist.nombre,
                                        mesa: c.mesa,
                                        items,
                                        total: Number(c.total),
                                        metodo_pago: pagoInputs.yape ? 'Yape/Mixto' : 'Efectivo',
                                      }),
                                    });
                                    const data = await res.json();
                                    setToastHist(data.success ? '✅ Voucher enviado por WhatsApp' : '❌ Error al enviar');
                                  } catch {
                                    setToastHist('❌ Error de conexión');
                                  } finally { setSendingWhatsAppHist(false); }
                                }}
                                disabled={sendingWhatsAppHist}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2.5 rounded-xl text-xs font-bold hover:from-green-600 hover:to-emerald-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none shadow-md"
                              >
                                {sendingWhatsAppHist ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                  </svg>
                                )}
                                {sendingWhatsAppHist ? 'Enviando...' : 'WhatsApp'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 mb-6">
                        {/* Pago Rápido Completo */}
                        <div className="flex gap-2">
                          {(() => {
                            const itemsConId = (c.items || []).filter(i => i.id);
                            const selectedItems = itemsConId.length > 0
                              ? itemsConId.filter(i => selectedItemIds.has(i.id!))
                              : (c.items || []);
                            const selectedTotal = selectedItems.reduce((s, i) => s + i.precio * i.cantidad, 0);
                            const selectedIds = selectedItems.map(i => i.id!).filter(Boolean);
                            const isPartial = selectedIds.length > 0 && selectedIds.length < (c.items?.length || 0);
                            const noSelection = itemsConId.length > 0 && selectedIds.length === 0;
                            return (
                              <>
                                <button onClick={() => setYapeQRData({ comandaId: c.id, total: selectedTotal, yapeMonto: selectedTotal, efectivoMonto: 0, metodo: 'Yape' })} disabled={noSelection} className={'flex-1 py-3 rounded-2xl font-bold transition-colors shadow-md text-sm ' + (noSelection ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#7408B6] text-white hover:bg-[#5C0691]')}>Yape</button>
                                <button onClick={() => { if (noSelection) return; isPartial ? confirmarCobro(c.id, 'Efectivo', selectedIds) : confirmarCobro(c.id, 'Efectivo'); }} disabled={noSelection} className={'flex-1 py-3 rounded-2xl font-bold transition-colors shadow-md text-sm ' + (noSelection ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700')}>Efectivo</button>
                                <button onClick={() => { if (noSelection) return; isPartial ? confirmarCobro(c.id, 'Tarjeta', selectedIds) : confirmarCobro(c.id, 'Tarjeta'); }} disabled={noSelection} className={'flex-1 py-3 rounded-2xl font-bold transition-colors shadow-md text-sm flex items-center justify-center gap-1 ' + (noSelection ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700')}>{noSelection ? '' : <CreditCard size={16} />}{noSelection ? '—' : 'Tarjeta'}</button>
                              </>
                            );
                          })()}
                        </div>

                        <div className="relative flex items-center py-2">
                          <div className="flex-grow border-t border-gray-200"></div>
                          <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-semibold uppercase">O pago mixto / calcular vuelto</span>
                          <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        {/* Entradas Mixtas */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-gray-600 uppercase">Monto Yape</label>
                              {Number(pagoInputs.yape) > 0 && (
                                <button
                                  onClick={() => setYapeQRData({ comandaId: c.id, total: Number(c.total), yapeMonto: Number(pagoInputs.yape), efectivoMonto: Number(pagoInputs.efectivo) || 0, metodo: '' })}
                                  className="text-[10px] text-[#7408B6] font-semibold flex items-center gap-1 hover:text-[#5C0691] transition-colors"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/></svg>
                                  Ver QR
                                </button>
                              )}
                            </div>
                            <div className="relative mt-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">S/</span>
                              <input type="text" inputMode="decimal" value={pagoInputs.yape} onChange={e => setPagoInputs({...pagoInputs, yape: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-9 pr-4 font-bold text-lg focus:ring-2 focus:ring-[#7408B6] focus:outline-none" placeholder="0.00" />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-600 uppercase">Efectivo Recibido</label>
                            <div className="relative mt-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">S/</span>
                              <input type="text" inputMode="decimal" value={pagoInputs.efectivo} onChange={e => setPagoInputs({...pagoInputs, efectivo: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-9 pr-4 font-bold text-lg focus:ring-2 focus:ring-green-600 focus:outline-none" placeholder="0.00" />
                            </div>
                          </div>
                        </div>

                        {/* Cálculo */}
                        {(() => {
                          const itemsConId = (c.items || []).filter(i => i.id);
                          const selectedItems = itemsConId.length > 0
                            ? itemsConId.filter(i => selectedItemIds.has(i.id!))
                            : (c.items || []);
                          const t = selectedItems.reduce((s, i) => s + i.precio * i.cantidad, 0);
                          const y = Number(pagoInputs.yape) || 0;
                          const e = Number(pagoInputs.efectivo) || 0;
                          const abonado = y + e;
                          const faltante = t - abonado;
                          const vuelto = abonado > t ? abonado - t : 0;

                          return (
                            <div className={`p-4 rounded-xl border ${faltante > 0 ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                              {faltante > 0 ? (
                                <p className="text-orange-700 font-bold text-center">Falta cobrar: S/ {faltante.toFixed(2)}</p>
                              ) : (
                                <p className="text-green-700 font-black text-center text-lg">Vuelto: S/ {vuelto.toFixed(2)}</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button onClick={() => { setPagoModalData(null); setClienteHist(null); }} className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 rounded-2xl transition-colors">Cancelar</button>
                        <button
                          disabled={(() => {
                            const itemsConId = (c.items || []).filter(i => i.id);
                            if (itemsConId.length > 0 && selectedItemIds.size === 0) return true;
                            const selectedItems = itemsConId.length > 0
                              ? itemsConId.filter(i => selectedItemIds.has(i.id!))
                              : (c.items || []);
                            const selectedTotal = selectedItems.reduce((s, i) => s + i.precio * i.cantidad, 0);
                            return ((Number(pagoInputs.yape)||0) + (Number(pagoInputs.efectivo)||0)) < selectedTotal;
                          })()}
                          onClick={() => {
                            const itemsConId = (c.items || []).filter(i => i.id);
                            const selectedItems = itemsConId.length > 0
                              ? itemsConId.filter(i => selectedItemIds.has(i.id!))
                              : (c.items || []);
                            const selectedTotal = selectedItems.reduce((s, i) => s + i.precio * i.cantidad, 0);
                            const selectedIds = selectedItems.map(i => i.id!).filter(Boolean);
                            const noSelection = itemsConId.length > 0 && selectedIds.length === 0;
                            if (noSelection) return;
                            const isPartial = selectedIds.length > 0 && selectedIds.length < (c.items?.length || 0);
                            const y = Number(pagoInputs.yape) || 0;
                            const e = Number(pagoInputs.efectivo) || 0;
                            const efectivoCobrado = Math.max(0, selectedTotal - y);
                            let metodo: any = 'Efectivo';
                            if (y > 0 && e > 0) {
                              metodo = `Mixto (Yape: S/${y.toFixed(2)}, Efe: S/${efectivoCobrado.toFixed(2)})`;
                            } else if (y > 0) {
                              metodo = 'Yape';
                            }
                            if (isPartial) {
                              confirmarCobro(c.id, metodo, selectedIds);
                            } else {
                              confirmarCobro(c.id, metodo);
                            }
                          }}
                          className="flex-1 py-3.5 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                          Confirmar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal QR Yape ───────────────────────────────────────────────── */}
      {yapeQRData && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-xs rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const yapeConfig = getYapeConfig();
              return (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Pagar con Yape</h3>
                    <button
                      onClick={() => { setYapeQRData(null); setQrDataUrlHist(''); }}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X size={18} className="text-gray-400" />
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border-2 border-[#7408B6]/20 shadow-lg mb-4 inline-block">
                    {qrDataUrlHist ? (
                      <img
                        src={qrDataUrlHist}
                        alt="QR Yape"
                        className="w-56 h-56 mx-auto"
                      />
                    ) : (
                      <div className="w-56 h-56 mx-auto flex items-center justify-center bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 border-2 border-[#7408B6] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-semibold text-gray-900">{yapeConfig.nombre}</p>
                    <p className="text-lg font-bold text-[#7408B6]">{yapeConfig.numero}</p>
                    <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                      <p className="text-xs text-gray-500">
                        {yapeQRData.yapeMonto < yapeQRData.total
                          ? `Pago Yape (parte del total)`
                          : `Total a pagar`}
                      </p>
                      <p className="text-2xl font-black text-gray-900">S/ {yapeQRData.yapeMonto.toFixed(2)}</p>
                      {yapeQRData.efectivoMonto > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          + Efectivo: S/ {yapeQRData.efectivoMonto.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      Escanea el código QR con tu app Yape
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setYapeQRData(null); setQrDataUrlHist(''); }}
                      className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 rounded-2xl transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        const monto = yapeQRData.yapeMonto;
                        setYapeQRData(null);
                        setQrDataUrlHist('');
                        setPagoInputs(prev => ({ ...prev, yape: String(monto) }));
                      }}
                      className="flex-1 py-3 bg-[#7408B6] text-white font-bold hover:bg-[#5C0691] rounded-2xl transition-colors shadow-md text-sm flex items-center justify-center gap-2"
                    >
                      Pagar — S/ {yapeQRData.yapeMonto.toFixed(2)}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}



      {/* ── Modal de éxito: Pago Parcial ──────────────────────────────── */}
      {partialPaymentSuccess && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-gray-900">💰 Pago Parcial</h3>
              <button
                onClick={() => setPartialPaymentSuccess(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-sm font-bold text-amber-800">
                ✓ Se cobraron {partialPaymentSuccess.items.length} item(s) de {partialPaymentSuccess.mesa}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Método: {partialPaymentSuccess.metodo}
              </p>
            </div>

            <div className="mb-4 border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Items Pagados</span>
              </div>
              <div className="divide-y divide-gray-100">
                {partialPaymentSuccess.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between px-3 py-2">
                    <span className="text-sm text-gray-900">{item.cantidad}× {item.item}</span>
                    <span className="text-sm font-semibold text-gray-700">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 px-3 py-2 border-t border-gray-200 flex justify-between">
                <span className="text-sm font-bold text-gray-900">Total cobrado</span>
                <span className="text-sm font-bold text-amber-600">S/ {partialPaymentSuccess.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPartialPaymentSuccess(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 rounded-2xl transition-colors text-sm"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  const data = partialPaymentSuccess;
                  setPartialPaymentSuccess(null);
                  setBoletaData({
                    mesa: data.mesa,
                    mozoNombre: data.mozoNombre,
                    fecha: data.fecha,
                    hora: data.hora,
                    items: data.items,
                    clienteNombre: '',
                    clienteDocumento: '',
                  });
                }}
                className="flex-1 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-2xl transition-colors shadow-md text-sm flex items-center justify-center gap-2"
              >
                🧾 Boleta (solo pagados)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastHist && (
        <div className="fixed top-4 right-4 z-[200] bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top">
          {toastHist}
        </div>
      )}

      {/* Modal búsqueda de cliente */}
      {showClienteSearchHist && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowClienteSearchHist(false); setShowNewClienteHistForm(false); } }}
        >
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {showNewClienteHistForm ? 'Nuevo Cliente' : 'Buscar Cliente'}
              </h3>
              <button onClick={() => { setShowClienteSearchHist(false); setShowNewClienteHistForm(false); }}
                className="p-1.5 hover:bg-gray-100 rounded-full">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {!showNewClienteHistForm ? (
              <>
                <div className="relative mb-4">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" value={clienteSearchHist}
                    onChange={e => setClienteSearchHist(e.target.value)}
                    placeholder="Buscar por nombre, DNI o RUC..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    autoFocus
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
                  {clientesHist.map(c => (
                    <button key={c.id} onClick={() => {
                      setClienteHist(c);
                      setShowClienteSearchHist(false);
                      setShowNewClienteHistForm(false);
                    }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-100 text-left transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Search size={14} className="text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.nombre}</p>
                        <div className="flex gap-2 text-xs text-gray-500">
                          {c.dni && <span>DNI: {c.dni}</span>}
                          {c.ruc && <span>RUC: {c.ruc}</span>}
                          {c.telefono && <span>📱 {c.telefono}</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                  {clienteSearchHist.length >= 2 && clientesHist.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Sin resultados — puedes registrarlo</p>
                  )}
                  {clienteSearchHist.length < 2 && (
                    <p className="text-sm text-gray-400 text-center py-4">Ingresa al menos 2 caracteres para buscar</p>
                  )}
                </div>

                <button onClick={() => setShowNewClienteHistForm(true)}
                  className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 font-medium hover:border-blue-400 hover:text-blue-600 transition-colors">
                  + Registrar nuevo cliente
                </button>
              </>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  <input type="text" placeholder="Nombre *" value={newClienteHistForm.nombre}
                    onChange={e => setNewClienteHistForm({...newClienteHistForm, nombre: e.target.value})}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">DNI</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="12345678" value={newClienteHistForm.dni} maxLength={8}
                        onChange={e => setNewClienteHistForm({...newClienteHistForm, dni: e.target.value})}
                        className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      <button
                        onClick={async () => {
                          const dniClean = newClienteHistForm.dni.trim();
                          if (!dniClean || dniClean.length < 8) return setToastHist('⚠️ Ingresa 8 dígitos del DNI');
                          setToastHist('🔍 Buscando DNI...');
                          try {
                            // 1. Buscar en BD local primero
                            const localRes = await fetch(`/api/clientes?dni=${encodeURIComponent(dniClean)}`);
                            if (localRes.ok) {
                              const localData = await localRes.json();
                              if (localData && localData.length > 0) {
                                const c = localData[0];
                                setClienteHist({ id: c.id, nombre: c.nombre, dni: c.dni, ruc: c.ruc, telefono: c.telefono });
                                setShowClienteSearchHist(false);
                                setShowNewClienteHistForm(false);
                                return setToastHist('✅ Cliente cargado: ' + c.nombre);
                              }
                            }
                            // 2. Si no existe en BD, consultar API RENIEC
                            const reniecRes = await fetch(`/api/reniec/consulta?dni=${encodeURIComponent(dniClean)}`);
                            if (!reniecRes.ok) {
                              const err = await reniecRes.json();
                              return setToastHist(err.error || '⚠️ Error al consultar DNI en RENIEC');
                            }
                            const reniecData = await reniecRes.json();
                            if (reniecData && reniecData.nombres) {
                              const nombreCompleto = [
                                reniecData.nombres,
                                reniecData.apellidoPaterno,
                                reniecData.apellidoMaterno
                              ].filter(Boolean).join(' ');
                              setNewClienteHistForm(prev => ({
                                ...prev,
                                nombre: prev.nombre || nombreCompleto,
                                dni: dniClean,
                              }));
                              setToastHist('✅ Datos obtenidos de RENIEC: ' + nombreCompleto);
                            } else {
                              setToastHist('⚠️ No se encontraron datos para ese DNI');
                            }
                          } catch { setToastHist('⚠️ Error de conexión al buscar DNI'); }
                        }}
                        className="px-3 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-xs font-semibold flex items-center gap-1"
                        title="Buscar por DNI"
                      >
                        <Search size={14} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">RUC</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="20123456789" value={newClienteHistForm.ruc} maxLength={11}
                        onChange={e => setNewClienteHistForm({...newClienteHistForm, ruc: e.target.value})}
                        className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      <button
                        onClick={async () => {
                          const rucClean = newClienteHistForm.ruc.trim();
                          if (!rucClean || rucClean.length < 11) return setToastHist('⚠️ Ingresa 11 dígitos del RUC');
                          setToastHist('🔍 Buscando RUC...');
                          try {
                            // 1. Buscar en BD local primero
                            const localRes = await fetch(`/api/clientes?ruc=${encodeURIComponent(rucClean)}`);
                            if (localRes.ok) {
                              const localData = await localRes.json();
                              if (localData && localData.length > 0) {
                                const c = localData[0];
                                setClienteHist({ id: c.id, nombre: c.nombre, dni: c.dni, ruc: c.ruc, telefono: c.telefono });
                                setShowClienteSearchHist(false);
                                setShowNewClienteHistForm(false);
                                return setToastHist('✅ Cliente cargado: ' + c.nombre);
                              }
                            }
                            // 2. Si no existe en BD, consultar API SUNAT
                            const sunatRes = await fetch(`/api/sunat/consulta?ruc=${encodeURIComponent(rucClean)}`);
                            if (!sunatRes.ok) {
                              const err = await sunatRes.json();
                              return setToastHist(err.error || '⚠️ Error al consultar RUC en SUNAT');
                            }
                            const sunatData = await sunatRes.json();
                            if (sunatData && sunatData.razonSocial) {
                              setNewClienteHistForm(prev => ({
                                ...prev,
                                nombre: prev.nombre || sunatData.razonSocial,
                                ruc: rucClean,
                              }));
                              setToastHist('✅ Datos obtenidos de SUNAT: ' + sunatData.razonSocial);
                            } else {
                              setToastHist('⚠️ No se encontraron datos para ese RUC');
                            }
                          } catch { setToastHist('⚠️ Error de conexión al buscar RUC'); }
                        }}
                        className="px-3 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-xs font-semibold flex items-center gap-1"
                        title="Buscar por RUC"
                      >
                        <Search size={14} />
                      </button>
                    </div>
                  </div>
                  <input type="tel" placeholder="WhatsApp (opcional)" value={newClienteHistForm.telefono}
                    onChange={e => setNewClienteHistForm({...newClienteHistForm, telefono: e.target.value})}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowNewClienteHistForm(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm">
                    Volver
                  </button>
                  <button onClick={async () => {
                    if (!newClienteHistForm.nombre) return alert('Nombre requerido');
                    try {
                      const res = await fetch('/api/clientes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newClienteHistForm),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        // 409: el DNI/RUC ya existe — usar cliente existente
                        if (res.status === 409 && data.id) {
                          setClienteHist({ id: data.id, ...newClienteHistForm });
                          setShowClienteSearchHist(false);
                          setShowNewClienteHistForm(false);
                          setNewClienteHistForm({ nombre: '', dni: '', ruc: '', telefono: '', email: '' });
                          return setToastHist('✅ Cliente ya existía, usando datos registrados');
                        }
                        return alert(data.error || 'Error al registrar');
                      }
                      setClienteHist(data);
                      setShowClienteSearchHist(false);
                      setShowNewClienteHistForm(false);
                      setNewClienteHistForm({ nombre: '', dni: '', ruc: '', telefono: '', email: '' });
                      setToastHist('✅ Cliente registrado');
                    } catch { alert('Error de conexión'); }
                  }}
                    className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm">
                    Guardar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal detallado del pedido */}
      {detailModal && (
        <div 
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setDetailModal(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{detailModal.mesa}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {detailModal.fecha} · {detailModal.hora}
                  </p>
                </div>
                <button 
                  onClick={() => setDetailModal(null)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  detailModal.estado === 'Pendiente'  ? 'bg-orange-100 text-orange-600' :
                  detailModal.estado === 'Preparando'? 'bg-blue-100 text-blue-600'     :
                  detailModal.estado === 'Listo'     ? 'bg-green-100 text-green-600'   :
                  'bg-gray-100 text-gray-600'
                }`}>{detailModal.estado}</span>
                {detailModal.mozo_nombre && (
                  <span className="text-xs text-gray-400">Mozo: {detailModal.mozo_nombre}</span>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="px-6 py-4 space-y-3">
              {detailModal.items && detailModal.items.length > 0 ? (
                <>
                  <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Productos</h3>
                  {detailModal.items.map((item, i) => {
                    const subtotal = Number(item.precio) * Number(item.cantidad);
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{item.cantidad}×</span>
                            <span className="text-gray-900">{item.nombre}</span>
                          </div>
                          {item.categoria && (
                            <span className="text-[11px] text-gray-400 uppercase ml-7">{item.categoria}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">S/ {subtotal.toFixed(2)}</p>
                          <p className="text-[11px] text-gray-400">S/ {Number(item.precio).toFixed(2)} c/u</p>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">Sin productos registrados</p>
              )}
            </div>

            {/* Footer con total */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Total {detailModal.items?.reduce((s, i) => s + i.cantidad, 0) || 0} productos
                </span>
                <span className="text-2xl font-bold text-gray-900">S/ {Number(detailModal.total).toFixed(2)}</span>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ComandaTicket (compacto para cocina) */}
      {comandaTicketData && (
        <ComandaTicket
          mesa={comandaTicketData.mesa}
          mozoNombre={comandaTicketData.mozoNombre}
          fecha={comandaTicketData.fecha}
          hora={comandaTicketData.hora}
          items={comandaTicketData.items}
          onClose={() => setComandaTicketData(null)}
        />
      )}

      {/* Modal Boleta */}
      {boletaData && (
        <Boleta
          mesa={boletaData.mesa}
          mozoNombre={boletaData.mozoNombre}
          fecha={boletaData.fecha}
          hora={boletaData.hora}
          items={boletaData.items}
          clienteNombre={boletaData.clienteNombre}
          clienteDocumento={boletaData.clienteDocumento}
          onClose={() => setBoletaData(null)}
        />
      )}
    </div>
  );
}
