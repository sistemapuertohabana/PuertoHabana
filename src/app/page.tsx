import Link from 'next/link';
import Image from 'next/image';
import { ChefHat, Users, ShieldCheck, Droplets, ArrowRight } from 'lucide-react';

const roles = [
  {
    href: '/login-mozo',
    icon: Users,
    label: 'Mozo',
    desc: 'Gestión de mesas y pedidos',
    color: 'text-blue-500',
    bg: 'bg-blue-50 group-hover:bg-blue-100',
    border: 'border-blue-100 group-hover:border-blue-200',
  },
  {
    href: '/login-cocina',
    icon: ChefHat,
    label: 'Cocina',
    desc: 'Control de comandas',
    color: 'text-orange-500',
    bg: 'bg-orange-50 group-hover:bg-orange-100',
    border: 'border-orange-100 group-hover:border-orange-200',
  },
  {
    href: '/login-lavaplato',
    icon: Droplets,
    label: 'Lavaplatos',
    desc: 'Área de lavado',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50 group-hover:bg-cyan-100',
    border: 'border-cyan-100 group-hover:border-cyan-200',
  },
  {
    href: '/login-admin',
    icon: ShieldCheck,
    label: 'Administración',
    desc: 'Dashboard y personal',
    color: 'text-purple-500',
    bg: 'bg-purple-50 group-hover:bg-purple-100',
    border: 'border-purple-100 group-hover:border-purple-200',
  },
];

export default function WelcomePortal() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Línea decorativa sutil */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="max-w-lg w-full text-center space-y-12">
        {/* Logo + Título */}
        <div className="space-y-5">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
            <Image
              src="/logo/LogoPuertoHabana.png"
              alt="Puerto Habana"
              width={40}
              height={40}
              className="rounded-lg"
              priority
            />
          </div>
          <div>
            <h1 className="text-3xl font-light tracking-tight text-gray-900">
              Puerto Habana
            </h1>
            <p className="text-sm text-gray-400 mt-2 font-light tracking-wide">
              Selecciona tu acceso
            </p>
          </div>
        </div>

        {/* Tarjetas de roles */}
        <div className="space-y-3">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.href}
                href={r.href}
                className={`group flex items-center gap-4 w-full p-4 rounded-xl border ${r.border} ${r.bg} transition-all duration-200 hover:shadow-sm`}
              >
                <div className={`w-10 h-10 rounded-lg ${r.bg} flex items-center justify-center ${r.color} transition-colors`}>
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">{r.label}</p>
                  <p className="text-xs text-gray-400 font-light">{r.desc}</p>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" strokeWidth={1.5} />
              </Link>
            );
          })}
        </div>

        {/* Footer sutil */}
        <p className="text-[11px] text-gray-300 font-light tracking-wider">
          © {new Date().getFullYear()} — Codeol Software
        </p>
      </div>
    </div>
  );
}
