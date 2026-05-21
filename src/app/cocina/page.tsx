'use client';

import { useMemo, useState } from 'react';
import { usePedidosRealtime, getLocalDateString } from '@/hooks/usePedidosRealtime';
import { updateItemEstado, updateItemsEstadoBulk } from '@/lib/db/pedidos';
import { flatToPedidoUI, type PedidoUI } from '@/lib/pedido-mapper';
import CobrarBoleta from '@/components/CobrarBoleta';
import { useAuth } from '@/hooks/useAuth';
import type { ItemEstado } from '@/lib/database.types';

interface ComandaGroup {
  idStr: string;
  mesa: string;
  hora: string;
  comandaId?: string;
  mesaId?: number;
  mozoNombre: string;
  items: PedidoUI[];
}

function groupPedidos(pedidos: PedidoUI[]): ComandaGroup[] {
  const groups: Record<string, ComandaGroup> = {};
  pedidos.forEach((o) => {
    const key = o.comandaId ?? `${o.mesa}-${o.hora}`;
    if (!groups[key]) {
      groups[key] = {
        idStr: key,
        mesa: o.mesa,
        hora: o.hora,
        comandaId: o.comandaId,
        mesaId: o.mesaId,
        mozoNombre: o.mozoNombre,
        items: [],
      };
    }
    groups[key].items.push(o);
  });
  return Object.values(groups);
}

export default function CocinaPage() {
  const { profile } = useAuth();
  const [fecha] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString()
      : getLocalDateString()
  );
  const { pedidos: flatPedidos, loading } = usePedidosRealtime(fecha);
  const pedidos = useMemo(() => flatPedidos.map(flatToPedidoUI), [flatPedidos]);

  const { activeComandas, historyComandas, platosServidos } = useMemo(() => {
    const groups = groupPedidos(pedidos);
    let countServidos = 0;
    pedidos.forEach((o) => {
      if (o.estado === 'Entregado') countServidos += o.cantidad;
    });
    const active = groups.filter((g) => g.items.some((i) => i.estado !== 'Entregado'));
    const history = groups.filter((g) => g.items.every((i) => i.estado === 'Entregado'));
    active.sort((a, b) => a.hora.localeCompare(b.hora));
    history.sort((a, b) => b.hora.localeCompare(a.hora));
    return { activeComandas: active, historyComandas: history, platosServidos: countServidos };
  }, [pedidos]);

  const changeItemStatus = async (id: number, currentStatus: string) => {
    const nextMap: Record<string, ItemEstado> = {
      Pendiente: 'En preparación',
      'En preparación': 'Listo',
      Listo: 'Entregado',
    };
    const next = nextMap[currentStatus];
    if (!next) return;
    await updateItemEstado(id, next);
  };

  const markAllAs = async (group: ComandaGroup, targetStatus: ItemEstado) => {
    await updateItemsEstadoBulk(
      group.items.map((i) => i.id),
      targetStatus
    );
  };

  if (loading) return null;

  return (
    <div className="animate-in fade-in duration-1000 w-full max-w-screen-2xl mx-auto">
      <header className="mb-24 flex flex-col md:flex-row md:items-end justify-between border-b border-[#333] pb-12 gap-8">
        <div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-none">
            Comandas
          </h1>
          <p className="text-[10px] tracking-[0.4em] text-[#888] uppercase mt-6">
            {fecha} — TIEMPO REAL
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] tracking-[0.4em] text-[#888] uppercase mb-4">Servidos Hoy</p>
          <p className="text-6xl md:text-8xl font-bold tracking-tighter leading-none">{platosServidos}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-[10px] tracking-[0.4em] uppercase text-[#888]">Órdenes Activas</h2>
            <span className="text-[10px] tracking-[0.4em] text-white">
              [{activeComandas.length}]
            </span>
          </div>

          <div className="space-y-32">
            {activeComandas.length === 0 && (
              <div className="py-32 text-center border border-[#222]">
                <p className="text-[10px] tracking-[0.4em] text-[#444] uppercase">Vacío</p>
              </div>
            )}

            {activeComandas.map((group) => (
              <div key={group.idStr} className="flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 pb-4 border-b border-[#333] gap-6">
                  <div>
                    <h3 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase">{group.mesa}</h3>
                    <p className="text-[10px] text-[#888] mt-4 tracking-[0.2em] font-mono">{group.hora} — {group.mozoNombre}</p>
                  </div>
                  <div className="flex gap-8">
                    <button
                      onClick={() => markAllAs(group, 'En preparación')}
                      className="text-[10px] tracking-[0.3em] uppercase text-[#666] hover:text-white transition-colors"
                    >
                      [ PREPARAR TODO ]
                    </button>
                    <button
                      onClick={() => markAllAs(group, 'Listo')}
                      className="text-[10px] tracking-[0.3em] uppercase text-white hover:text-[#666] transition-colors"
                    >
                      [ LISTO TODO ]
                    </button>
                  </div>
                </div>

                <div className="flex flex-col border-t border-[#111]">
                  {group.items.map((item) => {
                    const isListo = item.estado === 'Listo';
                    const isPrep = item.estado === 'En preparación';
                    return (
                      <div
                        key={item.id}
                        onClick={() => changeItemStatus(item.id, item.estado)}
                        className={`group flex items-center justify-between py-6 cursor-pointer border-b border-[#111] transition-colors hover:bg-[#111] px-4 -mx-4 ${isListo ? 'opacity-40' : ''}`}
                      >
                        <div className="flex items-center gap-8 md:gap-16">
                          <span className={`text-2xl font-light font-mono ${isPrep || isListo ? 'text-white' : 'text-[#555]'}`}>
                            {item.cantidad.toString().padStart(2, '0')}
                          </span>
                          <span className={`text-xl md:text-2xl uppercase tracking-widest ${isListo ? 'line-through text-[#666]' : ''}`}>
                            {item.item}
                          </span>
                        </div>
                        <div className="flex items-center gap-8">
                          <span className={`text-[9px] uppercase tracking-[0.3em] transition-colors hidden sm:block ${isListo ? 'text-white' : isPrep ? 'text-[#888]' : 'text-[#444]'}`}>
                            {item.estado}
                          </span>
                          {isListo && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                changeItemStatus(item.id, 'Listo');
                              }}
                              className="w-3 h-3 border border-white hover:bg-white transition-colors"
                              aria-label="Marcar como entregado"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4">
          <h2 className="text-[10px] tracking-[0.4em] uppercase text-[#888] mb-16">
            Salidas
          </h2>
          <div className="flex flex-col gap-12">
            {historyComandas.length === 0 && (
              <p className="text-[10px] tracking-[0.4em] text-[#444] uppercase py-4">Ninguna salida</p>
            )}
            {historyComandas.map((group) => (
              <div key={group.idStr} className="pb-8 border-b border-[#222] last:border-0">
                <div className="flex justify-between items-baseline mb-6">
                  <span className="text-xl uppercase tracking-widest font-bold">{group.mesa}</span>
                  <span className="text-[9px] tracking-[0.3em] text-[#555] uppercase">
                    OK
                  </span>
                </div>
                {group.comandaId && group.mesaId && profile && (
                  <div className="opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 contrast-125">
                    <CobrarBoleta
                      pedidos={group.items}
                      comandaId={group.comandaId}
                      mesaId={group.mesaId}
                      mesaLabel={group.mesa}
                      mozoNombre={group.mozoNombre}
                      fecha={fecha}
                      hora={group.hora}
                      userId={profile.id}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
