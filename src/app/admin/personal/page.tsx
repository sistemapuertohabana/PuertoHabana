'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Plus, X, Loader2, Edit2, Trash2, Clock, CheckCircle, AlertCircle, QrCode, Camera, Download } from 'lucide-react';
import CarnetPDF from '@/components/CarnetPDF';
import QRScanner from '@/components/QRScanner';
import Modal from '@/components/Modal';
import { addToSyncQueue } from '@/components/ServiceWorkerRegister';

type Rol = 'admin' | 'mozo' | 'cocina' | 'ayudante_cocina' | 'lavaplato' | 'dev';
type SalarioTipo = 'diario' | 'semanal' | 'mensual';

interface Personal {
  id: string;
  nombre: string;
  dni?: string;
  email?: string;
  rol: Rol;
  turno?: string;
  telefono?: string;
  area?: string;
  salario_monto?: number;
  salario_tipo?: SalarioTipo;
}

const rolLabels: Record<string, string> = {
  admin:           'Administrador',
  mozo:            'Mozo',
  cocina:          'Cocinero',
  ayudante_cocina: 'Ayudante de Cocina',
  lavaplato:       'Lavaplatos',
  dev:             'Desarrollador',
};

const rolColors: Record<string, string> = {
  admin:           'bg-purple-100 text-purple-700',
  mozo:            'bg-blue-100 text-blue-700',
  cocina:          'bg-orange-100 text-orange-700',
  ayudante_cocina: 'bg-yellow-100 text-yellow-700',
  lavaplato:       'bg-gray-100 text-gray-700',
  dev:             'bg-indigo-100 text-indigo-700',
};

const emptyForm = {
  nombre: '', dni: '', email: '',
  rol: 'mozo' as Rol,
  turno: '',
  telefono: '',
  area: '',
  salario_monto: '',
  salario_tipo: 'mensual' as SalarioTipo,
};

