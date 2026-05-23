'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, ArrowLeft, Mail } from 'lucide-react';

export default function LoginCocinaPage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const personal: any[] = JSON.parse(localStorage.getItem('ph_personal') || '[]');
      const val = input.trim().toLowerCase();

      // Acepta cocina o ayudante_cocina
      const user = personal.find(p =>
        (p.rol === 'cocina' || p.rol === 'ayudante_cocina') &&
        (p.email?.toLowerCase() === val || p.nombre?.toLowerCase() === val)
      );

      if (!user) {
        setError('No se encontró un cocinero con ese Gmail o nombre. Pídele al admin que te registre.');
        setLoading(false);
        return;
      }

      localStorage.setItem('ph_cocina_session', JSON.stringify({
        id:     user.id,
        nombre: user.nombre,
        email:  user.email,
        rol:    user.rol,
        salario_monto: user.salario_monto,
        salario_tipo:  user.salario_tipo,
      }));

      router.push('/cocina');
    } catch {
      setError('Error al procesar el inicio de sesión.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-orange-500 rounded-t-3xl" />

        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft size={15} className="mr-1" /> Volver
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChefHat size={30} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Acceso Cocina</h1>
          <p className="text-sm text-gray-500 mt-1">Puerto Habana Cevicheria</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Mail size={13} className="inline mr-1.5" />
              Gmail o Nombre registrado
            </label>
            <input
              type="text"
              required
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="tu@gmail.com  o  Tu Nombre"
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:outline-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Usa el Gmail o nombre que el admin registró para ti.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white font-bold py-3.5 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-60 text-sm"
          >
            {loading ? 'Verificando...' : 'Entrar a Comandas'}
          </button>
        </form>
      </div>
    </div>
  );
}
