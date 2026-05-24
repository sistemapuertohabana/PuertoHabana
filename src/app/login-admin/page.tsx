'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Mail, Loader2, LogIn } from 'lucide-react';

export default function LoginAdminPage() {
  const router = useRouter();
  const [email,   setEmail]   = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [checking,setChecking]= useState(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/admin-exists')
      .then(r => r.json())
      .then(data => {
        if (data.exists && data.email) setAdminEmail(data.email);
      })
      .catch(() => {
        const sess = localStorage.getItem('ph_admin_email');
        if (sess) setAdminEmail(sess);
      })
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const val = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/admin-exists');
      const data = await res.json();

      if (data.exists) {
        if (data.email?.toLowerCase() !== val) {
          setError('El Gmail ingresado no corresponde al administrador registrado.');
          setLoading(false);
          return;
        }
        localStorage.setItem('ph_admin_session', JSON.stringify({
          id:       data.id ?? 'admin',
          nombre:   data.nombre ?? 'Admin',
          email:    data.email,
          rol:      'admin',
          foto_url: data.foto_url || '',
        }));
        router.push('/admin/dashboard');
      } else {
        const localEmail = localStorage.getItem('ph_admin_email');
        if (localEmail && localEmail.toLowerCase() === val) {
          localStorage.setItem('ph_admin_session', JSON.stringify({ nombre: 'Admin', email: val, rol: 'admin' }));
          router.push('/admin/dashboard');
        } else if (!localEmail) {
          localStorage.setItem('ph_admin_email', val);
          localStorage.setItem('ph_admin_session', JSON.stringify({ nombre: 'Admin', email: val, rol: 'admin' }));
          router.push('/admin/dashboard');
        } else {
          setError('El Gmail ingresado no corresponde al administrador registrado.');
        }
      }
    } catch {
      const localEmail = localStorage.getItem('ph_admin_email');
      if (!localEmail) {
        localStorage.setItem('ph_admin_email', val);
        localStorage.setItem('ph_admin_session', JSON.stringify({ nombre: 'Admin', email: val, rol: 'admin' }));
        router.push('/admin/dashboard');
      } else if (localEmail.toLowerCase() === val) {
        localStorage.setItem('ph_admin_session', JSON.stringify({ nombre: 'Admin', email: val, rol: 'admin' }));
        router.push('/admin/dashboard');
      } else {
        setError('El Gmail ingresado no corresponde al administrador registrado.');
      }
    }

    setLoading(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-purple-50 to-white">
        <Loader2 size={32} className="animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-purple-50 to-white p-4 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 mb-6 transition-colors group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Volver al inicio
        </Link>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-500 px-8 pt-8 pb-12 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4 shadow-lg ring-1 ring-white/30">
                <ShieldCheck size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Acceso Administrativo</h1>
              <p className="text-purple-100 text-sm mt-1">Puerto Habana Cevicheria</p>
            </div>
          </div>

          <div className="px-8 pb-8 -mt-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              {adminEmail && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                  Admin registrado: <strong>{adminEmail}</strong>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Mail size={13} className="inline mr-1.5" />
                    Gmail del Administrador
                  </label>
                  <input
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={adminEmail ? `${adminEmail.slice(0, 3)}***@gmail.com` : 'admin@ejemplo.com'}
                    autoComplete="email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 focus:outline-none text-sm transition-all duration-200 bg-gray-50/50 focus:bg-white"
                  />
                  {!adminEmail && (
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-purple-400" />
                      Primera vez: este Gmail quedará registrado como el único administrador.
                    </p>
                  )}
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
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-bold py-3.5 rounded-xl hover:from-purple-700 hover:to-indigo-600 transition-all duration-200 disabled:opacity-60 text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-200 hover:shadow-purple-300 active:scale-[0.98]">
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <><LogIn size={16} /> Entrar al Dashboard</>
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
