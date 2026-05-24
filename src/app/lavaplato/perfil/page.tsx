'use client';

import { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Calendar,
  Edit2, Phone, MapPin, DollarSign, BellRing,
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
  try { return JSON.parse(localStorage.getItem('ph_lavaplato_session') || '{}'); } catch { return {}; }
}

/* ─── componente ─────────────────────────────────────────────────────────── */

export default function LavaplatoPerfilPage() {
  const [photo,   setPhoto]   = useState('');
  const [record,  setRecord]  = useState<PersonalRecord | null>(null);
  const [extra,   setExtra]   = useState<MozoExtra>({ turno: '', area: '', telefono: '', fecha_ingreso: '' });
  // No editing — solo el admin edita desde su dashboard
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [notifActivas, setNotifActivas] = useState(false);

  useEffect(() => {
    setMounted(true);
    const session = loadSession();
    const id = session.id ?? '';

    // Cargar estado de notificaciones
    setNotifActivas(localStorage.getItem('notificaciones_activas') !== 'false');

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
        setPhoto(data.foto_url || getProfilePhoto('lavaplato'));
      } else {
        setRecord({
          id,
          nombre: session.nombre ?? 'Sin nombre',
          email:  session.email,
          rol:    session.rol ?? 'lavaplato',
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
      saveProfilePhoto('lavaplato', url); // fallback local
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

  // Foto permitida (personal) | Datos personales solo los edita el admin
  if (!mounted) return null;

  const nombre   = record?.nombre ?? '—';
  const rolLabel = ROL_LABELS[record?.rol ?? ''] ?? record?.rol ?? 'Lavaplatos';
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
          <div className="mb-3">
            <h2 className="text-2xl font-bold text-gray-900">{nombre}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                {rolLabel}
              </span>
              {/* Turno (solo visual — admin edita desde dashboard) */}
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                extra.turno
                  ? extra.turno === 'Mañana'
                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                  : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {extra.turno || 'Sin turno'}
              </span>
            </div>
          </div>

          {/* ── Datos del admin (solo lectura) ──────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <InfoRow icon={<Mail size={15} />} label="Email" value={email} />
            {record?.dni && <InfoRow icon={<User size={15} />} label="DNI" value={record.dni} />}
          </div>

          {/* ── Datos del personal (solo lectura — admin edita desde dashboard) ── */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Información Personal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon={<Phone size={15} />}   label="Teléfono"        value={extra.telefono    || '—'} />
              <InfoRow icon={<MapPin size={15} />}  label="Área Asignada"   value={extra.area        || '—'} />
              <InfoRow icon={<Calendar size={15} />}label="Fecha de Ingreso"value={extra.fecha_ingreso || '—'} />
            </div>
            <p className="text-[10px] text-gray-400 mt-3 italic">Estos datos los gestiona el administrador desde su panel.</p>
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

          {/* ── Notificaciones Push ──────────────────────────────────── */}
          <div className="border-t border-gray-100 pt-5 mt-5">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Notificaciones Push
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${notifActivas ? 'bg-blue-100' : 'bg-gray-200'}`}>
                  <BellRing size={18} className={notifActivas ? 'text-blue-600' : 'text-gray-400'} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {notifActivas ? 'Notificaciones activadas' : 'Notificaciones desactivadas'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {notifActivas ? 'Recibirás alertas en tiempo real' : 'No recibirás alertas en tiempo real'}
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (notifActivas) {
                    localStorage.setItem('notificaciones_activas', 'false');
                    setNotifActivas(false);
                  } else {
                    localStorage.setItem('notificaciones_activas', 'true');
                    setNotifActivas(true);
                    if ('Notification' in window) await Notification.requestPermission().catch(() => {});
                    try { const a = new Audio('/notification.mp3'); a.volume = 0; await a.play(); } catch {}
                  }
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  notifActivas
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {notifActivas ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
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

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
}
