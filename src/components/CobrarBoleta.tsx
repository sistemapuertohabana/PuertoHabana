'use client';

import { useState, useEffect } from 'react';
import Boleta from '@/components/Boleta';
import { QrCode, X, Search, CreditCard, CheckCircle2 } from 'lucide-react';

interface ItemBoleta {
  item: string;
  cantidad: number;
  precio: number;
  notas?: string;
}

interface Cliente {
  id: number;
  nombre: string;
  dni?: string;
  ruc?: string;
  telefono?: string;
  email?: string;
}

interface CobrarBoletaProps {
  pedidos: ItemBoleta[];
  mesaLabel: string;
  mozoNombre: string;
  fecha: string;
  hora: string;
  comandaId?: number;
  onSuccess?: () => void;
  className?: string;
  readOnly?: boolean; // Si true, oculta la sección de cobro (solo vista admin)
}

const YAPE_NUMBER_DEFAULT = '942 902 367';
const YAPE_NOMBRE_DEFAULT = 'PUERTO HABANA';

function getYapeConfig() {
  if (typeof window === 'undefined') {
    return { numero: YAPE_NUMBER_DEFAULT, nombre: YAPE_NOMBRE_DEFAULT, qrImage: '' };
  }
  try {
    const stored = localStorage.getItem('ph_pago_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        numero: parsed.yapeNumero || process.env.NEXT_PUBLIC_YAPE_NUMBER || YAPE_NUMBER_DEFAULT,
        nombre: parsed.yapeNombre || process.env.NEXT_PUBLIC_YAPE_NOMBRE || YAPE_NOMBRE_DEFAULT,
        qrImage: parsed.yapeQRImage || '',
      };
    }
  } catch {}
  return {
    numero: process.env.NEXT_PUBLIC_YAPE_NUMBER || YAPE_NUMBER_DEFAULT,
    nombre: process.env.NEXT_PUBLIC_YAPE_NOMBRE || YAPE_NOMBRE_DEFAULT,
    qrImage: '',
  };
}

