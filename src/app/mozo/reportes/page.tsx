'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileText, Printer, UtensilsCrossed, Wine, CreditCard, Banknote, Smartphone, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import CierreCajaTicket from '@/components/CierreCajaTicket';

interface ComandaItem {
  nombre: string;
  cantidad: number;
  precio: number;
  categoria?: string;
}

interface Comanda {
  id: number;
  mesa: string;
  total: number;
  metodo_pago?: string;
  estado: string;
  fecha: string;
  hora: string;
  items?: ComandaItem[];
}

export default function MozoReportesPage() {
  const { profile } = useAuth();
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const fechaHoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

  useEffect(() => {
    if (!profile?.id) return;
    const fetchComandas = async () => {
      try {
        const res = await fetch(`/api/pedidos?fecha=${fechaHoy}&mozo_id=${profile.id}`);
        if (res.ok) {
          const data = await res.json();
          const entregadas = data.filter((c: any) => c.estado === 'Entregado');
          setComandas(entregadas);
        }
      } catch (error) {
        console.error("Error cargando reporte:", error);
      }
      setLoading(false);
    };
    fetchComandas();
  }, [profile, fechaHoy]);

  // ── Cálculos de totales ──
  const total = useMemo(() => comandas.reduce((s, c) => s + Number(c.total || 0), 0), [comandas]);
  const totalEfectivo = useMemo(() => comandas.filter(c => c.metodo_pago === 'Efectivo').reduce((sum, c) => sum + Number(c.total || 0), 0), [comandas]);
  const totalYape = useMemo(() => comandas.filter(c => c.metodo_pago === 'Yape' || c.metodo_pago === 'Yape/Mixto').reduce((sum, c) => sum + Number(c.total || 0), 0), [comandas]);
  const totalTarjeta = useMemo(() => comandas.filter(c => c.metodo_pago === 'Tarjeta').reduce((sum, c) => sum + Number(c.total || 0), 0), [comandas]);

  // ── Agregar items por nombre y separar platos de bebidas ──
  const { platosVendidos, bebidasVendidas, totalPlatos, totalBebidas } = useMemo(() => {
    const platosMap: Record<string, { cantidad: number; precio: number }> = {};
    const bebidasMap: Record<string, { cantidad: number; precio: number }> = {};

    comandas.forEach(comanda => {
      if (comanda.items && Array.isArray(comanda.items)) {
        comanda.items.forEach((item) => {
          if (!item.nombre) return;
          const cat = (item.categoria || '').toLowerCase();
          const isBebida = cat === 'bebidas' || cat.includes('gaseosa') || cat.includes('chicha') || cat.includes('cerveza') || cat.includes('sporade') || cat.includes('agua');

          const map = isBebida ? bebidasMap : platosMap;
          if (!map[item.nombre]) {
            map[item.nombre] = { cantidad: 0, precio: item.precio };
          }
          map[item.nombre].cantidad += (item.cantidad || 1);
        });
      }
    });

    const platos = Object.entries(platosMap)
      .map(([nombre, data]) => ({ nombre, ...data }))
      .sort((a, b) => b.cantidad - a.cantidad);
    const bebidas = Object.entries(bebidasMap)
      .map(([nombre, data]) => ({ nombre, ...data }))
      .sort((a, b) => b.cantidad - a.cantidad);

    return {
      platosVendidos: platos,
      bebidasVendidas: bebidas,
      totalPlatos: platos.reduce((s, p) => s + (p.cantidad * p.precio), 0),
      totalBebidas: bebidas.reduce((s, b) => s + (b.cantidad * b.precio), 0),
    };
  }, [comandas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500 font-medium">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText size={22} className="text-blue-600" />
              Reporte de Turno
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {profile?.nombre || 'Mozo'} — {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} ({parseInt(new Date().toLocaleTimeString('en-US', { timeZone: 'America/Lima', hour12: false, hour: 'numeric' })) >= 16 ? 'Turno Noche' : 'Turno Mañana'})
            </p>
          </div>
          <button
            onClick={() => setShowCierreModal(true)}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-black transition-colors shadow-sm w-full sm:w-auto justify-center"
          >
            <Printer size={18} />
            Imprimir Cierre de Caja
          </button>
        </div>
      </div>

      {/* Tarjetas de totales por método de pago */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <TrendingUp size={16} className="text-gray-600" />
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Ventas</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">S/ {total.toFixed(2)}</p>
          <p className="text-[10px] text-gray-400 mt-1">{comandas.length} comandas</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-green-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Banknote size={16} className="text-green-600" />
            </div>
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Efectivo</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-700">S/ {totalEfectivo.toFixed(2)}</p>
          <p className="text-[10px] text-gray-400 mt-1">{comandas.filter(c => c.metodo_pago === 'Efectivo').length} pagos</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Smartphone size={16} className="text-purple-600" />
            </div>
            <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Yape</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-purple-700">S/ {totalYape.toFixed(2)}</p>
          <p className="text-[10px] text-gray-400 mt-1">{comandas.filter(c => c.metodo_pago === 'Yape' || c.metodo_pago === 'Yape/Mixto').length} pagos</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <CreditCard size={16} className="text-blue-600" />
            </div>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Tarjeta</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-700">S/ {totalTarjeta.toFixed(2)}</p>
          <p className="text-[10px] text-gray-400 mt-1">{comandas.filter(c => c.metodo_pago === 'Tarjeta').length} pagos</p>
        </div>
      </div>

      {/* Detalle de Platos y Bebidas por separado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* PLATOS VENDIDOS */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <UtensilsCrossed size={16} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Platos Vendidos</h3>
                <p className="text-[10px] text-gray-400">{platosVendidos.reduce((s, p) => s + p.cantidad, 0)} unidades</p>
              </div>
            </div>
            <span className="text-sm font-bold text-orange-600">S/ {totalPlatos.toFixed(2)}</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {platosVendidos.length === 0 ? (
              <div className="text-center py-8">
                <UtensilsCrossed size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">Sin platos registrados hoy</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {platosVendidos.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.nombre}</p>
                      <p className="text-[10px] text-gray-400">S/ {Number(p.precio).toFixed(2)} c/u</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">({p.cantidad})</span>
                      <p className="text-[10px] text-gray-500 mt-0.5">S/ {(p.cantidad * p.precio).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BEBIDAS VENDIDAS */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Wine size={16} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Bebidas Vendidas</h3>
                <p className="text-[10px] text-gray-400">{bebidasVendidas.reduce((s, b) => s + b.cantidad, 0)} unidades</p>
              </div>
            </div>
            <span className="text-sm font-bold text-blue-600">S/ {totalBebidas.toFixed(2)}</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {bebidasVendidas.length === 0 ? (
              <div className="text-center py-8">
                <Wine size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">Sin bebidas registradas hoy</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {bebidasVendidas.map((b, idx) => (
                  <div key={idx} className="flex justify-between items-center px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{b.nombre}</p>
                      <p className="text-[10px] text-gray-400">S/ {Number(b.precio).toFixed(2)} c/u</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">({b.cantidad})</span>
                      <p className="text-[10px] text-gray-500 mt-0.5">S/ {(b.cantidad * b.precio).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detalle de comandas individuales */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Detalle por Mesa</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Todas las comandas cobradas del día</p>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {comandas.length === 0 ? (
            <div className="text-center py-10">
              <FileText size={28} className="mx-auto text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">Sin comandas cobradas hoy</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {comandas.map((c) => (
                <div key={c.id} className="px-5 py-3 hover:bg-gray-50/30 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">{c.mesa}</span>
                      <div>
                        <p className="text-xs text-gray-500">{c.hora?.slice(0, 5) || '--:--'}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          c.metodo_pago === 'Efectivo' ? 'bg-green-50 text-green-600' :
                          c.metodo_pago === 'Yape' || c.metodo_pago === 'Yape/Mixto' ? 'bg-purple-50 text-purple-600' :
                          c.metodo_pago === 'Tarjeta' ? 'bg-blue-50 text-blue-600' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {c.metodo_pago || 'Sin método'}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-900">S/ {Number(c.total).toFixed(2)}</span>
                  </div>
                  {c.items && c.items.length > 0 && (
                    <div className="mt-2 ml-12 flex flex-wrap gap-1">
                      {c.items.map((item, i) => (
                        <span key={i} className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                          {item.nombre} ({item.cantidad})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cierre de Caja Modal */}
      {showCierreModal && profile && (
        <CierreCajaTicket
          mozoNombre={profile.nombre}
          mozoId={profile.id}
          turno={parseInt(new Date().toLocaleTimeString('en-US', { timeZone: 'America/Lima', hour12: false, hour: 'numeric' })) >= 16 ? 'Turno Noche' : 'Turno Mañana'}
          fecha={fechaHoy}
          total={total}
          comandas={comandas}
          onClose={() => setShowCierreModal(false)}
        />
      )}
    </div>
  );
}
