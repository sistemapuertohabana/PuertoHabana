'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, ArrowLeft, Mail, Loader2 } from 'lucide-react';

export default function LoginMozoPage() {
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
      // 1. Intentar desde la API (MySQL)
      const res = await fetch('/api/personal');
      if (res.ok) {
        const personal: any[] = await res.json();
        // Sincronizar para uso offline
        localStorage.setItem('ph_personal', JSON.stringify(personal));

        const user = personal.find(p =>
          p.rol === 'mozo' &&
          (p.email?.toLowerCase() === val || p.nombre?.toLowerCase() === val)
        );

        if (!user) {
          setError('No se encontró un mozo con ese Gmail o nombre. Pídele al admin que te registre.');
          setLoading(false);
          return;
        }

        localStorage.setItem('ph_mozo_session', JSON.stringify({
          id: user.id, nombre: user.nombre, email: user.email,
          rol: user.rol, salario_monto: user.salario_monto, salario_tipo: user.salario_tipo,
          turno: user.turno || '', foto_url: user.foto_url || '',
        }));
        router.push('/mozo');
        return;
      }
    } catch {}

    // 2. Fallback: buscar en localStorage (caché de ph_personal)
    try {
      const personal: any[] = JSON.parse(localStorage.getItem('ph_personal') || '[]');
      const user = personal.find(p =>
        p.rol === 'mozo' &&
        (p.email?.toLowerCase() === val || p.nombre?.toLowerCase() === val)
      );

      if (user) {
        localStorage.setItem('ph_mozo_session', JSON.stringify({
          id: user.id, nombre: user.nombre, email: user.email,
          rol: user.rol, salario_monto: user.salario_monto, salario_tipo: user.salario_tipo,
          turno: user.turno || '', foto_url: user.foto_url || '',
        }));
        router.push('/mozo');
      } else {
        setError('No se encontró un mozo con ese Gmail o nombre. Pídele al admin que te registre.');
      }
    } catch {
      setError('Error al procesar el inicio de sesión.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-500 rounded-t-3xl" />

        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft size={15} className="mr-1" /> Volver
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={30} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Acceso Mozos</h1>
          <p className="text-sm text-gray-500 mt-1">Puerto Habana Cevicheria</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Mail size={13} className="inline mr-1.5" />
              Gmail o Nombre registrado
            </label>
            <input
              type="text" required value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="tu@gmail.com  o  Tu Nombre"
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Usa el Gmail o nombre que el admin registró para ti.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 text-sm flex items-center justify-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Entrar a Mesas'}
          </button>
        </form>
      </div>
    </div>
  );
}
