'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Clock, Users, CalendarDays, Phone, User, Check, Trash2, Edit2, Loader2 } from 'lucide-react';

interface Reserva {
  id: number;
  cliente: string;
  telefono?: string;
  fecha: string;
  hora: string;
  personas: number;
  mesa_id?: number;
  notas?: string;
  estado: string;
}

const mesasDisponibles = [
  'Mesa 1','Mesa 2','Mesa 3','Mesa 4','Mesa 5',
  'Mesa 6','Mesa 7','Mesa 8','Mesa 1 + Mesa 2','Mesa 3 + Mesa 4',
];

const emptyForm = { cliente: '', telefono: '', fecha: '', hora: '', personas: 2, mesa: '', notas: '' };

const estadoStyle: Record<string, string> = {
  confirmada: 'bg-green-100 text-green-700',
  cancelada:  'bg-red-100 text-red-700',
  completada: 'bg-gray-100 text-gray-600',
  pendiente:  'bg-amber-100 text-amber-700',
};

export default function MozoReservasPage() {
  const [reservas,   setReservas]   = useState<Reserva[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [isSaving,   setIsSaving]   = useState(false);
  const [form,       setForm]       = useState(emptyForm);

  const loadReservas = useCallback(async () => {
    try {
      const res = await fetch('/api/reservas');
      if (!res.ok) throw new Error();
      setReservas(await res.json());
    } catch {
      setReservas([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadReservas(); }, [loadReservas]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (r: Reserva) => {
    setEditingId(r.id);
    setForm({
      cliente: r.cliente, telefono: r.telefono || '',
      fecha: r.fecha, hora: r.hora,
      personas: r.personas, mesa: String(r.mesa_id || ''), notas: r.notas || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.cliente || !form.fecha || !form.hora) return alert('Completa los campos obligatorios.');
    setIsSaving(true);
    try {
      if (editingId !== null) {
        // No hay PUT en la API aún — actualizar estado localmente
        setReservas(prev => prev.map(r => r.id === editingId ? { ...r, ...form, hora: form.hora } : r));
      } else {
        const res = await fetch('/api/reservas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cliente: form.cliente, telefono: form.telefono, fecha: form.fecha, hora: form.hora, personas: form.personas, notas: form.notas }),
        });
        if (res.ok) await loadReservas();
      }
    } catch {
      // Fallback: agregar localmente
      setReservas(prev => [...prev, { id: Date.now(), ...form, estado: 'pendiente' } as any]);
    }
    setIsSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta reserva?')) return;
    try {
      await fetch(`/api/reservas?id=${id}`, { method: 'DELETE' });
      await loadReservas();
    } catch {
      setReservas(prev => prev.filter(r => r.id !== id));
    }
  };

  const cambiarEstado = (id: number, estado: string) => {
    setReservas(prev => prev.map(r => r.id === id ? { ...r, estado } : r));
  };

  return (
    <div className="animate-in fade-in duration-300 pb-24 lg:pb-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-medium text-gray-900">Reservas</h1>
          <p className="text-sm text-gray-500 mt-1">{reservas.length} reserva{reservas.length !== 1 ? 's' : ''} registrada{reservas.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Nueva Reserva
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gray-300" /></div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
          <CalendarDays size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No hay reservas registradas</p>
          <p className="text-sm mt-1">Crea la primera reserva con el botón de arriba</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reservas.map(r => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2 text-gray-900">
                    <User size={16} className="text-gray-400" /> {r.cliente}
                  </h3>
                  {r.telefono && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone size={13} /> {r.telefono}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${estadoStyle[r.estado] ?? estadoStyle.pendiente}`}>
                  {r.estado}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1.5"><CalendarDays size={13} /> {r.fecha}</span>
                <span className="flex items-center gap-1.5"><Clock size={13} /> {r.hora}</span>
                <span className="flex items-center gap-1.5"><Users size={13} /> {r.personas} personas</span>
              </div>

              {r.notas && <p className="text-xs text-gray-400 italic mb-3 bg-gray-50 px-3 py-2 rounded-lg">{r.notas}</p>}

              <div className="flex flex-wrap gap-2">
                {r.estado !== 'confirmada' && (
                  <button onClick={() => cambiarEstado(r.id, 'confirmada')}
                    className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 hover:bg-green-100 transition-colors">
                    <Check size={12} /> Confirmar
                  </button>
                )}
                {r.estado !== 'cancelada' && (
                  <button onClick={() => cambiarEstado(r.id, 'cancelada')}
                    className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-100 transition-colors">
                    Cancelar
                  </button>
                )}
                <button onClick={() => openEdit(r)} className="text-xs text-gray-500 px-2 py-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(r.id)} className="text-xs text-red-400 px-2 py-1.5 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-lg text-gray-900">{editingId ? 'Editar' : 'Nueva'} Reserva</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <input placeholder="Cliente *" value={form.cliente}
                onChange={e => setForm({ ...form, cliente: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
              <input placeholder="Teléfono" value={form.telefono}
                onChange={e => setForm({ ...form, telefono: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fecha *</label>
                  <input type="date" value={form.fecha}
                    onChange={e => setForm({ ...form, fecha: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hora *</label>
                  <input type="time" value={form.hora}
                    onChange={e => setForm({ ...form, hora: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Personas</label>
                  <input type="number" min={1} value={form.personas}
                    onChange={e => setForm({ ...form, personas: parseInt(e.target.value) || 1 })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Mesa</label>
                  <select value={form.mesa} onChange={e => setForm({ ...form, mesa: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white">
                    <option value="">Seleccionar</option>
                    {mesasDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <textarea placeholder="Notas (opcional)" value={form.notas}
                onChange={e => setForm({ ...form, notas: e.target.value })}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none" />
            </div>
            <button onClick={handleSave} disabled={isSaving}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Reserva'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
