'use client';

import { useState } from 'react';
import { Plus, X, Clock, Users, CalendarDays, Phone, User, Check, Trash2, Edit2 } from 'lucide-react';

interface Reserva {
  id: number;
  cliente: string;
  telefono: string;
  fecha: string;
  hora: string;
  personas: number;
  mesa: string;
  notas: string;
  estado: string;
}

const mesasDisponibles = [
  'Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5',
  'Mesa 6', 'Mesa 7', 'Mesa 8', 'Mesa 1 + Mesa 2', 'Mesa 3 + Mesa 4',
];

export default function MozoReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    cliente: '', telefono: '', fecha: '', hora: '',
    personas: 2, mesa: '', notas: '',
  });

  const openNew = () => {
    setEditingId(null);
    setForm({ cliente: '', telefono: '', fecha: '', hora: '', personas: 2, mesa: '', notas: '' });
    setShowModal(true);
  };

  const openEdit = (r: Reserva) => {
    setEditingId(r.id);
    setForm({ cliente: r.cliente, telefono: r.telefono, fecha: r.fecha, hora: r.hora, personas: r.personas, mesa: r.mesa, notas: r.notas });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.cliente || !form.fecha || !form.hora || !form.mesa) return alert('Completa los campos obligatorios.');
    if (editingId !== null) {
      setReservas(reservas.map(r => r.id === editingId ? { ...r, ...form } : r));
    } else {
      setReservas([...reservas, { id: Date.now(), ...form, estado: 'pendiente' }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar esta reserva?')) setReservas(reservas.filter(r => r.id !== id));
  };

  const getEstadoStyle = (estado: string) => {
    if (estado === 'confirmada') return 'bg-green-100 text-green-700';
    if (estado === 'cancelada') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  return (
    <div className="animate-in fade-in duration-300 pb-20 lg:pb-0">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium text-gray-900">Reservas</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
          <Plus size={18} /> Nueva Reserva
        </button>
      </div>

      {reservas.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
          <CalendarDays size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No hay reservas registradas</p>
        </div>
      )}

      <div className="grid gap-4">
        {reservas.map((r) => (
          <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2"><User size={18} /> {r.cliente}</h3>
                {r.telefono && <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Phone size={14} /> {r.telefono}</p>}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${getEstadoStyle(r.estado)}`}>{r.estado}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
              <span className="flex items-center gap-1"><CalendarDays size={14} /> {r.fecha}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {r.hora}</span>
              <span className="flex items-center gap-1"><Users size={14} /> {r.personas} personas</span>
              <span className="font-medium">{r.mesa}</span>
            </div>
            {r.notas && <p className="text-xs text-gray-500 mt-2">{r.notas}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setReservas(reservas.map(x => x.id === r.id ? { ...x, estado: 'confirmada' } : x))} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-bold"><Check size={12} className="inline" /> Confirmar</button>
              <button onClick={() => setReservas(reservas.map(x => x.id === r.id ? { ...x, estado: 'cancelada' } : x))} className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-bold">Cancelar</button>
              <button onClick={() => openEdit(r)} className="text-xs text-gray-500 px-2"><Edit2 size={14} /></button>
              <button onClick={() => handleDelete(r.id)} className="text-xs text-red-500 px-2"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-lg">{editingId ? 'Editar' : 'Nueva'} Reserva</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Cliente *" value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input type="number" min={1} placeholder="Personas" value={form.personas} onChange={(e) => setForm({ ...form, personas: parseInt(e.target.value) || 1 })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <select value={form.mesa} onChange={(e) => setForm({ ...form, mesa: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Mesa *</option>
                {mesasDisponibles.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <textarea placeholder="Notas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <button onClick={handleSave} className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-semibold">Guardar</button>
          </div>
        </div>
      )}
    </div>
  );
}
