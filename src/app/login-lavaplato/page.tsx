'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginLavaplatoPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Ingresa tu correo');
      return;
    }

    const { data, error: sbError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (sbError || !data) {
      setError('Correo no registrado o inactivo.');
      return;
    }

    if (data.rol !== 'lavaplato') {
      setError('No tienes permisos de Lavaplatos.');
      return;
    }

    localStorage.setItem('ph_lavaplato_session', JSON.stringify({
      id: data.id,
      nombre: data.nombre,
      email: data.email,
      rol: data.rol
    }));

    router.push('/lavaplato');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600 mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <ChefHat size={48} />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Lavaplatos</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Acceso exclusivo para personal de limpieza</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-medium border border-red-100">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder="ejemplo@gmail.com"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors gap-2 items-center"
            >
              Ingresar <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
