'use client';

import { useState, useEffect, useRef } from 'react';
import { getProfilePhoto, saveProfilePhoto } from '@/lib/store';

export default function CocinaPerfilPage() {
  const [photo, setPhoto] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    setPhoto(getProfilePhoto('cocina'));
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPhoto(dataUrl);
        saveProfilePhoto('cocina', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!mounted) return null;

  return (
    <div className="animate-in fade-in duration-1000 w-full max-w-screen-xl mx-auto">
      <header className="mb-24 border-b border-[#333] pb-12">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-none">Perfil</h1>
        <p className="text-[10px] tracking-[0.4em] text-[#888] uppercase mt-6">
          SISTEMA / 01
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-24 lg:gap-32">
        <div className="flex-shrink-0">
          <div 
            className="group relative cursor-pointer block" 
            onClick={() => fileInputRef.current?.click()}
            title="Cambiar foto de perfil"
          >
            <div className="w-64 h-64 md:w-96 md:h-96 bg-[#111] flex items-center justify-center overflow-hidden transition-all duration-700 hover:bg-[#222]">
              {photo ? (
                <img src={photo} alt="Profile" className="w-full h-full object-cover filter grayscale contrast-125 opacity-70 group-hover:opacity-100 transition-opacity duration-700" />
              ) : (
                <span className="text-[10px] tracking-[0.4em] text-[#444] uppercase group-hover:text-white transition-colors">
                  [ SUBIR ]
                </span>
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
            />
          </div>
        </div>

        <div className="flex-1 space-y-24">
          <div>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-4">Carlos Rodríguez</h2>
            <p className="text-[10px] tracking-[0.4em] text-[#888] uppercase">[ JEFE DE COCINA ]</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
            <div className="space-y-12">
              <div className="border-b border-[#222] pb-6">
                <p className="text-[9px] tracking-[0.4em] text-[#555] uppercase mb-4">Email</p>
                <p className="text-xl tracking-widest uppercase">cocina.jefe@puertohabana.pe</p>
              </div>
              
              <div className="border-b border-[#222] pb-6">
                <p className="text-[9px] tracking-[0.4em] text-[#555] uppercase mb-4">Turno Actual</p>
                <p className="text-xl tracking-widest uppercase">Completo <span className="text-[#888] font-mono text-sm ml-2">10:00—22:00</span></p>
              </div>
            </div>

            <div className="space-y-12">
              <div className="border-b border-[#222] pb-6">
                <p className="text-[9px] tracking-[0.4em] text-[#555] uppercase mb-4">Ingreso</p>
                <p className="text-xl tracking-widest uppercase font-mono">01.03.2024</p>
              </div>
              
              <div className="border-b border-[#222] pb-6">
                <p className="text-[9px] tracking-[0.4em] text-[#555] uppercase mb-4">Especialidad</p>
                <p className="text-xl tracking-widest uppercase">Marina & Criolla</p>
              </div>
            </div>
          </div>

          <div className="pt-16 border-t border-[#333]">
            <h3 className="text-[9px] tracking-[0.4em] text-[#555] uppercase mb-12">Finanzas</h3>
            <div className="flex flex-col sm:flex-row gap-16 sm:gap-32">
              <div>
                <p className="text-[9px] tracking-[0.4em] text-[#555] uppercase mb-4">Sueldo Base</p>
                <p className="text-4xl md:text-5xl font-light tracking-tighter">S/ 3,500.00</p>
              </div>
              <div>
                <p className="text-[9px] tracking-[0.4em] text-[#555] uppercase mb-4">Bonos</p>
                <p className="text-4xl md:text-5xl font-light tracking-tighter text-white">+ S/ 250.00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