export default function CobrarBoleta({
  pedidos,
  mesaLabel,
  mozoNombre,
  fecha,
  hora,
  comandaId,
  onSuccess,
  className = '',
  readOnly = false,
}: CobrarBoletaProps) {
  const [showBoleta, setShowBoleta] = useState(false);
  const [showYapeQR, setShowYapeQR] = useState(false);
  const [showClienteSearch, setShowClienteSearch] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  // Estado de búsqueda de cliente
  const [clienteSearch, setClienteSearch] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelected, setClienteSelected] = useState<Cliente | null>(null);
  const [showNewClienteForm, setShowNewClienteForm] = useState(false);
  const [newClienteForm, setNewClienteForm] = useState({ nombre: '', dni: '', ruc: '', telefono: '', email: '' });
  const [loadClientes, setLoadClientes] = useState(false);

  // Estados para boleta electrónica y WhatsApp
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [sendingSunat, setSendingSunat] = useState(false);
  const [sunatResult, setSunatResult] = useState<string | null>(null);

  // Estado para confirmar cobro
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [selectedMetodo, setSelectedMetodo] = useState<'Efectivo' | 'Yape' | 'Tarjeta' | 'Otro'>('Efectivo');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Generar QR al abrir el modal
  useEffect(() => {
    if (!showYapeQR) return;
    const config = getYapeConfig();
    if (config.qrImage) {
      // Tiene imagen QR propia
      setQrDataUrl(config.qrImage);
    } else {
      // Generar QR desde el número
      import('qrcode').then((QRCode) => {
        QRCode.toDataURL(config.numero, {
          width: 280,
          margin: 2,
          color: { dark: '#7408B6', light: '#FFFFFF' },
        }).then(setQrDataUrl).catch(() => {});
      });
    }
  }, [showYapeQR]);

  // Buscar clientes
  useEffect(() => {
    if (!showClienteSearch) return;
    const debounce = setTimeout(async () => {
      if (clienteSearch.length < 2) {
        setClientes([]);
        setLoadClientes(false);
        return;
      }
      try {
        const res = await fetch(`/api/clientes?search=${encodeURIComponent(clienteSearch)}&limit=10`);
        if (res.ok) setClientes(await res.json());
      } catch {} finally { setLoadClientes(false); }
    }, 300);
    return () => clearTimeout(debounce);
  }, [clienteSearch, showClienteSearch]);

  const yapeConfig = getYapeConfig();
  const total = pedidos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);



  const handleEnviarWhatsApp = async () => {
    if (!clienteSelected?.telefono) {
      setToast('⚠️ El cliente no tiene teléfono registrado');
      return;
    }
    setSendingWhatsApp(true);

    const mensaje =
      `🧾 *PUERTO HABANA*\n` +
      `╔══════════════════════════╗\n` +
      `*VOUCHER DE PAGO*\n` +
      `╚══════════════════════════╝\n\n` +
      `👤 *${clienteSelected.nombre}*\n` +
      `🏠 *Mesa:* ${mesaLabel}\n` +
      `📅 *${fecha} · ${hora}*\n\n` +
      `*Productos:*\n` +
      pedidos.map(p => `  ${p.cantidad}x ${p.item} — S/ ${(p.precio * p.cantidad).toFixed(2)}`).join('\n') +
      `\n\n━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 *Total: S/ ${total.toFixed(2)}*\n\n` +
      `¡Gracias por su preferencia! 🎉\n` +
      `*Puerto Habana Cevichería*`;

    try {
      const res = await fetch('/api/whatsapp/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'individual', telefono: clienteSelected.telefono, mensaje }),
      });
      const data = await res.json();
      setToast(data.success ? '✅ Voucher enviado por WhatsApp' : '❌ Error al enviar');
    } catch {
      setToast('❌ Error de conexión');
    } finally { setSendingWhatsApp(false); }
  };

  const handleEmitirBoletaElectronica = async () => {
    if (!clienteSelected) {
      setToast('⚠️ Selecciona un cliente para emitir boleta');
      return;
    }
    setSendingSunat(true);

    try {
      const res = await fetch('/api/sunat/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comanda_id: comandaId,
          cliente_id: clienteSelected.id,
          tipo_doc: 'boleta',
          cliente: {
            tipo_doc: clienteSelected.ruc ? 'RUC' : 'DNI',
            numero_doc: clienteSelected.ruc || clienteSelected.dni || '00000000',
            razon_social: clienteSelected.nombre,
          },
          items: pedidos.map(p => ({
            nombre: p.item,
            cantidad: p.cantidad,
            precio: p.precio,
          })),
          observaciones: `Mesa: ${mesaLabel}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSunatResult(`✅ Boleta ${data.boleta?.numero_doc || ''} enviada a SUNAT`);
        setToast(`✅ Boleta ${data.boleta?.numero_doc || ''} emitida correctamente`);

        // Si el cliente tiene WhatsApp, ofrecer envío automático
        if (clienteSelected.telefono) {
          handleEnviarWhatsApp();
        }
      } else {
        setToast(`❌ Error SUNAT: ${data.mensaje || data.error}`);
      }
    } catch {
      setToast('❌ Error al emitir boleta');
    } finally { setSendingSunat(false); }
  };

  const handleRegistrarNuevoCliente = async () => {
    if (!newClienteForm.nombre) return alert('Nombre requerido');
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClienteForm),
      });
      const data = await res.json();
      if (!res.ok) {
        // 409: DNI ya existe — usar el cliente existente
        if (res.status === 409 && data.id) {
          setClienteSelected({ id: data.id, ...newClienteForm });
          setShowNewClienteForm(false);
          setNewClienteForm({ nombre: '', dni: '', ruc: '', telefono: '', email: '' });
          return setToast('✅ Cliente ya existía, usando datos registrados');
        }
        return alert(data.error || 'Error al registrar');
      }
      setClienteSelected(data);
      setShowNewClienteForm(false);
      setNewClienteForm({ nombre: '', dni: '', ruc: '', telefono: '', email: '' });
      setToast('✅ Cliente registrado');
    } catch { alert('Error de conexión'); }
  };

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }, [toast]);

  const handleConfirmarCobro = async () => {
    if (!comandaId) {
      setToast('⚠️ No hay comanda asociada para cobrar');
      return;
    }
    setConfirmingPayment(true);
    try {
      const res = await fetch(`/api/pedidos/${comandaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Entregado', metodo_pago: selectedMetodo }),
      });
      if (!res.ok) throw new Error('Error al confirmar cobro');
      setPaymentConfirmed(true);
      setToast(`✅ Cobro confirmado — ${selectedMetodo}`);
      setTimeout(() => onSuccess?.(), 800);
    } catch {
      setToast('❌ Error al confirmar cobro');
    } finally {
      setConfirmingPayment(false);
    }
  };

  if (!pedidos.length) return null;

  return (
    <div className={className}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[200] bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top">
          {toast}
        </div>
      )}

      {/* Botones principales */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowYapeQR(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-[#7408B6] text-white px-4 py-2.5 rounded-xl hover:bg-[#5C0691] transition-colors text-sm font-semibold"
        >
          <QrCode size={16} />
          QR Yape
        </button>

        <button
          onClick={() => setShowBoleta(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold"
        >
          🧾 Boleta
        </button>
      </div>

      {/* Botón de cliente y acciones SUNAT/WhatsApp */}
      <div className="mt-2 space-y-2">
        <button
          onClick={() => { setShowClienteSearch(true); setClienteSearch(''); setClienteSelected(null); }}
          className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-dashed border-gray-300 px-3 py-2 rounded-lg transition-colors"
        >
          <Search size={13} />
          {clienteSelected ? `🧑 ${clienteSelected.nombre}${clienteSelected.dni ? ` · ${clienteSelected.dni}` : ''}` : 'Buscar o registrar cliente para Boleta Electrónica'}
        </button>

        {clienteSelected && (
          <div className="flex gap-2">
            <button
              onClick={handleEmitirBoletaElectronica}
              disabled={sendingSunat}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2.5 rounded-xl text-xs font-bold hover:from-amber-600 hover:to-orange-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none shadow-md"
            >
              {sendingSunat ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              )}
              {sendingSunat ? 'Enviando...' : 'Boleta Electrónica'}
            </button>
            {clienteSelected.telefono && (
              <button
                onClick={handleEnviarWhatsApp}
                disabled={sendingWhatsApp}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2.5 rounded-xl text-xs font-bold hover:from-green-600 hover:to-emerald-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none shadow-md"
              >
                {sendingWhatsApp ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                )}
                {sendingWhatsApp ? 'Enviando...' : 'WhatsApp'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Confirmar Cobro — solo visible para el Mozo, no en vista Admin */}
      {!readOnly && comandaId && !paymentConfirmed && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-green-600" />
            <span className="text-sm font-bold text-gray-900">Confirmar Cobro</span>
          </div>
          <div className="flex gap-2 mb-3">
            {(['Efectivo', 'Yape', 'Tarjeta', 'Otro'] as const).map(m => (
              <button
                key={m}
                onClick={() => setSelectedMetodo(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedMetodo === m
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {m === 'Efectivo' ? '💵' : m === 'Yape' ? '📱' : m === 'Tarjeta' ? '💳' : '🔄'} {m}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
            <div>
              <p className="text-xs text-gray-500">Total a cobrar</p>
              <p className="text-lg font-bold text-gray-900">S/ {total.toFixed(2)}</p>
            </div>
            <button
              onClick={handleConfirmarCobro}
              disabled={confirmingPayment}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {confirmingPayment ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Confirmar Cobro
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {paymentConfirmed && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
          <CheckCircle2 size={24} className="mx-auto text-green-600 mb-1" />
          <p className="text-sm font-bold text-green-700">✅ Cobro Confirmado</p>
          <p className="text-xs text-green-600 mt-1">Comanda marcada como Entregado — {selectedMetodo}</p>
        </div>
      )}

      {/* Modal QR Yape */}
      {showYapeQR && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowYapeQR(false);
          }}
        >
          <div className="bg-white w-full max-w-xs rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Pagar con Yape</h3>
              <button
                onClick={() => setShowYapeQR(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="bg-white rounded-2xl p-4 border-2 border-[#7408B6]/20 shadow-lg mb-4 inline-block">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
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
                <p className="text-xs text-gray-500">Total a pagar</p>
                <p className="text-2xl font-black text-gray-900">S/ {total.toFixed(2)}</p>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {mesaLabel} · {mozoNombre}
              </p>
            </div>

            <button
              onClick={() => {
                setShowYapeQR(false);
                setShowBoleta(true);
              }}
              className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-semibold"
            >
              Imprimir Boleta
            </button>
          </div>
        </div>
      )}



      {/* Modal Búsqueda de Cliente */}
      {showClienteSearch && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowClienteSearch(false); }}
        >
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {showNewClienteForm ? 'Nuevo Cliente' : 'Buscar Cliente'}
              </h3>
              <button onClick={() => { setShowClienteSearch(false); setShowNewClienteForm(false); }}
                className="p-1.5 hover:bg-gray-100 rounded-full">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {!showNewClienteForm ? (
              <>
                <div className="relative mb-4">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" value={clienteSearch}
                    onChange={e => setClienteSearch(e.target.value)}
                    placeholder="Buscar por nombre, DNI o RUC..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    autoFocus
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
                  {clientes.map(c => (
                    <button key={c.id} onClick={() => {
                      setClienteSelected(c);
                      setShowClienteSearch(false);
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
                  {clienteSearch.length >= 2 && clientes.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Sin resultados — puedes registrarlo</p>
                  )}
                </div>

                <button onClick={() => setShowNewClienteForm(true)}
                  className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 font-medium hover:border-amber-400 hover:text-amber-600 transition-colors">
                  + Registrar nuevo cliente
                </button>
              </>
            ) : (
              <>
                {/* Formulario nuevo cliente */}
                <div className="space-y-3 mb-4">
                  <input type="text" placeholder="Nombre *" value={newClienteForm.nombre}
                    onChange={e => setNewClienteForm({...newClienteForm, nombre: e.target.value})}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">DNI</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="12345678" value={newClienteForm.dni} maxLength={8}
                        onChange={e => setNewClienteForm({...newClienteForm, dni: e.target.value})}
                        className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                      <button
                        onClick={async () => {
                          const dniClean = newClienteForm.dni.trim();
                          if (!dniClean || dniClean.length < 8) return setToast('⚠️ Ingresa 8 dígitos del DNI');
                          setToast('🔍 Buscando DNI...');
                          try {
                            const localRes = await fetch(`/api/clientes?dni=${encodeURIComponent(dniClean)}`);
                            if (localRes.ok) {
                              const localData = await localRes.json();
                              if (localData && localData.length > 0) {
                                const c = localData[0];
                                setClienteSelected({ id: c.id, nombre: c.nombre, dni: c.dni, ruc: c.ruc, telefono: c.telefono });
                                setShowClienteSearch(false);
                                return setToast('✅ Cliente cargado: ' + c.nombre);
                              }
                            }
                            const reniecRes = await fetch(`/api/reniec/consulta?dni=${encodeURIComponent(dniClean)}`);
                            if (!reniecRes.ok) {
                              const err = await reniecRes.json();
                              return setToast(err.error || '⚠️ Error al consultar DNI en RENIEC');
                            }
                            const reniecData = await reniecRes.json();
                            if (reniecData && reniecData.nombres) {
                              const nombreCompleto = [reniecData.nombres, reniecData.apellidoPaterno, reniecData.apellidoMaterno].filter(Boolean).join(' ');
                              setNewClienteForm(prev => ({ ...prev, nombre: prev.nombre || nombreCompleto, dni: dniClean }));
                              setToast('✅ Datos obtenidos de RENIEC: ' + nombreCompleto);
                            } else {
                              setToast('⚠️ No se encontraron datos para ese DNI');
                            }
                          } catch { setToast('⚠️ Error de conexión al buscar DNI'); }
                        }}
                        className="px-3 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors text-xs font-semibold flex items-center gap-1"
                        title="Buscar por DNI"
                      >
                        <Search size={14} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">RUC</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="20123456789" value={newClienteForm.ruc} maxLength={11}
                        onChange={e => setNewClienteForm({...newClienteForm, ruc: e.target.value})}
                        className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                      <button
                        onClick={async () => {
                          const rucClean = newClienteForm.ruc.trim();
                          if (!rucClean || rucClean.length < 11) return setToast('⚠️ Ingresa 11 dígitos del RUC');
                          setToast('🔍 Buscando RUC...');
                          try {
                            const localRes = await fetch(`/api/clientes?ruc=${encodeURIComponent(rucClean)}`);
                            if (localRes.ok) {
                              const localData = await localRes.json();
                              if (localData && localData.length > 0) {
                                const c = localData[0];
                                setClienteSelected({ id: c.id, nombre: c.nombre, dni: c.dni, ruc: c.ruc, telefono: c.telefono });
                                setShowClienteSearch(false);
                                return setToast('✅ Cliente cargado: ' + c.nombre);
                              }
                            }
                            const sunatRes = await fetch(`/api/sunat/consulta?ruc=${encodeURIComponent(rucClean)}`);
                            if (!sunatRes.ok) {
                              const err = await sunatRes.json();
                              return setToast(err.error || '⚠️ Error al consultar RUC en SUNAT');
                            }
                            const sunatData = await sunatRes.json();
                            if (sunatData && sunatData.razonSocial) {
                              setNewClienteForm(prev => ({ ...prev, nombre: prev.nombre || sunatData.razonSocial, ruc: rucClean }));
                              setToast('✅ Datos obtenidos de SUNAT: ' + sunatData.razonSocial);
                            } else {
                              setToast('⚠️ No se encontraron datos para ese RUC');
                            }
                          } catch { setToast('⚠️ Error de conexión al buscar RUC'); }
                        }}
                        className="px-3 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors text-xs font-semibold flex items-center gap-1"
                        title="Buscar por RUC"
                      >
                        <Search size={14} />
                      </button>
                    </div>
                  </div>
                  <input type="tel" placeholder="WhatsApp (opcional)" value={newClienteForm.telefono}
                    onChange={e => setNewClienteForm({...newClienteForm, telefono: e.target.value})}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowNewClienteForm(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm">
                    Volver
                  </button>
                  <button onClick={handleRegistrarNuevoCliente}
                    className="flex-1 py-2.5 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-colors text-sm">
                    Guardar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Boleta */}
      {showBoleta && (
        <Boleta
          mesa={mesaLabel}
          mozoNombre={mozoNombre}
          fecha={fecha}
          hora={hora}
          items={pedidos}
          clienteNombre={clienteSelected?.nombre}
          clienteDocumento={clienteSelected?.ruc || clienteSelected?.dni}
          onClose={() => { setShowBoleta(false); onSuccess?.(); }}
        />
      )}
    </div>
  );
}
