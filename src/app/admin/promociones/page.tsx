'use client';

import { useState, useEffect } from 'react';
import {
  Megaphone, Plus, Search, X, Edit, Trash2, Send,
  Calendar, Clock, CheckCircle2, AlertCircle, Image,
} from 'lucide-react';

interface Promocion {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  descuento_porcentaje?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  activa: boolean;
  imagen_url?: string;
  created_at: string;
}

interface EnvioWhatsApp {
  id: number;
  promocion_id?: number;
  tipo: string;
  mensaje: string;
  total_destinatarios: number;
  enviados: number;
  fallidos: number;
  estado: string;
  enviado_en?: string;
  created_at: string;
}

const tiposPromo = [
  { value: 'general', label: 'General' },
  { value: 'descuento', label: 'Descuento' },
  { value: 'combo', label: 'Combo' },
  { value: '2x1', label: '2x1' },
  { value: 'otro', label: 'Otro' },
];

const emptyForm = {
  titulo: '', descripcion: '', tipo: 'general',
  descuento_porcentaje: '', fecha_inicio: '', fecha_fin: '', imagen_url: '', activa: true,
};

export default function PromocionesPage() {
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [historialEnvios, setHistorialEnvios] = useState<EnvioWhatsApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<'promociones' | 'envios'>('promociones');
  const [enviando, setEnviando] = useState<number | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resPromos, resEnvios] = await Promise.all([
        fetch('/api/promociones'),
        fetch('/api/promociones?tipo=envios').catch(() => null),
      ]);
      if (resPromos.ok) setPromociones(await resPromos.json());
      if (resEnvios?.ok) {
        const data = await resEnvios.json();
        setHistorialEnvios(data.envios || []);
      }
    } catch {} finally { setLoading(false); }
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (p: Promocion) => {
    setForm({
      titulo: p.titulo,
      descripcion: p.descripcion,
      tipo: p.tipo,
      descuento_porcentaje: p.descuento_porcentaje?.toString() || '',
      fecha_inicio: p.fecha_inicio?.split('T')[0] || '',
      fecha_fin: p.fecha_fin?.split('T')[0] || '',
      imagen_url: p.imagen_url || '',
      activa: p.activa,
    });
    setEditingId(p.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.titulo || !form.descripcion) return alert('Título y descripción requeridos');

    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/promociones?id=${editingId}` : '/api/promociones';
      const body = {
        ...form,
        descuento_porcentaje: form.descuento_porcentaje ? parseFloat(form.descuento_porcentaje) : null,
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.fecha_fin || null,
      };

      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) return alert('Error al guardar');
      setToast(editingId ? '✅ Promoción actualizada' : '✅ Promoción creada');
      setShowModal(false);
      loadData();
    } catch { alert('Error de conexión'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    try {
      await fetch(`/api/promociones?id=${id}`, { method: 'DELETE' });
      setToast('🗑️ Promoción eliminada');
      loadData();
    } catch {}
  };

  const handleToggleActiva = async (p: Promocion) => {
    try {
      await fetch(`/api/promociones?id=${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !p.activa }),
      });
      loadData();
    } catch {}
  };

  const handleEnviarWhatsApp = async (promocion: Promocion) => {
    if (!confirm(`¿Enviar "${promocion.titulo}" a todos los clientes por WhatsApp?`)) return;
    setEnviando(promocion.id);

    const mensaje = `🎉 *${promocion.titulo}* 🎉\n\n${promocion.descripcion}${promocion.descuento_porcentaje ? `\n\n🔥 *${promocion.descuento_porcentaje}% de descuento*` : ''}\n\n📍 *Puerto Habana Cevichería*\n¡Te esperamos! 🍽️`;

    try {
      const res = await fetch('/api/whatsapp/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'promocion', promocion_id: promocion.id, mensaje }),
      });
      const data = await res.json();
      setToast(`✅ Enviado a ${data.enviados || 0} clientes${data.fallidos > 0 ? ` (${data.fallidos} fallidos)` : ''}`);
      loadData();
    } catch {
      setToast('❌ Error al enviar');
    } finally { setEnviando(null); }
  };

  useEffect(() => { if (toast) setTimeout(() => setToast(null), 3000); }, [toast]);

  const filtered = promociones.filter(p =>
    p.titulo.toLowerCase().includes(search.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  return (
    <div className="animate-in fade-in duration-300">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-pink-100 flex items-center justify-center shrink-0">
            <Megaphone size={20} className="text-pink-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Promociones</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Crea y envía promociones a tus clientes</p>
          </div>
        </div>
        <button onClick={openNew}
          className="shrink-0 px-4 sm:px-5 py-2.5 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-colors text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
          <Plus size={16} /> <span className="hidden sm:inline">Nueva Promoción</span><span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-2">
        <button onClick={() => setTab('promociones')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            tab === 'promociones' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-500'
          }`}>
          Promociones ({promociones.length})
        </button>
        <button onClick={() => setTab('envios')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            tab === 'envios' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-500'
          }`}>
          Historial de Envíos ({historialEnvios.length})
        </button>
      </div>

      {tab === 'promociones' && (
        <>
          <div className="relative max-w-md mb-6">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar promociones..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-pink-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 text-center py-12"><div className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : filtered.length === 0 ? (
              <div className="col-span-2 bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Megaphone size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-semibold">{search ? 'Sin resultados' : 'No hay promociones'}</p>
              </div>
            ) : (
              filtered.map(p => (
                <div key={p.id} className={`bg-white rounded-xl border p-5 transition-shadow hover:shadow-sm ${p.activa ? 'border-gray-200' : 'border-gray-100 opacity-70'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      p.tipo === 'descuento' ? 'bg-red-100 text-red-600' :
                      p.tipo === '2x1' ? 'bg-green-100 text-green-600' :
                      p.tipo === 'combo' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>{p.tipo}</span>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit size={13} className="text-gray-400" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={13} className="text-red-400" /></button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">{p.titulo}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{p.descripcion}</p>

                  {p.descuento_porcentaje && (
                    <div className="mb-3">
                      <span className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        -{p.descuento_porcentaje}%
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                    {p.fecha_inicio && <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(p.fecha_inicio)}</span>}
                    {p.fecha_fin && <span className="flex items-center gap-1"><Calendar size={12} /> → {formatDate(p.fecha_fin)}</span>}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleToggleActiva(p)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        p.activa ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {p.activa ? '🟢 Activa' : '⭕ Inactiva'}
                    </button>
                    <button onClick={() => handleEnviarWhatsApp(p)} disabled={enviando === p.id}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                      {enviando === p.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={13} />}
                      Enviar WhatsApp
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {tab === 'envios' && (
        <div className="space-y-3">
          {historialEnvios.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Send size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-semibold">Sin envíos realizados</p>
              <p className="text-gray-400 text-sm mt-1">Las promociones enviadas por WhatsApp aparecerán aquí</p>
            </div>
          ) : (
            historialEnvios.map(e => (
              <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Envío #{e.id}</span>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 line-clamp-2">{e.mensaje}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    e.estado === 'completado' ? 'bg-green-100 text-green-700' :
                    e.estado === 'parcial' ? 'bg-amber-100 text-amber-700' :
                    e.estado === 'fallido' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{e.estado}</span>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>📤 {e.enviados} enviados</span>
                  <span>❌ {e.fallidos} fallidos</span>
                  <span>👥 {e.total_destinatarios} destinatarios</span>
                  {e.enviado_en && <span>📅 {formatDate(e.enviado_en)}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Editar Promoción' : 'Nueva Promoción'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full"><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Título *</label>
                <input type="text" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})}
                  className="w-full mt-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Ej: 2x1 en Ceviche" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Descripción *</label>
                <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} rows={3}
                  className="w-full mt-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                  placeholder="Describe la promoción..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}
                    className="w-full mt-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400">
                    {tiposPromo.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">Descuento %</label>
                  <input type="number" value={form.descuento_porcentaje} onChange={e => setForm({...form, descuento_porcentaje: e.target.value})}
                    className="w-full mt-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="20" min={0} max={100} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">Fecha Inicio</label>
                  <input type="date" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})}
                    className="w-full mt-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">Fecha Fin</label>
                  <input type="date" value={form.fecha_fin} onChange={e => setForm({...form, fecha_fin: e.target.value})}
                    className="w-full mt-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.activa} onChange={e => setForm({...form, activa: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                  <span className="text-sm font-medium text-gray-700">Activa</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
              <button onClick={handleSave}
                className="flex-1 py-3 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 transition-colors shadow-md">
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
