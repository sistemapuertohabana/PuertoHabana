import Link from 'next/link';
import Image from 'next/image';
import { ChefHat, Users, ShieldCheck } from 'lucide-react';

export default function WelcomePortal() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 p-6">
      <div className="text-center space-y-8">
        <Image
          src="/logo/LogoPuertoHabana.png"
          alt="Puerto Habana"
          width={120}
          height={120}
          className="mx-auto rounded-xl shadow-2xl"
          priority
        />
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-800">Puerto Habana</h1>
        <p className="text-gray-500 uppercase tracking-wider">Selecciona tu portal de acceso</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-3xl mx-auto">
          {/* Mozo */}
          <Link
            href="/login-mozo"
            className="group relative p-8 bg-white/60 backdrop-blur-lg rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
          >
            <div className="flex flex-col items-center space-y-4">
              <Users size={48} className="text-blue-600 group-hover:text-blue-700 transition-colors" />
              <h2 className="text-xl font-semibold text-gray-800">Mozo</h2>
              <p className="text-sm text-gray-500">Gestión de mesas y pedidos.</p>
            </div>
          </Link>
          {/* Cocina */}
          <Link
            href="/login-cocina"
            className="group relative p-8 bg-white/60 backdrop-blur-lg rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
          >
            <div className="flex flex-col items-center space-y-4">
              <ChefHat size={48} className="text-orange-600 group-hover:text-orange-700 transition-colors" />
              <h2 className="text-xl font-semibold text-gray-800">Cocina</h2>
              <p className="text-sm text-gray-500">Control y visualización de órdenes.</p>
            </div>
          </Link>
          {/* Admin */}
          <Link
            href="/login-admin"
            className="group relative p-8 bg-white/60 backdrop-blur-lg rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
          >
            <div className="flex flex-col items-center space-y-4">
              <ShieldCheck size={48} className="text-purple-600 group-hover:text-purple-700 transition-colors" />
              <h2 className="text-xl font-semibold text-gray-800">Administración</h2>
              <p className="text-sm text-gray-500">Dashboard, inventarios y personal.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
