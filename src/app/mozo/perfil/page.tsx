'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Mail, Clock, Calendar, Briefcase } from 'lucide-react';
import { getProfilePhoto, saveProfilePhoto } from '@/lib/store';

export default function MozoPerfilPage() {
  const [photo, setPhoto] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    setPhoto(getProfilePhoto('mozo'));
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPhoto(dataUrl);
        saveProfilePhoto('mozo', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!mounted) return null;

  return (
    <div className="animate-in fade-in duration-300 max-w-3xl mx-auto pb-20 lg:pb-0">
      <h1 className="text-3xl font-medium text-gray-900 mb-8">Mi Perfil</h1>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

        <div className="px-8 pb-8 relative">
          {/* Avatar & Upload */}
          <div 
            className="relative -mt-16 mb-6 inline-block cursor-pointer" 
            onClick={() => fileInputRef.current?.click()}
            title="Cambiar foto de perfil"
          >
            <div className="w-32 h-32 bg-white rounded-full p-2 transition-transform hover:scale-105">
              <div className="w-full h-full bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center overflow-hidden hover:bg-gray-200 transition-colors">
                {photo ? (
                  <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-gray-400" />
                )}
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
            />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Juan Pérez</h2>
            <p className="text-blue-600 font-medium">Mozo Principal</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <p className="text-sm font-semibold text-gray-900">juan.perez@puertohabana.pe</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Turno Actual</p>
                  <p className="text-sm font-semibold text-gray-900">Mañana (08:00 - 16:00)</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Fecha de Ingreso</p>
                  <p className="text-sm font-semibold text-gray-900">12 de Enero, 2025</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                  <Briefcase size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Área Asignada</p>
                  <p className="text-sm font-semibold text-gray-900">Terraza Principal</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Información de Pago</h3>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Sueldo Base</p>
                <p className="text-xl font-bold text-gray-900">S/ 1,200.00</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-medium">Comisiones (Mes actual)</p>
                <p className="text-xl font-bold text-green-600">+ S/ 340.50</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
