'use client';

import { useState, useEffect } from 'react';
import {
  Users, Plus, Search, X, Phone, Mail, MapPin, User,
  FileText, Download, Trash2, Edit, CheckCircle2, Scan,
} from 'lucide-react';

interface Cliente {
  id: number;
  nombre: string;
  dni?: string;
  ruc?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
  created_at: string;
}

const emptyForm = { nombre: '', dni: '', ruc: '', telefono: '', email: '', direccion: '', notas: '' };

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState<string | null>(null);
  const [exportMenu, setExportMenu] = useState(false);

  useEffect(() => { loadClientes(); }, []);

  const loadClientes = async (q?: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/clientes?search=${encodeURIComponent(q)}` : '/api/clientes';
      const res = await fetch(url);
      if (res.ok) setClientes(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    if (val.length >= 2 || val.length === 0) loadClientes(val);
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (c: Cliente) => {
    setForm({
      nombre: c.nombre,
      dni: c.dni || '',
      ruc: c.ruc || '',
      telefono: c.telefono || '',
      email: c.email || '',
      direccion: c.direccion || '',
      notas: c.notas || '',
    });
    setEditingId(c.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre) return alert('El nombre es requerido');

    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/clientes?id=${editingId}` : '/api/clientes';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        return alert(err.error || 'Error al guardar');
      }

      setToast(editingId ? '✅ Cliente actualizado' : '✅ Cliente registrado');
      setShowModal(false);
      loadClientes(search);
    } catch {
      alert('Error de conexión');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await fetch(`/api/clientes?id=${id}`, { method: 'DELETE' });
      setToast('🗑️ Cliente eliminado');
      loadClientes(search);
    } catch {}
  };

  const exportCSV = () => {
    const headers = 'Nombre,DNI,RUC,Teléfono,Email,Dirección';
    const rows = clientes.map(c =>
      `"${c.nombre}","${c.dni || ''}","${c.ruc || ''}","${c.telefono || ''}","${c.email || ''}","${c.direccion || ''}"`
    );
    const csv = '\ufeff' + headers + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clientes_puerto_habana.csv`;
    link.click();
    setExportMenu(false);
    setToast('📥 CSV exportado');
  };

  useEffect(() => { if (toast) setTimeout(() => setToast(null), 3000); }, [toast]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="animate-in fade-in duration-300">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
            <Users size={20} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Clientes</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{clientes.length} registrados</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="relative">
            <button onClick={() => setExportMenu(!exportMenu)}
              className="px-3 sm:px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
              <Download size={15} /> <span className="hidden sm:inline">Exportar</span>
            </button>
            {exportMenu && (
              <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-48 z-10">
                <button onClick={exportCSV} className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 flex items-center gap-2">
                  <FileText size={14} /> Exportar CSV
                </button>
              </div>
            )}
          </div>
          <button onClick={openNew}
            className="px-4 sm:px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap">
            <Plus size={16} /> <span className="hidden sm:inline">Nuevo Cliente</span><span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar por nombre, DNI o teléfono..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : clientes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-semibold">{search ? 'Sin resultados' : 'No hay clientes registrados'}</p>
            <p className="text-gray-400 text-sm mt-1">Registra tu primer cliente o busca por nombre/DNI</p>
          </div>
        ) : (
          clientes.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{c.nombre}</h3>
                    {c.dni && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-mono">{c.dni}</span>}
                    {c.ruc && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-mono">{c.ruc}</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                    {c.telefono && <span className="flex items-center gap-1"><Phone size={12} /> {c.telefono}</span>}
                    {c.email && <span className="flex items-center gap-1"><Mail size={12} /> {c.email}</span>}
                    {c.direccion && <span className="flex items-center gap-1"><MapPin size={12} /> {c.direccion}</span>}
                    <span className="text-gray-400">📅 {formatDate(c.created_at)}</span>
                  </div>
                  {c.notas && <p className="text-xs text-gray-400 mt-1 italic">{c.notas}</p>}
                </div>
                <div className="flex gap-1 ml-3">
                  <button onClick={() => openEdit(c)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit size={14} className="text-gray-400" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Nombre *</label>
                <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                  className="w-full mt-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Nombre completo" />
              </div>
              {/* DNI — vertical */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">DNI</label>
                <div className="flex gap-2 mt-1">
                  <input type="text" value={form.dni} onChange={e => setForm({...form, dni: e.target.value})} maxLength={8}
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="12345678" />
                  <button
                    onClick={async () => {
                      const dniClean = form.dni.trim();
                      if (!dniClean || dniClean.length < 8) return setToast('⚠️ Ingresa 8 dígitos del DNI');
                      try {
                        const res = await fetch(`/api/clientes?dni=${encodeURIComponent(dniClean)}`);
                        if (!res.ok) return setToast('⚠️ Error al buscar DNI');
                        const data = await res.json();
                        if (data && data.length > 0) {
                          const c = data[0];
                          setForm({
                            nombre: c.nombre || form.nombre,
                            dni: c.dni || '',
                            ruc: c.ruc || '',
                            telefono: c.telefono || '',
                            email: c.email || '',
                            direccion: c.direccion || '',
                            notas: c.notas || '',
                          });
                          setEditingId(c.id);
                          setToast('✅ Cliente encontrado: ' + c.nombre);
                        } else {
                          setToast('⚠️ No hay cliente registrado con ese DNI');
                        }
                      } catch { setToast('⚠️ Error de conexión al buscar DNI'); }
                    }}
                    className="px-3 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-xs font-semibold flex items-center gap-1"
                    title="Buscar por DNI"
                  >
                    <Scan size={14} />
                  </button>
                </div>
              </div>
              {/* RUC — vertical */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">RUC</label>
                <div className="flex gap-2 mt-1">
                  <input type="text" value={form.ruc} onChange={e => setForm({...form, ruc: e.target.value})} maxLength={11}
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="20123456789" />
                  <button
                    onClick={async () => {
                      const rucClean = form.ruc.trim();
                      if (!rucClean || rucClean.length < 11) return setToast('⚠️ Ingresa 11 dígitos del RUC');
                      try {
                        const res = await fetch(`/api/clientes?ruc=${encodeURIComponent(rucClean)}`);
                        if (!res.ok) return setToast('⚠️ Error al buscar RUC');
                        const data = await res.json();
                        if (data && data.length > 0) {
                          const c = data[0];
                          setForm({
                            nombre: c.nombre || form.nombre,
                            dni: c.dni || '',
                            ruc: c.ruc || '',
                            telefono: c.telefono || '',
                            email: c.email || '',
                            direccion: c.direccion || '',
                            notas: c.notas || '',
                          });
                          setEditingId(c.id);
                          setToast('✅ Cliente encontrado: ' + c.nombre);
                        } else {
                          setToast('⚠️ No hay cliente registrado con ese RUC');
                        }
                      } catch { setToast('⚠️ Error de conexión al buscar RUC'); }
                    }}
                    className="px-3 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-xs font-semibold flex items-center gap-1"
                    title="Buscar por RUC"
                  >
                    <Scan size={14} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Teléfono / WhatsApp</label>
                <input type="tel" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                  className="w-full mt-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="987 654 321" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full mt-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="cliente@email.com" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Dirección</label>
                <input type="text" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})}
                  className="w-full mt-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Av. Principal 123" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Notas</label>
                <textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} rows={3}
                  className="w-full mt-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  placeholder="Información adicional..." />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md">
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
