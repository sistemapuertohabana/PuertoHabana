'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Mail, Loader2 } from 'lucide-react';

export default function LoginAdminPage() {
  const router = useRouter();
  const [email,   setEmail]   = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [checking,setChecking]= useState(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  // Al cargar, verificar si ya hay admin registrado en la DB
  useEffect(() => {
    fetch('/api/auth/admin-exists')
      .then(r => r.json())
      .then(data => {
        if (data.exists && data.email) setAdminEmail(data.email);
      })
      .catch(() => {
        // DB no disponible — fallback a localStorage
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
      // Verificar contra DB
      const res = await fetch('/api/auth/admin-exists');
      const data = await res.json();

      if (data.exists) {
        if (data.email?.toLowerCase() !== val) {
          setError('El Gmail ingresado no corresponde al administrador registrado.');
          setLoading(false);
          return;
        }
        localStorage.setItem('ph_admin_session', JSON.stringify({
          id:     data.id ?? 'admin',
          nombre: data.nombre ?? 'Admin',
          email:  data.email,
          rol:    'admin',
        }));
        router.push('/admin/dashboard');
      } else {
        // No hay admin en DB — verificar localStorage como fallback
        const localEmail = localStorage.getItem('ph_admin_email');
        if (localEmail && localEmail.toLowerCase() === val) {
          localStorage.setItem('ph_admin_session', JSON.stringify({ nombre: 'Admin', email: val, rol: 'admin' }));
          router.push('/admin/dashboard');
        } else if (!localEmail) {
          // Primera vez — registrar este email como admin
          localStorage.setItem('ph_admin_email', val);
          localStorage.setItem('ph_admin_session', JSON.stringify({ nombre: 'Admin', email: val, rol: 'admin' }));
          router.push('/admin/dashboard');
        } else {
          setError('El Gmail ingresado no corresponde al administrador registrado.');
        }
      }
    } catch {
      // Fallback sin DB
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <Loader2 size={32} className="animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-purple-500 rounded-t-3xl" />

        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft size={15} className="mr-1" /> Volver
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={30} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Acceso Administrativo</h1>
          <p className="text-sm text-gray-500 mt-1">Puerto Habana Cevicheria</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Mail size={13} className="inline mr-1.5" />
              Gmail del Administrador
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={adminEmail ? `${adminEmail.slice(0, 3)}***@gmail.com` : 'admin@gmail.com'}
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 focus:outline-none text-sm"
            />
            {!adminEmail && (
              <p className="text-xs text-gray-400 mt-1.5">
                Primera vez: el Gmail que ingreses quedará registrado como el único administrador.
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-60 text-sm"
          >
            {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Entrar al Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
