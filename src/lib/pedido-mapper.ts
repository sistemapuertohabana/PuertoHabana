import type { PedidoFlat } from '@/lib/database.types';

export interface PedidoUI {
  id: number;
  item: string;
  cantidad: number;
  mesa: string;
  precio: number;
  estado: string;
  hora: string;
  notas?: string;
  mozoId: string;
  mozoNombre: string;
  fecha: string;
  category: 'comida' | 'bebidas';
  comandaId?: string;
  mesaId?: number;
  comanda_estado?: string;
}

export function flatToPedidoUI(p: PedidoFlat): PedidoUI {
  return {
    id: p.id,
    item: p.item,
    cantidad: p.cantidad,
    mesa: p.mesa,
    precio: Number(p.precio),
    estado: p.estado,
    hora: p.hora,
    notas: p.notas ?? undefined,
    mozoId: p.mozo_id,
    mozoNombre: p.mozo_nombre,
    fecha: p.fecha,
    category: (p.category === 'bebidas' ? 'bebidas' : 'comida') as 'comida' | 'bebidas',
    comandaId: p.comanda_id,
    mesaId: p.mesa_id,
    comanda_estado: p.comanda_estado,
  };
}

export function groupPedidosByComanda(pedidos: PedidoUI[]) {
  const groups: Record<string, PedidoUI[]> = {};
  pedidos.forEach((p) => {
    const key = p.comandaId ?? `${p.mesa}-${p.hora}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });
  return groups;
}
