'use client';

import { useMemo, useState } from 'react';
import { usePedidosRealtime, getLocalDateString } from '@/hooks/usePedidosRealtime';
import { flatToPedidoUI } from '@/lib/pedido-mapper';

export default function MozoHistorialPage() {
  const [fecha] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString()
      : getLocalDateString()
  );
  const [search, setSearch] = useState('');
  const { pedidos: flat, loading } = usePedidosRealtime(fecha);

  const grouped = useMemo(() => {
    const pedidos = flat.map(flatToPedidoUI);
    const groups: Record<string, typeof pedidos> = {};
    pedidos.forEach((p) => {
      const key = `${p.mesa}-${p.hora}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return Object.entries(groups)
      .map(([key, items]) => {
        const statuses = items.map((i) => i.estado);
        let estado = 'Pendiente';
        if (statuses.every((s) => s === 'Entregado')) estado = 'Entregado';
        else if (statuses.every((s) => s === 'Listo' || s === 'Entregado')) estado = 'Listo';
        else if (statuses.some((s) => s === 'En preparación')) estado = 'En preparación';
        return {
          key,
          mesa: items[0].mesa,
          hora: items[0].hora,
          mozoNombre: items[0].mozoNombre,
          items,
          estado,
          total: items.reduce((s, i) => s + i.precio * i.cantidad, 0),
        };
      })
      .filter(
        (g) =>
          !search ||
          g.mesa.toLowerCase().includes(search.toLowerCase()) ||
          g.items.some((i) => i.item.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => b.hora.localeCompare(a.hora));
  }, [flat, search]);

  if (loading) return null;

  return (
    <div className="animate-in fade-in duration-1000 min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 lg:p-24 selection:bg-white selection:text-black">
      <header className="mb-24 border-b border-[#333] pb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-none">Historial</h1>
          <p className="text-[10px] tracking-[0.4em] text-[#888] uppercase mt-6">
            {fecha}
          </p>
        </div>
        <div className="w-full md:w-96">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="[ BUSCAR ]"
            className="w-full bg-transparent border-b border-[#333] pb-4 text-xl tracking-[0.2em] uppercase focus:outline-none focus:border-white placeholder:text-[#444] transition-colors"
          />
        </div>
      </header>

      <div className="space-y-32">
        {grouped.length === 0 && (
          <div className="py-32 text-center border border-[#222]">
            <p className="text-[10px] tracking-[0.4em] text-[#444] uppercase">Vacío</p>
          </div>
        )}
        
        {grouped.map((g) => (
          <div key={g.key} className="flex flex-col">
            <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-12 pb-4 border-b border-[#333] gap-4">
              <div>
                <h3 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase">{g.mesa}</h3>
                <p className="text-[10px] text-[#888] mt-4 tracking-[0.2em] font-mono">{g.hora} — {g.mozoNombre}</p>
              </div>
              <div className="text-left md:text-right mt-4 md:mt-0">
                <span className={`text-[10px] tracking-[0.4em] uppercase ${g.estado === 'Entregado' ? 'text-[#444]' : 'text-white'}`}>
                  [ {g.estado} ]
                </span>
                <p className="text-4xl font-light mt-4 tracking-tighter">S/ {g.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex flex-col border-t border-[#111]">
              {g.items.map((i) => (
                <div key={i.id} className="flex justify-between items-baseline py-6 px-4 -mx-4 hover:bg-[#111] transition-colors border-b border-[#111]">
                  <div className="flex gap-8 md:gap-16 items-baseline">
                    <span className="text-2xl font-light font-mono text-[#555]">{i.cantidad.toString().padStart(2, '0')}</span>
                    <span className="text-xl md:text-2xl uppercase tracking-widest">{i.item}</span>
                  </div>
                  <span className="text-lg md:text-xl font-light tracking-tighter text-[#888]">S/ {(i.precio * i.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
