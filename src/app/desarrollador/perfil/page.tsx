'use client';

import { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Clock, Calendar, Briefcase,
  Edit2, Save, X, Phone, MapPin, DollarSign,
} from 'lucide-react';
import { getProfilePhoto, saveProfilePhoto } from '@/lib/store';

import { supabase } from '@/lib/supabase';

/* ─── tipos ──────────────────────────────────────────────────────────────── */

interface PersonalRecord {
  id: string;
  nombre: string;
  dni?: string;
  email?: string;
  rol: string;
  salario_monto?: number;
  salario_tipo?: string;
}

interface MozoExtra {
  turno: string;
  area: string;
  telefono: string;
  fecha_ingreso: string;
}

const ROL_LABELS: Record<string, string> = {
  admin:           'Administrador',
  mozo:            'Mozo',
  cocina:          'Cocinero',
  ayudante_cocina: 'Ayudante de Cocina',
  lavaplato:       'Lavaplatos',
};

const SALARIO_LABELS: Record<string, string> = {
  diario:   'Diario',
  semanal:  'Semanal',
  mensual:  'Mensual',
};

/* ─── helpers ────────────────────────────────────────────────────────────── */

function loadSession(): { id?: string; nombre?: string; rol?: string; email?: string } {
  try { return JSON.parse(localStorage.getItem('ph_dev_session') || '{}'); } catch { return {}; }
}

/* ─── componente ─────────────────────────────────────────────────────────── */

export default function DevPerfilPage() {
  const [photo,   setPhoto]   = useState('');
  const [record,  setRecord]  = useState<PersonalRecord | null>(null);
  const [extra,   setExtra]   = useState<MozoExtra>({ turno: '', area: '', telefono: '', fecha_ingreso: '' });
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState<MozoExtra>({ turno: '', area: '', telefono: '', fecha_ingreso: '' });
  const [saved,   setSaved]   = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const session = loadSession();
    const id = session.id ?? '';

    if (!id) {
      setLoading(false);
      return;
    }

    // Cargar datos reales de Supabase
    const loadData = async () => {
      const { data, error } = await supabase.from('usuarios').select('*').eq('id', id).single();
      if (!error && data) {
        setRecord(data);
        const ex = {
          turno: data.turno || '',
          area: data.area || '',
          telefono: data.telefono || '',
          fecha_ingreso: data.fecha_ingreso || '',
        };
        setExtra(ex);
        setDraft(ex);
        setPhoto(data.foto_url || getProfilePhoto('dev'));
      } else {
        setRecord({
          id,
          nombre: session.nombre ?? 'Sin nombre',
          email:  session.email,
          rol:    session.rol ?? 'dev',
        });
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const url = reader.result as string;
      setPhoto(url);
      saveProfilePhoto('dev', url); // fallback local
      const id = loadSession().id;
      if (id) {
        await fetch(`/api/personal/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foto_url: url })
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const id = record?.id ?? '';
    if (!id) return;
    
    // Guardar vía API para asegurar permisos
    await fetch(`/api/personal/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        turno: draft.turno,
        area: draft.area,
        telefono: draft.telefono,
        fecha_ingreso: draft.fecha_ingreso
      })
    });

    setExtra(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCancel = () => {
    setDraft(extra);
    setEditing(false);
  };

  if (!mounted) return null;

  const nombre   = record?.nombre ?? '—';
  const rolLabel = ROL_LABELS[record?.rol ?? ''] ?? record?.rol ?? 'Mozo';
  const email    = record?.email ?? '—';
  const salario  = record?.salario_monto;
  const salTipo  = SALARIO_LABELS[record?.salario_tipo ?? ''] ?? record?.salario_tipo ?? '';

  return (
    <div className="animate-in fade-in duration-300 max-w-2xl mx-auto pb-24 lg:pb-8">
      <h1 className="text-3xl font-medium text-gray-900 mb-6">Mi Perfil</h1>

      {/* ── Tarjeta principal ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

        {/* Cover */}
        <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-500" />

        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div className="relative -mt-14 mb-4 inline-block">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-28 h-28 bg-white rounded-full p-1.5 shadow-md hover:scale-105 transition-transform block"
              title="Cambiar foto"
            >
              <div className="w-full h-full bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
                {photo
                  ? <img src={photo} alt="Perfil" className="w-full h-full object-cover" /> // eslint-disable-line
                  : <User size={44} className="text-gray-400" />}
              </div>
            </button>
            <input type="file" accept="image/*" className="hidden" ref={fileRef} onChange={handlePhotoUpload} />
            <span className="absolute bottom-1 right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
              <Edit2 size={12} className="text-white" />
            </span>
          </div>

          {/* Nombre y rol */}
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-gray-900">{nombre}</h2>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              {rolLabel}
            </span>
          </div>

          {/* ── Datos del admin (solo lectura) ──────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <InfoRow icon={<Mail size={15} />} label="Email" value={email} />
            {record?.dni && <InfoRow icon={<User size={15} />} label="DNI" value={record.dni} />}
          </div>

          {/* ── Datos editables por el mozo ─────────────────────────────── */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Información Personal
              </h3>
              {!editing ? (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                  <Edit2 size={13} /> Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleCancel}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <X size={13} /> Cancelar
                  </button>
                  <button onClick={handleSave}
                    className="flex items-center gap-1 text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors font-medium">
                    <Save size={13} /> Guardar
                  </button>
                </div>
              )}
            </div>

            {saved && (
              <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg font-medium">
                ✓ Información guardada
              </div>
            )}

            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <EditField label="Teléfono" icon={<Phone size={14} />}
                  value={draft.telefono}
                  onChange={v => setDraft(d => ({ ...d, telefono: v }))}
                  placeholder="+51 999 999 999" />
                <EditField label="Turno" icon={<Clock size={14} />}
                  value={draft.turno}
                  onChange={v => setDraft(d => ({ ...d, turno: v }))}
                  placeholder="Ej. Tarde" />
                <EditField label="Área Asignada" icon={<MapPin size={14} />}
                  value={draft.area}
                  onChange={v => setDraft(d => ({ ...d, area: v }))}
                  placeholder="Ej. Salón Principal" />
                <EditField label="Fecha de Ingreso" icon={<Calendar size={14} />}
                  value={draft.fecha_ingreso}
                  onChange={v => setDraft(d => ({ ...d, fecha_ingreso: v }))}
                  type="date" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow icon={<Phone size={15} />}   label="Teléfono"        value={extra.telefono    || '—'} />
                <InfoRow icon={<Clock size={15} />}   label="Turno"           value={extra.turno       || '—'} />
                <InfoRow icon={<MapPin size={15} />}  label="Área Asignada"   value={extra.area        || '—'} />
                <InfoRow icon={<Calendar size={15} />}label="Fecha de Ingreso"value={extra.fecha_ingreso || '—'} />
              </div>
            )}
          </div>

          {/* ── Salario (del admin, solo lectura) ───────────────────────── */}
          {salario && (
            <div className="border-t border-gray-100 pt-5 mt-5">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Información de Pago
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Salario Base</p>
                  <p className="text-lg font-bold text-gray-900">
                    S/ {Number(salario).toFixed(2)}
                    {salTipo && <span className="text-sm font-normal text-gray-400 ml-1">/ {salTipo.toLowerCase()}</span>}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── sub-componentes ────────────────────────────────────────────────────── */

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function EditField({
  label, icon, value, onChange, placeholder, type = 'text',
}: {
  label: string; icon: React.ReactNode; value: string;
  onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
        {icon} {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
      />
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
}
