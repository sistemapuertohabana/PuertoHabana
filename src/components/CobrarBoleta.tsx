'use client';

import { useState } from 'react';
import Boleta from '@/components/Boleta';
import { cerrarComanda } from '@/lib/db/pedidos';
import type { PagoMetodo } from '@/lib/database.types';
import type { PedidoUI } from '@/lib/pedido-mapper';

interface CobrarBoletaProps {
  pedidos: PedidoUI[];
  comandaId: string;
  mesaId: number;
  mesaLabel: string;
  mozoNombre: string;
  fecha: string;
  hora: string;
  userId: string;
  onSuccess?: () => void;
  className?: string;
}

export default function CobrarBoleta({
  pedidos,
  comandaId,
  mesaId,
  mesaLabel,
  mozoNombre,
  fecha,
  hora,
  userId,
  onSuccess,
  className = '',
}: CobrarBoletaProps) {
  const [showBoleta, setShowBoleta] = useState(false);
  const [metodo, setMetodo] = useState<PagoMetodo>('efectivo');
  const [cerrando, setCerrando] = useState(false);

  const items = pedidos.map((p) => ({
    item: p.item,
    cantidad: p.cantidad,
    precio: p.precio,
    notas: p.notas,
  }));

  const allEntregados = pedidos.every((p) => p.estado === 'Entregado');

  const handleCerrar = async () => {
    setCerrando(true);
    try {
      await cerrarComanda(comandaId, mesaId, metodo, userId);
      setShowBoleta(true);
      onSuccess?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al cerrar comanda');
    } finally {
      setCerrando(false);
    }
  };

  if (!pedidos.length || !comandaId) return null;

  return (
    <div className={className}>
      {!allEntregados && (
        <p className="text-xs text-amber-600 mb-2">Todos los ítems deben estar Entregados para cobrar.</p>
      )}
      <div className="flex gap-2 mb-2">
        <select
          value={metodo}
          onChange={(e) => setMetodo(e.target.value as PagoMetodo)}
          className="text-sm border rounded-lg px-2 py-1.5 flex-1"
        >
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
        </select>
      </div>
      <button
        onClick={() => (allEntregados ? handleCerrar() : setShowBoleta(true))}
        disabled={cerrando}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-50"
      >
        {cerrando ? 'Procesando...' : allEntregados ? '🧾 Cobrar e Imprimir Boleta' : '🧾 Vista previa Boleta'}
      </button>

      {showBoleta && (
        <Boleta
          mesa={mesaLabel}
          mozoNombre={mozoNombre}
          fecha={fecha}
          hora={hora}
          items={items}
          onClose={() => setShowBoleta(false)}
        />
      )}
    </div>
  );
}
