'use client';

import { useState } from 'react';
import Boleta from '@/components/Boleta';

interface ItemBoleta {
  item: string;
  cantidad: number;
  precio: number;
  notas?: string;
}

interface CobrarBoletaProps {
  pedidos: ItemBoleta[];
  mesaLabel: string;
  mozoNombre: string;
  fecha: string;
  hora: string;
  onSuccess?: () => void;
  className?: string;
}

export default function CobrarBoleta({
  pedidos,
  mesaLabel,
  mozoNombre,
  fecha,
  hora,
  onSuccess,
  className = '',
}: CobrarBoletaProps) {
  const [showBoleta, setShowBoleta] = useState(false);

  if (!pedidos.length) return null;

  return (
    <div className={className}>
      <button
        onClick={() => setShowBoleta(true)}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold"
      >
        🧾 Imprimir Boleta
      </button>

      {showBoleta && (
        <Boleta
          mesa={mesaLabel}
          mozoNombre={mozoNombre}
          fecha={fecha}
          hora={hora}
          items={pedidos}
          onClose={() => { setShowBoleta(false); onSuccess?.(); }}
        />
      )}
    </div>
  );
}
