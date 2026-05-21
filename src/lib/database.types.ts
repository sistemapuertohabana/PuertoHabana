export type UserRol = 'admin' | 'mozo' | 'cocina' | 'ayudante_cocina' | 'lavaplato';
export type MesaEstado = 'Disponible' | 'Ocupada' | 'Reservada';
export type ItemEstado = 'Pendiente' | 'En preparación' | 'Listo' | 'Entregado';
export type ComandaEstado = 'abierta' | 'cerrada';
export type ProductoCategoria = 'comida' | 'bebidas';
export type PagoMetodo = 'efectivo' | 'tarjeta' | 'transferencia';

export interface PedidoFlat {
  id: number;
  item: string;
  cantidad: number;
  mesa: string;
  precio: number;
  estado: string;
  hora: string;
  fecha: string;
  mozo_id: string;
  mozo_nombre: string;
  category: string;
  notas?: string | null;
  comanda_id?: string;
  mesa_id?: number;
  comanda_estado?: string;
}

export interface MesaRow {
  id: number;
  numero: string;
  zona: string | null;
  capacidad: number;
  estado: MesaEstado;
  juntada_con_id: number | null;
}

export interface ProductoRow {
  id: number;
  nombre: string;
  precio: number;
  categoria: ProductoCategoria;
  activo: boolean;
  stock: number | null;
}

export interface ProfileRow {
  id: string;
  nombre: string;
  email: string;
  rol: UserRol;
  foto_url: string | null;
  area_id: number | null;
  dni: string | null;
}

export interface ReservaRow {
  id: number;
  cliente: string;
  telefono: string | null;
  fecha: string;
  hora: string;
  personas: number;
  mesa: string | null;
  notas: string | null;
  estado: string;
}

export interface GastoRow {
  id: number;
  descripcion: string;
  categoria: string;
  monto: number;
  fecha: string;
}

export interface DesperdicioRow {
  id: number;
  descripcion: string;
  costo: number;
  fecha: string;
}

export interface PagoPersonalRow {
  id: number;
  mozo_nombre: string;
  monto: number;
  concepto: string;
  fecha: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: ProfileRow; Insert: Partial<ProfileRow>; Update: Partial<ProfileRow> };
      mesas: { Row: MesaRow; Insert: Partial<MesaRow>; Update: Partial<MesaRow> };
      productos: { Row: ProductoRow; Insert: Partial<ProductoRow>; Update: Partial<ProductoRow> };
      comandas: {
        Row: { id: string; mesa_id: number; mozo_id: string; fecha: string; hora_apertura: string; estado: ComandaEstado; total: number };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      comanda_items: {
        Row: { id: number; comanda_id: string; producto_id: number | null; nombre: string; cantidad: number; precio: number; estado: ItemEstado; notas: string | null; categoria: ProductoCategoria | null };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      reservas: { Row: ReservaRow; Insert: Partial<ReservaRow>; Update: Partial<ReservaRow> };
      gastos: { Row: GastoRow; Insert: Partial<GastoRow>; Update: Partial<GastoRow> };
      desperdicios: { Row: DesperdicioRow; Insert: Partial<DesperdicioRow>; Update: Partial<DesperdicioRow> };
      pagos_personal: { Row: PagoPersonalRow; Insert: Partial<PagoPersonalRow>; Update: Partial<PagoPersonalRow> };
      configuracion: { Row: { id: number; datos: Record<string, string> }; Insert: Record<string, unknown>; Update: Record<string, unknown> };
    };
    Views: {
      pedidos_vista: { Row: PedidoFlat };
    };
  };
};