export default function PersonalPage() {
  const [personal,    setPersonal]    = useState<Personal[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [isSubmitting,setIsSubmitting]= useState(false);
  const [error,       setError]       = useState('');
  const [formData,    setFormData]    = useState(emptyForm);
  const [asistencias, setAsistencias] = useState<Record<string, { hora_llegada: string }>>({});
  const [loadingAsist,setLoadingAsist]= useState(true);
  const [carnetAbierto, setCarnetAbierto] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  /* ── Cargar personal desde API (MySQL) con fallback a localStorage ── */
  const loadPersonal = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/personal');
      if (res.ok) {
        const data = await res.json();
        setPersonal(data);
        // Sincronizar localStorage para que los logins de mozo/cocina funcionen
        localStorage.setItem('ph_personal', JSON.stringify(data));
      } else {
        throw new Error('API error');
      }
    } catch {
      // Fallback a localStorage si la DB no está disponible
      try {
        const data = JSON.parse(localStorage.getItem('ph_personal') || '[]');
        setPersonal(data);
      } catch { setPersonal([]); }
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadPersonal(); }, [loadPersonal]);

  /* ── Cargar asistencias de hoy ── */
  useEffect(() => {
    const cargarAsistencias = async () => {
      setLoadingAsist(true);
      try {
        const hoy = new Date();
        const fechaStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
        const res = await fetch(`/api/asistencia?fecha=${fechaStr}`);
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, { hora_llegada: string }> = {};
          data.forEach((a: any) => {
            map[a.usuario_id] = { hora_llegada: a.hora_llegada };
          });
          setAsistencias(map);
        }
      } catch {}
      setLoadingAsist(false);
    };
    cargarAsistencias();
  }, []);

  const resetForm = () => { setFormData(emptyForm); setEditingId(null); setError(''); };

  const handleOpenAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (p: Personal) => {
    setFormData({
      nombre:        p.nombre,
      dni:           p.dni ?? '',
      email:         p.email ?? '',
      rol:           p.rol,
      turno:         p.turno ?? '',
      telefono:      p.telefono ?? '',
      area:          p.area ?? '',
      salario_monto: p.salario_monto?.toString() ?? '',
      salario_tipo:  p.salario_tipo ?? 'mensual',
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleClose = () => { setShowForm(false); resetForm(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) { setError('El nombre es requerido'); return; }
    setError('');
    setIsSubmitting(true);

    const hoy = new Date().toISOString().split('T')[0];
    const payload: Record<string, any> = {
      nombre:        formData.nombre.trim(),
      dni:           formData.dni.trim() || undefined,
      email:         formData.email.trim() || undefined,
      rol:           formData.rol,
      turno:         formData.turno || undefined,
      telefono:      formData.telefono.trim() || undefined,
      area:          formData.area.trim() || undefined,
      salario_monto: formData.rol === 'dev' ? undefined : (formData.salario_monto ? parseFloat(formData.salario_monto) : undefined),
      salario_tipo:  formData.rol === 'dev' ? undefined : formData.salario_tipo,
      // Auto-asignar fecha de ingreso al crear
      fecha_ingreso: editingId ? undefined : hoy,
    };

    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/personal/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/personal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        if (res.status >= 500 || err.error?.includes('ECONNREFUSED')) {
          throw new Error('Fallback to localstorage');
        }
        setError(err.error || 'Error al guardar');
        setIsSubmitting(false);
        return;
      }

      await loadPersonal();
      handleClose();
    } catch {
      // Encolar para sincronización
      if (editingId) {
        addToSyncQueue('PUT', `/api/personal/${editingId}`, payload);
      } else {
        addToSyncQueue('POST', '/api/personal', payload);
      }
      // Fallback localStorage
      const id = editingId ?? String(Date.now());
      const current: Personal[] = JSON.parse(localStorage.getItem('ph_personal') || '[]');
      const updated = editingId
        ? current.map(p => p.id === editingId ? { ...p, ...payload, id } : p)
        : [...current, { ...payload, id } as Personal];
      localStorage.setItem('ph_personal', JSON.stringify(updated));
      setPersonal(updated);
      handleClose();
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar a ${nombre}?`)) return;
    try {
      const res = await fetch(`/api/personal/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadPersonal();
      } else {
        throw new Error();
      }
    } catch {
      // Encolar para sincronización
      addToSyncQueue('DELETE', `/api/personal/${id}`);
      // Fallback localStorage
      const current: Personal[] = JSON.parse(localStorage.getItem('ph_personal') || '[]');
      const updated = current.filter(p => p.id !== id);
      localStorage.setItem('ph_personal', JSON.stringify(updated));
      setPersonal(updated);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium text-gray-900">Personal</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona el equipo de Puerto Habana.</p>
        </div>
        <div className="flex gap-2">
          {!showForm && (
            <>
              <button onClick={() => setShowScanner(true)}
                className="bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm">
                <Camera size={16} /> QR
              </button>
              <button onClick={handleOpenAdd}
                className="bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 w-full md:w-auto">
                <Plus size={18} /> Agregar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal escáner QR */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowScanner(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 mx-4 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <QRScanner onClose={() => setShowScanner(false)} />
          </div>
        </div>
      )}

      {/* Modal Carnet */}
      {carnetAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setCarnetAbierto(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 mx-4 max-w-xs w-full" onClick={e => e.stopPropagation()}>
            {(() => {
              const emp = personal.find(p => p.id === carnetAbierto);
              return emp ? <CarnetPDF empleado={emp} onClose={() => setCarnetAbierto(null)} /> : null;
            })()}
          </div>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{editingId ? 'Editar Personal' : 'Nuevo Personal'}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {editingId ? 'Modifica los datos' : 'El Gmail registrado será la clave de acceso del empleado'}
              </p>
            </div>
            <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
              <input type="text" value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                required placeholder="Ej. María García"
                className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">DNI</label>
              <input type="text" value={formData.dni}
                onChange={e => { const v = e.target.value.replace(/\D/g,''); if (v.length <= 8) setFormData({ ...formData, dni: v }); }}
                placeholder="12345678" maxLength={8} inputMode="numeric"
                className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gmail (clave de acceso)</label>
              <input type="email" value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="empleado@gmail.com"
                className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              <p className="text-xs text-gray-400 mt-1">El empleado usará este Gmail para ingresar al sistema.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rol</label>
              <select value={formData.rol}
                onChange={e => setFormData({ ...formData, rol: e.target.value as Rol })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900">
                <option value="mozo">Mozo</option>
                <option value="cocina">Cocinero</option>
                <option value="ayudante_cocina">Ayudante de Cocina</option>
                <option value="lavaplato">Lavaplatos</option>
                <option value="dev">Desarrollador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
              <input type="text" value={formData.telefono}
                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+51 999 888 777"
                className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              <p className="text-xs text-gray-400 mt-1">Número de contacto del empleado.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Área / Especialidad</label>
              <input type="text" value={formData.area}
                onChange={e => setFormData({ ...formData, area: e.target.value })}
                placeholder="Ej. Cocina, Salón Principal, Lavado..."
                className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              <p className="text-xs text-gray-400 mt-1">Área asignada o especialidad del empleado.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Turno</label>
              <select value={formData.turno}
                onChange={e => setFormData({ ...formData, turno: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900">
                <option value="">Sin turno</option>
                <option value="mañana">Mañana</option>
                <option value="noche">Noche</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">El turno determinará el horario en que puede hacer pedidos.</p>
            </div>
            {formData.rol === 'dev' ? (
              <div className="md:col-span-2">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <p className="text-sm font-semibold text-indigo-700">Contrato independiente</p>
                  <p className="text-xs text-indigo-500 mt-0.5">El desarrollador no tiene salario base. Es contratado por el administrador y se le paga por acuerdo independiente.</p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Salario (S/)</label>
                  <input type="number" step="0.01" min="0" value={formData.salario_monto}
                    onChange={e => setFormData({ ...formData, salario_monto: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Salario</label>
                  <select value={formData.salario_tipo}
                    onChange={e => setFormData({ ...formData, salario_tipo: e.target.value as SalarioTipo })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900">
                    <option value="diario">Diario</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>
              </>
            )}

            {error && (
              <div className="md:col-span-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={handleClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70 min-w-[130px] justify-center">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (editingId ? 'Guardar Cambios' : 'Agregar')}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-gray-300" />
        </div>
      )}

      {!loading && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Nombre', 'DNI', 'Gmail', 'Rol', 'Salario', 'Acciones'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {personal.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <User size={16} />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{p.nombre}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{p.dni || '—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{p.email || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${rolColors[p.rol] ?? 'bg-gray-100 text-gray-700'}`}>
                        {rolLabels[p.rol] ?? p.rol}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {p.rol === 'dev' ? (
                        <span className="text-xs font-semibold text-indigo-600">Contrato</span>
                      ) : p.salario_monto ? (
                        `S/ ${Number(p.salario_monto).toFixed(2)} (${p.salario_tipo})`
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenEdit(p)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(p.id, p.nombre)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {personal.map(p => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.nombre}</p>
                      {p.email && <p className="text-xs text-gray-400">{p.email}</p>}
                      {p.dni && <p className="text-xs text-gray-400">DNI: {p.dni}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenEdit(p)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleDelete(p.id, p.nombre)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>                  <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${rolColors[p.rol] ?? 'bg-gray-100 text-gray-700'}`}>
                    {rolLabels[p.rol] ?? p.rol}
                  </span>
                  {p.rol === 'dev' ? (
                    <span className="text-xs font-semibold text-indigo-600">Contrato</span>
                  ) : p.salario_monto && (
                    <span className="text-xs font-semibold text-emerald-600">
                      S/ {Number(p.salario_monto).toFixed(2)} <span className="font-normal text-gray-400">({p.salario_tipo})</span>
                    </span>
                  )}
                </div>
                {(p.telefono || p.area) && (
                  <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100">
                    {p.telefono && <span className="text-[11px] text-gray-500">📞 {p.telefono}</span>}
                    {p.area && <span className="text-[11px] text-gray-500">📍 {p.area}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {personal.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
              <User size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-gray-600">No hay personal registrado</p>
              <p className="text-sm text-gray-400 mt-1">Agrega al primer integrante del equipo.</p>
            </div>
          )}

          {/* ── Asistencias del día ── */}            {/* ── Carnet PDF por empleado ── */}
            <div className="mt-10 mb-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <QrCode size={18} className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Carnet del Personal</h2>
                  <p className="text-xs text-gray-400">Descarga el carnet con QR para cada empleado</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Empleado', 'Rol', 'Carnet QR', 'DNI/Email'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {personal.filter(p => p.rol !== 'admin').map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                              <User size={16} />
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{p.nombre}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${rolColors[p.rol] ?? 'bg-gray-100 text-gray-700'}`}>
                            {rolLabels[p.rol] ?? p.rol}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setCarnetAbierto(p.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <Download size={13} />
                            PDF
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs text-gray-500">{p.dni || p.email || '—'}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Asistencias del día ── */}
            <div className="mt-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                <Clock size={18} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Asistencia del Día</h2>
                <p className="text-xs text-gray-400">
                  {Object.keys(asistencias).length} de {personal.length} registrados
                  {Object.keys(asistencias).length === personal.length && personal.length > 0 && ' 🎉'}
                </p>
              </div>
            </div>

            {loadingAsist ? (
              <div className="flex justify-center py-10">
                <Loader2 size={24} className="animate-spin text-gray-300" />
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Personal', 'Rol', 'Estado', 'Hora de Llegada'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {personal.map(p => {
                      const asis = asistencias[p.id];
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                                <User size={16} />
                              </div>
                              <p className="text-sm font-semibold text-gray-900">{p.nombre}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${rolColors[p.rol] ?? 'bg-gray-100 text-gray-700'}`}>
                              {rolLabels[p.rol] ?? p.rol}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {asis ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                                <CheckCircle size={14} />
                                Presente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                                <AlertCircle size={14} />
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {asis ? (
                              <span className="text-sm font-medium text-gray-900">{asis.hora_llegada.slice(0, 5)} hrs</span>
                            ) : (
                              <span className="text-sm text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
