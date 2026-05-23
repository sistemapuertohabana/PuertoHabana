'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, CheckCircle2, Clock } from 'lucide-react';

interface Comanda {
  id: number;
  mesa: string;
  mozo_nombre?: string;
  estado: string;
  hora: string;
  fecha: string;
  total: number;
  items?: { nombre: string; cantidad: number; precio: number }[];
}

function getLocalDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MozoHistorialPage() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [pagoModalData, setPagoModalData] = useState<Comanda | null>(null);
  const [pagoInputs, setPagoInputs] = useState({ yape: '', efectivo: '' });
  const [fecha] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString()
      : getLocalDateString()
  );

  // Solo muestra las comandas del mozo logueado
  const mozoId = typeof window !== 'undefined'
    ? (() => { try { return JSON.parse(localStorage.getItem('ph_mozo_session') || '{}').id || ''; } catch { return ''; } })()
    : '';

  const loadComandas = useCallback(async () => {
    try {
      const res = await fetch(`/api/pedidos?fecha=${fecha}`);
      if (!res.ok) throw new Error();
      const data: Comanda[] = await res.json();
      // Filtrar por mozo si hay sesión
      setComandas(mozoId ? data.filter((c: any) => c.mozo_id === mozoId || !mozoId) : data);
    } catch {
      // Fallback localStorage
      try {
        const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
        const hoy = all.filter((p: any) => p.fecha === fecha);
        // Agrupar por mesa+hora como "comanda"
        const grouped: Record<string, Comanda> = {};
        hoy.forEach((p: any) => {
          const key = `${p.mesa}-${p.hora}`;
          if (!grouped[key]) {
            grouped[key] = { id: p.id, mesa: p.mesa, mozo_nombre: p.mozoNombre, estado: p.estado, hora: p.hora, fecha: p.fecha, total: 0, items: [] };
          }
          grouped[key].total += p.precio * p.cantidad;
          grouped[key].items?.push({ nombre: p.item, cantidad: p.cantidad, precio: p.precio });
        });
        setComandas(Object.values(grouped));
      } catch { setComandas([]); }
    }
    setLoading(false);
  }, [fecha, mozoId]);

  useEffect(() => {
    loadComandas();
    const interval = setInterval(loadComandas, 5000);
    window.addEventListener('storage', loadComandas);
    return () => { clearInterval(interval); window.removeEventListener('storage', loadComandas); };
  }, [loadComandas]);

  const confirmarCobro = async (id: number, metodo: 'Yape' | 'Efectivo') => {
    try {
      await fetch(`/api/pedidos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Entregado', metodo_pago: metodo }),
      });
      loadComandas();
      setPagoModalData(null);
      setPagoInputs({ yape: '', efectivo: '' });
      
      // Intentar enviar notificación al admin
      fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rol_destino: 'admin',
          titulo: 'Nuevo Pago Recibido',
          mensaje: `La comanda fue cobrada con ${metodo}`
        })
      }).catch(() => {});
      
    } catch {
      const all = JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]');
      localStorage.setItem('puerto_habana_pedidos', JSON.stringify(all.map((p: any) => p.id === id ? { ...p, estado: 'Entregado', metodo_pago: metodo } : p)));
      loadComandas();
      setPagoModalData(null);
      setPagoInputs({ yape: '', efectivo: '' });
    }
  };

  const handlePagoModalOpen = (c: Comanda) => {
    setPagoModalData(c);
    setPagoInputs({ yape: '', efectivo: '' });
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
          <p className="text-2xl font-bold text-blue-600">S/ {Number(total).toFixed(2)}</p>
        </div>
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
              <div key={c.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
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
                  </div>
                  <p className="text-base font-bold text-gray-900">S/ {Number(c.total).toFixed(2)}</p>
                </div>

                {c.items && c.items.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {c.items.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="font-bold text-gray-900">{item.cantidad}×</span>
                        <span>{item.nombre}</span>
                        <span className="text-gray-400 ml-auto">S/ {(Number(item.precio) * Number(item.cantidad)).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                <div className="flex gap-2">
                  <a href={`/print/${c.id}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors text-sm">
                    🖨️ Imprimir
                  </a>
                  {c.estado === 'Listo' && (
                    <button onClick={() => handlePagoModalOpen(c)}
                      className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-black transition-colors text-sm">
                      <CheckCircle2 size={16} /> Cobrar
                    </button>
                  )}
                </div>

                {/* Modal de Pago Mixto / Vuelto */}
                {pagoModalData?.id === c.id && (
                  <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                      <h3 className="text-xl font-bold mb-1 text-center text-gray-900">Cobrar Mesa {c.mesa}</h3>
                      <p className="text-center text-3xl font-black text-blue-600 mb-6">S/ {Number(c.total).toFixed(2)}</p>

                      <div className="space-y-4 mb-6">
                        {/* Pago Rápido Completo */}
                        <div className="flex gap-3">
                          <button onClick={() => confirmarCobro(c.id, 'Yape')} className="flex-1 bg-[#7408B6] text-white py-3 rounded-2xl font-bold hover:bg-[#5C0691] transition-colors shadow-md">Todo Yape</button>
                          <button onClick={() => confirmarCobro(c.id, 'Efectivo')} className="flex-1 bg-green-600 text-white py-3 rounded-2xl font-bold hover:bg-green-700 transition-colors shadow-md">Todo Efectivo</button>
                        </div>
                        
                        <div className="relative flex items-center py-2">
                          <div className="flex-grow border-t border-gray-200"></div>
                          <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-semibold uppercase">O pago mixto / calcular vuelto</span>
                          <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        {/* Entradas Mixtas */}
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-bold text-gray-600 uppercase">Monto Yape</label>
                            <div className="relative mt-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">S/</span>
                              <input type="number" step="0.10" value={pagoInputs.yape} onChange={e => setPagoInputs({...pagoInputs, yape: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-9 pr-4 font-bold text-lg focus:ring-2 focus:ring-[#7408B6] focus:outline-none" placeholder="0.00" />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-600 uppercase">Efectivo Recibido</label>
                            <div className="relative mt-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">S/</span>
                              <input type="number" step="0.10" value={pagoInputs.efectivo} onChange={e => setPagoInputs({...pagoInputs, efectivo: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-9 pr-4 font-bold text-lg focus:ring-2 focus:ring-green-600 focus:outline-none" placeholder="0.00" />
                            </div>
                          </div>
                        </div>

                        {/* Cálculo */}
                        {(() => {
                          const t = Number(c.total);
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
                        <button onClick={() => setPagoModalData(null)} className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 rounded-2xl transition-colors">Cancelar</button>
                        <button 
                          disabled={((Number(pagoInputs.yape)||0) + (Number(pagoInputs.efectivo)||0)) < Number(c.total)}
                          onClick={() => {
                            const t = Number(c.total);
                            const y = Number(pagoInputs.yape) || 0;
                            const e = Number(pagoInputs.efectivo) || 0;
                            // El efectivo cobrado real es (total - yape)
                            const efectivoCobrado = Math.max(0, t - y);
                            let metodo: any = 'Efectivo';
                            if (y > 0 && e > 0) {
                              metodo = `Mixto (Yape: S/${y.toFixed(2)}, Efe: S/${efectivoCobrado.toFixed(2)})`;
                            } else if (y > 0) {
                              metodo = 'Yape';
                            }
                            confirmarCobro(c.id, metodo);
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
    </div>
  );
}
