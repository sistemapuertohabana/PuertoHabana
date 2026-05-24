'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Droplets, ArrowLeft, Mail, Loader2, LogIn } from 'lucide-react';

export default function LoginLavaplatoPage() {
  const router  = useRouter();
  const [input,   setInput]   = useState('');
  const [error,   setError]   = useState('');
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
          p.rol === 'lavaplato' &&
          (p.email?.toLowerCase() === val || p.nombre?.toLowerCase() === val)
        );

        if (!user) {
          setError('No se encontró un lavaplatos con ese Gmail o nombre. Pídele al admin que te registre.');
          setLoading(false);
          return;
        }

        localStorage.setItem('ph_lavaplato_session', JSON.stringify({
          id: user.id, nombre: user.nombre, email: user.email,
          rol: user.rol, salario_monto: user.salario_monto, salario_tipo: user.salario_tipo,
        }));
        router.push('/lavaplato');
        return;
      }
    } catch {}

    try {
      const personal: any[] = JSON.parse(localStorage.getItem('ph_personal') || '[]');
      const user = personal.find(p =>
        p.rol === 'lavaplato' &&
        (p.email?.toLowerCase() === val || p.nombre?.toLowerCase() === val)
      );

      if (user) {
        localStorage.setItem('ph_lavaplato_session', JSON.stringify({
          id: user.id, nombre: user.nombre, email: user.email,
          rol: user.rol, salario_monto: user.salario_monto, salario_tipo: user.salario_tipo,
        }));
        router.push('/lavaplato');
      } else {
        setError('No se encontró un lavaplatos con ese Gmail o nombre. Pídele al admin que te registre.');
      }
    } catch {
      setError('Error al procesar el inicio de sesión.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-cyan-50 to-white p-4 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 mb-6 transition-colors group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Volver al inicio
        </Link>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-500 px-8 pt-8 pb-12 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4 shadow-lg ring-1 ring-white/30">
                <Droplets size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Acceso Lavaplatos</h1>
              <p className="text-cyan-100 text-sm mt-1">Puerto Habana Cevicheria</p>
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
                    placeholder="ej: lavaplatos@gmail.com  o  Pedro"
                    autoComplete="off"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 focus:outline-none text-sm transition-all duration-200 bg-gray-50/50 focus:bg-white"
                  />
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-cyan-400" />
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
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-500 text-white font-bold py-3.5 rounded-xl hover:from-cyan-700 hover:to-blue-600 transition-all duration-200 disabled:opacity-60 text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-200 hover:shadow-cyan-300 active:scale-[0.98]">
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
