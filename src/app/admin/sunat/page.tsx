'use client';

import { useState, useEffect } from 'react';
import {
  Landmark, FileText, Download, TrendingUp, AlertTriangle,
  Settings, RefreshCw, CheckCircle2, XCircle, Search, Calendar,
} from 'lucide-react';

type SunatTab = 'emitir' | 'historial' | 'reportes' | 'limite' | 'config';

interface BoletaEmitida {
  id: number;
  serie: string;
  numero: string;
  numero_doc: string;
  tipo_doc: string;
  total: number;
  igv: number;
  estado_sunat: string;
  razon_social?: string;
  created_at: string;
}

interface ResumenMensual {
  total_emitido: number;
  total_igv: number;
  total_boletas: number;
  aceptadas: number;
  rechazadas: number;
}

interface LimiteIngresos {
  ingresos_anuales: number;
  limite_rus: number;
  limite_general: number;
  porcentaje_usado: number;
  alerta: string;
  excede_rus: boolean;
  excede_general: boolean;
}

export default function SunatPage() {
  const [activeTab, setActiveTab] = useState<SunatTab>('emitir');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  // Reportes
  const [resumenMensual, setResumenMensual] = useState<ResumenMensual | null>(null);
  const [limiteIngresos, setLimiteIngresos] = useState<LimiteIngresos | null>(null);
  const [historialBoletas, setHistorialBoletas] = useState<BoletaEmitida[]>([]);
  const [configSunat, setConfigSunat] = useState<Record<string, string> | null>(null);

  const mesActual = new Date().getMonth() + 1;
  const anioActual = new Date().getFullYear();
  const [mes, setMes] = useState(mesActual);
  const [anio, setAnio] = useState(anioActual);

  useEffect(() => {
    if (activeTab === 'historial') {
      loadHistorial();
    } else if (activeTab === 'reportes') {
      loadReportes();
    } else if (activeTab === 'limite') {
      loadLimite();
    } else if (activeTab === 'config') {
      loadConfig();
    }
  }, [activeTab, mes, anio]);

  const loadHistorial = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sunat/reportes?tipo=mensual&mes=${mes}&anio=${anio}`);
      if (res.ok) {
        const data = await res.json();
        setHistorialBoletas(data.boletas || []);
        setResumenMensual(data.resumen || null);
      }
    } catch {} finally { setLoading(false); }
  };

  const loadReportes = async () => {
    setLoading(true);
    try {
      const [resMensual, resLibro] = await Promise.all([
        fetch(`/api/sunat/reportes?tipo=mensual&mes=${mes}&anio=${anio}`),
        fetch('/api/sunat/reportes?tipo=libro-ventas'),
      ]);
      if (resMensual.ok) {
        const data = await resMensual.json();
        setResumenMensual(data.resumen || null);
        setHistorialBoletas(data.boletas || []);
      }
    } catch {} finally { setLoading(false); }
  };

  const loadLimite = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sunat/reportes?tipo=limite&mes=${mes}&anio=${anio}`);
      if (res.ok) setLimiteIngresos(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sunat/reportes?tipo=config');
      if (res.ok) setConfigSunat(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const cambiarMes = (delta: number) => {
    let nuevoMes = mes + delta;
    let nuevoAnio = anio;
    if (nuevoMes > 12) { nuevoMes = 1; nuevoAnio++; }
    if (nuevoMes < 1) { nuevoMes = 12; nuevoAnio--; }
    setMes(nuevoMes);
    setAnio(nuevoAnio);
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
          <Landmark size={24} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Módulo SUNAT</h1>
          <p className="text-sm text-gray-500 mt-0.5">Boletas electrónicas, reportes tributarios y alertas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto gap-2">
        {([
          { key: 'emitir', label: 'Emitir Boleta', icon: FileText },
          { key: 'historial', label: 'Historial', icon: Search },
          { key: 'reportes', label: 'Reportes', icon: TrendingUp },
          { key: 'limite', label: 'Límites', icon: AlertTriangle },
          { key: 'config', label: 'Config', icon: Settings },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-4 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notificación */}
      {resultado && (
        <div className={`mb-6 p-4 rounded-xl border text-sm ${
          resultado.includes('✅')
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {resultado}
        </div>
      )}

      {/* TAB: Emitir Boleta */}
      {activeTab === 'emitir' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Emitir Boleta Electrónica</h2>
          <p className="text-sm text-gray-500 mb-6">Para emitir boletas desde aquí, usa el botón en el modal de cobro del mozo o del historial. La boleta se genera automáticamente al cobrar una comanda.</p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-amber-800 text-sm flex items-center gap-2">
              <AlertTriangle size={16} /> ¿Cómo funciona?
            </h3>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li>Al cobrar una comanda, el mozo puede <strong>buscar o registrar el cliente</strong> (DNI/RUC)</li>
              <li>Se genera la boleta electrónica y se envía a SUNAT vía Nubefact</li>
              <li>El cliente puede recibir su voucher por <strong>WhatsApp</strong></li>
              <li>Las boletas emitidas se guardan en el historial</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB: Historial */}
      {activeTab === 'historial' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => cambiarMes(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <RefreshCw size={16} className="rotate-180" />
              </button>
              <span className="font-semibold text-gray-900">
                {new Date(anio, mes - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => cambiarMes(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {resumenMensual && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase">Total Emitido</p>
                <p className="text-xl font-bold text-gray-900 mt-1">S/ {resumenMensual.total_emitido.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase">IGV Total</p>
                <p className="text-xl font-bold text-amber-600 mt-1">S/ {resumenMensual.total_igv.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase">Boletas</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{resumenMensual.total_boletas}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase">Aceptadas</p>
                <p className="text-xl font-bold text-green-600 mt-1">
                  {resumenMensual.aceptadas}/{resumenMensual.total_boletas}
                </p>
              </div>
            </div>
          )}

          {/* Tabla de boletas */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doc</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">IGV</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historialBoletas.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">Sin boletas emitidas en este período</td></tr>
                  ) : (
                    historialBoletas.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs font-bold">{b.numero_doc}</td>
                        <td className="px-4 py-3 text-xs">{b.razon_social || '-'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-xs">S/ {Number(b.total).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-xs text-amber-600">S/ {Number(b.igv).toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          {b.estado_sunat === 'aceptado' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              <CheckCircle2 size={12} /> Aceptado
                            </span>
                          ) : b.estado_sunat === 'rechazado' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                              <XCircle size={12} /> Rechazado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Reportes */}
      {activeTab === 'reportes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Download size={16} /> Exportar Reportes Tributarios
            </h3>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium flex items-center gap-2">
                <Download size={14} /> Libro de Ventas (CSV)
              </button>
              <button className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2">
                <Download size={14} /> Reporte Mensual (PDF)
              </button>
              <button className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center gap-2">
                <Download size={14} /> Resumen Tributario
              </button>
            </div>
          </div>

          {resumenMensual && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Resumen del Período</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Boletas</span>
                    <span className="font-semibold">{resumenMensual.total_boletas}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Aceptadas por SUNAT</span>
                    <span className="font-semibold text-green-600">{resumenMensual.aceptadas}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Rechazadas</span>
                    <span className="font-semibold text-red-600">{resumenMensual.rechazadas}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between text-sm">
                    <span className="text-gray-700 font-semibold">Total Ingresos</span>
                    <span className="font-bold text-lg">S/ {resumenMensual.total_emitido.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">IGV</span>
                    <span className="font-semibold text-amber-600">S/ {resumenMensual.total_igv.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Últimas Boletas Emitidas</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {historialBoletas.slice(0, 10).map(b => (
                    <div key={b.id} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg text-xs">
                      <span className="font-mono font-bold">{b.numero_doc}</span>
                      <span className="text-gray-500">S/ {Number(b.total).toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        b.estado_sunat === 'aceptado' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>{b.estado_sunat}</span>
                    </div>
                  ))}
                  {historialBoletas.length === 0 && (
                    <p className="text-center text-gray-400 py-4">Sin boletas</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Límites */}
      {activeTab === 'limite' && (
        <div className="space-y-6">
          {limiteIngresos && (
            <>
              <div className={`rounded-xl border p-6 ${
                limiteIngresos.porcentaje_usado > 80
                  ? 'bg-red-50 border-red-200'
                  : limiteIngresos.porcentaje_usado > 50
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle size={24} className={
                    limiteIngresos.porcentaje_usado > 80 ? 'text-red-500' : 'text-amber-500'
                  } />
                  <div>
                    <h3 className="font-semibold text-gray-900">Alerta de Límite de Ingresos</h3>
                    <p className="text-sm text-gray-600 mt-1">{limiteIngresos.alerta}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-500 uppercase">Ingresos Anuales</p>
                  <p className="text-2xl font-bold mt-1 text-gray-900">
                    S/ {limiteIngresos.ingresos_anuales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-500 uppercase">Límite RUS</p>
                  <p className="text-2xl font-bold mt-1 text-amber-600">
                    S/ {limiteIngresos.limite_rus.toLocaleString('es-PE')}
                  </p>
                  {limiteIngresos.excede_rus && (
                    <p className="text-xs text-red-500 mt-1">⚠️ Excede el límite RUS</p>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-500 uppercase">Límite Régimen General</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">
                    S/ {limiteIngresos.limite_general.toLocaleString('es-PE')}
                  </p>
                  {limiteIngresos.excede_general && (
                    <p className="text-xs text-red-500 mt-1">⚠️ Excede el límite</p>
                  )}
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Uso del Límite Tributario</h3>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      limiteIngresos.porcentaje_usado > 80 ? 'bg-red-500' :
                      limiteIngresos.porcentaje_usado > 50 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(limiteIngresos.porcentaje_usado, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>0%</span>
                  <span className="font-semibold">{limiteIngresos.porcentaje_usado.toFixed(1)}% usado</span>
                  <span>100%</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB: Config */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Configuración SUNAT / Nubefact</h3>
          <div className="space-y-4">
            {configSunat ? (
              Object.entries(configSunat).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600 font-medium">{key.replace(/_/g, ' ').toUpperCase()}</span>
                  <span className={`text-sm font-semibold ${val === 'Configurado' ? 'text-green-600' : 'text-gray-400'}`}>
                    {typeof val === 'string' ? val : JSON.stringify(val)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">Cargando configuración...</p>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-6">Configura NUBEFACT_TOKEN, ULTRAMSG_INSTANCE_ID y ULTRAMSG_TOKEN en tu archivo .env.local</p>
        </div>
      )}
    </div>
  );
}
