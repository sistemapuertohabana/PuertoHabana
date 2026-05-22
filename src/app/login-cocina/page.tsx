'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, ArrowLeft } from 'lucide-react';

export default function LoginCocinaPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const personal = JSON.parse(localStorage.getItem('ph_personal') || '[]');
      const user = personal.find((p: any) => p.email === email.trim() && p.rol === 'cocina');
      
      if (user) {
        localStorage.setItem('ph_cocina_session', JSON.stringify(user));
        router.push('/cocina');
      } else {
        setError('No se encontró un cocinero con este correo.');
      }
    } catch {
      setError('Error al procesar el inicio de sesión.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-orange-500" />
        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft size={16} className="mr-1" /> Volver
        </Link>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Acceso Cocina</h1>
          <p className="text-sm text-gray-500 mt-1">Puerto Habana</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico (Gmail)</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cocinero@gmail.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-orange-600 text-white font-bold py-3.5 rounded-xl hover:bg-orange-700 transition-colors"
          >
            Entrar a Comandas
          </button>
        </form>
      </div>
    </div>
  );
}
