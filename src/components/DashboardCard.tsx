'use client';

import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
}

export default function DashboardCard({ title, value, icon: Icon }: DashboardCardProps) {
  return (
    <div className="group cursor-pointer transition-all duration-200 hover:shadow-sm bg-white border-gray-200 hover:border-gray-400 border rounded-xl">
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium tracking-wide uppercase mb-3 text-gray-400">{title}</p>
            <p className="text-3xl md:text-4xl font-medium text-gray-900">{value}</p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-gray-50 group-hover:bg-black">
            <Icon size={20} className="text-gray-400 group-hover:text-white transition-colors" strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
