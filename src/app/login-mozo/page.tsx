'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, ArrowLeft, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginMozoPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Credenciales incorrectas');
      setLoading(false);
      return;
    }

    const rol = data.user.user_metadata?.rol;
    if (rol !== 'mozo') {
      await supabase.auth.signOut();
      setError('Esta cuenta no es de Mozo.');
      setLoading(false);
      return;
    }

    router.push('/mozo');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-blue-500" />
        
        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-6">
          <ArrowLeft size={16} className="mr-1" /> Volver al portal
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Acceso Mozos</h1>
          <p className="text-sm text-gray-500 mt-1">Puerto Habana</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo de mozo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 focus:bg-white transition-colors"
              placeholder="mozo@puertohabana.pe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 focus:bg-white transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-center font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Entrar a Mesas'}
          </button>
        </form>
      </div>
    </div>
  );
}
