'use client';

import { useState, useEffect } from 'react';
import { Code2, Mail, Loader2, LogIn, UserPlus, AlertTriangle, ArrowLeft } from 'lucide-react';

/* ─── Login Component ─────────────────────────────────────────────────────── */
function DevLogin({ onLogin }: { onLogin: () => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const val = input.trim().toLowerCase();

    try {
      const res = await fetch('/api/personal');
      if (res.ok) {
        const personal: any[] = await res.json();
        localStorage.setItem('ph_personal', JSON.stringify(personal));

        const user = personal.find(p =>
          p.rol === 'dev' &&
          (p.email?.toLowerCase() === val || p.nombre?.toLowerCase() === val)
        );

        if (!user) {
          setError('No se encontró un desarrollador con ese Gmail o nombre. Pídele al admin que te registre.');
          setLoading(false);
          return;
        }

        localStorage.setItem('ph_dev_session', JSON.stringify({
          id: user.id, nombre: user.nombre, email: user.email,
          rol: user.rol, salario_monto: user.salario_monto, salario_tipo: user.salario_tipo,
          turno: user.turno || '', foto_url: user.foto_url || '',
        }));
        onLogin();
        return;
      }
    } catch {}

    try {
      const personal: any[] = JSON.parse(localStorage.getItem('ph_personal') || '[]');
      const user = personal.find(p =>
        p.rol === 'dev' &&
        (p.email?.toLowerCase() === val || p.nombre?.toLowerCase() === val)
      );

      if (user) {
        localStorage.setItem('ph_dev_session', JSON.stringify({
          id: user.id, nombre: user.nombre, email: user.email,
          rol: user.rol, salario_monto: user.salario_monto, salario_tipo: user.salario_tipo,
          turno: user.turno || '', foto_url: user.foto_url || '',
        }));
        onLogin();
      } else {
        setError('No se encontró un desarrollador con ese Gmail o nombre. Pídele al admin que te registre.');
      }
    } catch {
      setError('Error al procesar el inicio de sesión.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-purple-50 to-white p-4 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <a href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 mb-6 transition-colors group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Volver al inicio
        </a>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 to-indigo-600 px-8 pt-8 pb-12 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4 shadow-lg ring-1 ring-white/30">
                <Code2 size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Acceso Desarrollador</h1>
              <p className="text-purple-100 text-sm mt-1">Puerto Habana Cevicheria</p>
            </div>
          </div>

          <div className="px-8 pb-8 -mt-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Mail size={13} className="inline mr-1.5" />
                    Gmail o Nombre registrado
                  </label>
                  <input
                    type="text" required value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="ej: dev@gmail.com  o  Steven"
                    autoComplete="off"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 focus:outline-none text-sm transition-all duration-200 bg-gray-50/50 focus:bg-white"
                  />
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-purple-400" />
                    Usa el Gmail o nombre registrado por el admin.
                  </p>
                </div>

                {error && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-red-500 text-xs font-bold">!</span>
                    </div>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-700 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:from-purple-800 hover:to-indigo-700 transition-all duration-200 disabled:opacity-60 text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-200 hover:shadow-purple-300 active:scale-[0.98]">
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <><LogIn size={16} /> Entrar al Panel</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Sistema de gestión — Puerto Habana
        </p>
      </div>
    </div>
  );
}

/* ─── Dashboard Component ─────────────────────────────────────────────────── */
function DevDashboard() {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [admins, setAdmins] = useState<any[]>([]);
  const [status, setStatus] = useState({ msg: '', type: '' });

  const loadAdmins = async () => {
    try {
      const res = await fetch('/api/dev/admins');
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch {}
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleCreateAdmin = async () => {
    if (!adminEmail || !adminName) {
      setStatus({ msg: 'Llena nombre y correo', type: 'error' });
      return;
    }
    const res = await fetch('/api/dev/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: adminName, email: adminEmail })
    });
    const data = await res.json();
    if (data.success) {
      setStatus({ msg: 'Admin creado/actualizado con éxito', type: 'success' });
      setAdminEmail('');
      setAdminName('');
      loadAdmins();
    } else {
      setStatus({ msg: data.error || 'Error', type: 'error' });
    }
  };

  const handleResetSales = async () => {
    if (!confirm('¿Estás SEGURO de borrar TODAS las comandas y ventas de Supabase?')) return;
    const res = await fetch('/api/dev/reset-sales', { method: 'POST' });
    const data = await res.json();
    setStatus({ msg: data.success ? data.message : data.error, type: data.success ? 'success' : 'error' });
  };

  const handleResetStaff = async () => {
    if (!confirm('¿Estás SEGURO de borrar a todo el personal (menos admin)?')) return;
    const res = await fetch('/api/dev/reset-staff', { method: 'POST' });
    const data = await res.json();
    setStatus({ msg: data.success ? data.message : data.error, type: data.success ? 'success' : 'error' });
  };

  const handleAbrirCaja = async (turno: 'maniana' | 'noche') => {
    const fechaHoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    const turnoLabel = turno === 'maniana' ? 'Turno Mañana' : 'Turno Noche';
    if (!confirm(`¿Reabrir caja de ${turnoLabel} del ${fechaHoy}?\nEsto revertirá las comandas cerradas a "Entregado" y borrará la nota de cierre.`)) return;
    
    try {
      const res = await fetch('/api/dev/abrir-caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: fechaHoy, turno })
      });
      const data = await res.json();
      setStatus({ msg: data.success ? data.message : data.error, type: data.success ? 'success' : 'error' });
    } catch (e: any) {
      setStatus({ msg: 'Error de conexión', type: 'error' });
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header minimalista */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
          <Code2 size={20} className="text-purple-500" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">Desarrollador</h1>
          <p className="text-xs text-gray-400 mt-0.5">Superusuario · Reset DB · Crear Admin</p>
        </div>
      </div>

      {status.msg && (
        <div className={`mb-5 px-4 py-3 rounded-lg border text-xs font-medium ${
          status.type === 'error'
            ? 'bg-red-50 border-red-100 text-red-700'
            : 'bg-green-50 border-green-100 text-green-700'
        }`}>
          {status.msg}
        </div>
      )}

      {/* Crear Admin */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm mb-4">
        <h2 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
          <UserPlus size={15} className="text-gray-400" strokeWidth={1.5} />
          Forzar Creación de Admin
        </h2>
        <div className="flex flex-col gap-2.5">
          <input
            type="text"
            placeholder="Nombre (ej. Super Admin)"
            className="px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-200 placeholder-gray-400"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Correo (ej. admin@gmail.com)"
            className="px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-200 placeholder-gray-400"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
          />
          <button
            onClick={handleCreateAdmin}
            className="bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Crear Admin
          </button>
        </div>

        {/* Lista de Admins */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-[10px] font-medium uppercase text-gray-400 tracking-wider mb-3">
            Admins Registrados ({admins.length})
          </p>
          {admins.length === 0 ? (
            <p className="text-xs text-gray-400">No hay administradores registrados.</p>
          ) : (
            <div className="space-y-1.5">
              {admins.map((a: any) => (
                <div key={a.id} className="flex justify-between items-center px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.nombre}</p>
                    <p className="text-[11px] text-gray-400">{a.email}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    a.activo
                      ? 'bg-green-50 text-green-700 border-green-100'
                      : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {a.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Abrir Caja */}
      <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm mb-4">
        <h2 className="text-sm font-medium text-amber-700 mb-1 flex items-center gap-2">
          🔓 Reabrir Caja de Turno
        </h2>
        <p className="text-[11px] text-gray-400 mb-4">Revierte el cierre de caja para que el mozo pueda volver a imprimir. Solo actúa sobre la fecha de hoy.</p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-3 py-3 bg-amber-50 border border-amber-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">🌅 Turno Mañana</p>
              <p className="text-[11px] text-gray-400">Reabre la caja del turno mañana de hoy.</p>
            </div>
            <button
              onClick={() => handleAbrirCaja('maniana')}
              className="text-xs font-medium px-3.5 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shrink-0 ml-3"
            >
              Reabrir
            </button>
          </div>
          <div className="flex items-center justify-between px-3 py-3 bg-amber-50 border border-amber-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">🌙 Turno Noche</p>
              <p className="text-[11px] text-gray-400">Reabre la caja del turno noche de hoy.</p>
            </div>
            <button
              onClick={() => handleAbrirCaja('noche')}
              className="text-xs font-medium px-3.5 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shrink-0 ml-3"
            >
              Reabrir
            </button>
          </div>
        </div>
      </div>

      {/* Zona de peligro */}
      <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium text-red-600 mb-4 flex items-center gap-2">
          <AlertTriangle size={15} strokeWidth={1.5} />
          Zona de Peligro (Reset DB)
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between px-3 py-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Borrar todas las ventas</p>
              <p className="text-[11px] text-gray-400">Elimina historial de comandas y ventas.</p>
            </div>
            <button
              onClick={handleResetSales}
              className="text-xs font-medium px-3.5 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors shrink-0 ml-3"
            >
              Resetear
            </button>
          </div>
          
          <div className="flex items-center justify-between px-3 py-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Borrar todo el personal</p>
              <p className="text-[11px] text-gray-400">Elimina mozos, cocina y lavaplatos.</p>
            </div>
            <button
              onClick={handleResetStaff}
              className="text-xs font-medium px-3.5 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors shrink-0 ml-3"
            >
              Resetear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page: login check + conditional render ────────────────────────── */
export default function DevPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = () => {
    try {
      const sess = JSON.parse(localStorage.getItem('ph_dev_session') || 'null');
      setSession(sess);
    } catch {
      setSession(null);
    }
    setLoading(false);
    window.dispatchEvent(new Event('ph_store_update'));
  };

  useEffect(() => {
    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-purple-50 to-white">
        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) {
    return <DevLogin onLogin={checkSession} />;
  }

  return <DevDashboard />;
}
