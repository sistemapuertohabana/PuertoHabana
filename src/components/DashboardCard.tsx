'use client';

import { LucideIcon } from 'lucide-react';

type ColorMode = 'claro' | 'oscuro';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  colorMode?: ColorMode;
}

export default function DashboardCard({ title, value, icon: Icon, colorMode = 'claro' }: DashboardCardProps) {
  const isDark = colorMode === 'oscuro';

  return (
    <div 
      className={`group cursor-pointer transition-all duration-200 hover:shadow-sm ${
        isDark
          ? 'bg-[#111] border-gray-800 hover:border-gray-700' 
          : 'bg-white border-gray-200 hover:border-gray-400'
      } border rounded-xl`}
    >
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={`text-xs font-medium tracking-wide uppercase mb-3 ${
              isDark ? 'text-gray-400' : 'text-gray-400'
            }`}>{title}</p>
            <p className={`text-3xl md:text-4xl font-medium ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isDark
              ? 'bg-gray-800 group-hover:bg-white' 
              : 'bg-gray-50 group-hover:bg-black'
          }`}>
            <Icon 
              size={20} 
              className={`transition-colors ${
                isDark
                  ? 'text-gray-400 group-hover:text-black' 
                  : 'text-gray-400 group-hover:text-white'
              }`} 
              strokeWidth={2} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
