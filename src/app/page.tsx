import Link from 'next/link';
import Image from 'next/image';
import { ChefHat, Users, ShieldCheck } from 'lucide-react';

export default function WelcomePortal() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-4">
      <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Image
          src="/logo/LogoPuertoHabana.png"
          alt="Puerto Habana"
          width={100}
          height={100}
          className="mx-auto mb-6 rounded-2xl shadow-lg"
          priority
        />
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Puerto Habana</h1>
        <p className="text-gray-500 font-medium mt-2 tracking-wide uppercase text-sm">Selecciona tu portal de acceso</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        {/* Portal Mozo */}
        <Link href="/login-mozo" className="group relative bg-white/60 backdrop-blur-xl border border-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-500/0 group-hover:from-blue-500/10 transition-colors" />
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
            <Users size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mozos</h2>
          <p className="text-sm text-gray-500">Gestión de mesas, comandas y atención al cliente.</p>
        </Link>

        {/* Portal Cocina */}
        <Link href="/login-cocina" className="group relative bg-white/60 backdrop-blur-xl border border-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-500/0 group-hover:from-orange-500/10 transition-colors" />
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
            <ChefHat size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cocina</h2>
          <p className="text-sm text-gray-500">Visualización de pedidos y control de preparación.</p>
        </Link>

        {/* Portal Admin */}
        <Link href="/login-admin" className="group relative bg-white/60 backdrop-blur-xl border border-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-500/0 group-hover:from-purple-500/10 transition-colors" />
          <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Administración</h2>
          <p className="text-sm text-gray-500">Dashboard, inventarios, personal y configuración.</p>
        </Link>
      </div>
    </div>
  );
}
