-- Sistema Puerto Habana - Supabase / PostgreSQL
-- Ejecutar en SQL Editor del proyecto Supabase

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Limpieza previa (por si se ejecuta múltiples veces)
DROP TABLE IF EXISTS ingredientes, configuracion, pagos_personal, desperdicios, gastos, reservas, boletas, pagos, comanda_items, comandas, productos, mesas, profiles, areas CASCADE;
DROP TYPE IF EXISTS user_rol, mesa_estado, item_estado, comanda_estado, producto_categoria, pago_metodo CASCADE;


-- Enums
CREATE TYPE user_rol AS ENUM ('admin', 'mozo', 'cocina');
CREATE TYPE mesa_estado AS ENUM ('Disponible', 'Ocupada', 'Reservada');
CREATE TYPE item_estado AS ENUM ('Pendiente', 'En preparación', 'Listo', 'Entregado');
CREATE TYPE comanda_estado AS ENUM ('abierta', 'cerrada');
CREATE TYPE producto_categoria AS ENUM ('comida', 'bebidas');
CREATE TYPE pago_metodo AS ENUM ('efectivo', 'tarjeta', 'transferencia');

-- Areas
CREATE TABLE areas (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol user_rol NOT NULL DEFAULT 'mozo',
  foto_url TEXT,
  area_id INT REFERENCES areas(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Mesas
CREATE TABLE mesas (
  id SERIAL PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  zona TEXT DEFAULT 'Terraza',
  capacidad INT DEFAULT 4,
  estado mesa_estado DEFAULT 'Disponible',
  juntada_con_id INT REFERENCES mesas(id) ON DELETE SET NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Productos (menú único)
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  categoria producto_categoria NOT NULL DEFAULT 'comida',
  activo BOOLEAN DEFAULT TRUE,
  stock INT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Comandas (cabecera por visita)
CREATE TABLE comandas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mesa_id INT NOT NULL REFERENCES mesas(id) ON DELETE RESTRICT,
  mozo_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_apertura TIME NOT NULL DEFAULT CURRENT_TIME,
  estado comanda_estado DEFAULT 'abierta',
  total DECIMAL(10,2) DEFAULT 0,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comandas_fecha ON comandas(fecha);
CREATE INDEX idx_comandas_mesa ON comandas(mesa_id);
CREATE INDEX idx_comandas_mozo ON comandas(mozo_id);
CREATE INDEX idx_comandas_estado ON comandas(estado);

-- Items de comanda
CREATE TABLE comanda_items (
  id BIGSERIAL PRIMARY KEY,
  comanda_id UUID NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  producto_id INT REFERENCES productos(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  estado item_estado DEFAULT 'Pendiente',
  notas TEXT,
  categoria producto_categoria,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comanda_items_comanda ON comanda_items(comanda_id);
CREATE INDEX idx_comanda_items_estado ON comanda_items(estado);

-- Pagos al cerrar comanda
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comanda_id UUID NOT NULL REFERENCES comandas(id) ON DELETE RESTRICT,
  metodo pago_metodo NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  igv DECIMAL(10,2) NOT NULL,
  monto_total DECIMAL(10,2) NOT NULL,
  fecha_pago TIMESTAMPTZ DEFAULT NOW()
);

-- Boletas emitidas
CREATE TABLE boletas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comanda_id UUID NOT NULL REFERENCES comandas(id) ON DELETE RESTRICT,
  pago_id UUID NOT NULL REFERENCES pagos(id) ON DELETE RESTRICT,
  numero_correlativo SERIAL,
  impreso_en TIMESTAMPTZ DEFAULT NOW(),
  impreso_por UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Reservas
CREATE TABLE reservas (
  id SERIAL PRIMARY KEY,
  cliente TEXT NOT NULL,
  telefono TEXT,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  personas INT NOT NULL DEFAULT 2,
  mesa TEXT,
  notas TEXT,
  estado TEXT DEFAULT 'pendiente',
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Gastos
CREATE TABLE gastos (
  id SERIAL PRIMARY KEY,
  descripcion TEXT NOT NULL,
  categoria TEXT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Desperdicios
CREATE TABLE desperdicios (
  id SERIAL PRIMARY KEY,
  descripcion TEXT NOT NULL,
  costo DECIMAL(10,2) NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Pagos a personal
CREATE TABLE pagos_personal (
  id SERIAL PRIMARY KEY,
  mozo_nombre TEXT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  concepto TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración del negocio (singleton)
CREATE TABLE configuracion (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  datos JSONB NOT NULL DEFAULT '{}'::jsonb,
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredientes (inventario extendido)
CREATE TABLE ingredientes (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  cantidad DECIMAL(10,2) DEFAULT 0,
  unidad TEXT DEFAULT 'kg',
  precio DECIMAL(10,2) DEFAULT 0,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: recalcular total de comanda
CREATE OR REPLACE FUNCTION recalc_comanda_total()
RETURNS TRIGGER AS $$
DECLARE
  cid UUID;
BEGIN
  cid := COALESCE(NEW.comanda_id, OLD.comanda_id);
  UPDATE comandas SET
    total = COALESCE((
      SELECT SUM(cantidad * precio) FROM comanda_items WHERE comanda_id = cid
    ), 0),
    actualizado_en = NOW()
  WHERE id = cid;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalc_comanda_total
AFTER INSERT OR UPDATE OR DELETE ON comanda_items
FOR EACH ROW EXECUTE FUNCTION recalc_comanda_total();

-- Vista plana compatible con UI (pedidos por línea)
CREATE OR REPLACE VIEW pedidos_vista AS
SELECT
  ci.id,
  ci.nombre AS item,
  ci.cantidad,
  m.numero AS mesa,
  ci.precio,
  ci.estado::text AS estado,
  TO_CHAR(c.hora_apertura, 'HH24:MI') AS hora,
  c.fecha::text AS fecha,
  c.mozo_id AS mozo_id,
  p.nombre AS mozo_nombre,
  COALESCE(ci.categoria::text, 'comida') AS category,
  ci.notas,
  ci.comanda_id,
  c.mesa_id,
  c.estado AS comanda_estado
FROM comanda_items ci
JOIN comandas c ON c.id = ci.comanda_id
JOIN mesas m ON m.id = c.mesa_id
JOIN profiles p ON p.id = c.mozo_id;

-- Helper: rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_rol()
RETURNS user_rol AS $$
  SELECT rol FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Auto-crear profile al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, email, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'rol')::public.user_rol, 'mozo'::public.user_rol)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comanda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE boletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE desperdicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Areas: read all authenticated
CREATE POLICY "areas_select" ON areas FOR SELECT TO authenticated USING (true);

-- Mesas
CREATE POLICY "mesas_select" ON mesas FOR SELECT TO authenticated USING (true);
CREATE POLICY "mesas_update" ON mesas FOR UPDATE TO authenticated
  USING (get_user_rol() IN ('admin', 'mozo'));
CREATE POLICY "mesas_insert" ON mesas FOR INSERT TO authenticated
  WITH CHECK (get_user_rol() = 'admin');

-- Productos
CREATE POLICY "productos_select" ON productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "productos_all_admin" ON productos FOR ALL TO authenticated
  USING (get_user_rol() = 'admin');

-- Comandas
CREATE POLICY "comandas_select" ON comandas FOR SELECT TO authenticated
  USING (
    get_user_rol() = 'admin'
    OR get_user_rol() = 'cocina'
    OR (get_user_rol() = 'mozo' AND mozo_id = auth.uid())
  );
CREATE POLICY "comandas_insert" ON comandas FOR INSERT TO authenticated
  WITH CHECK (
    get_user_rol() = 'admin'
    OR (get_user_rol() = 'mozo' AND mozo_id = auth.uid())
  );
CREATE POLICY "comandas_update" ON comandas FOR UPDATE TO authenticated
  USING (get_user_rol() IN ('admin', 'mozo', 'cocina'));

-- Comanda items
CREATE POLICY "items_select" ON comanda_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "items_insert" ON comanda_items FOR INSERT TO authenticated
  WITH CHECK (get_user_rol() IN ('admin', 'mozo'));
CREATE POLICY "items_update" ON comanda_items FOR UPDATE TO authenticated
  USING (get_user_rol() IN ('admin', 'cocina', 'mozo'));

-- Pagos y boletas
CREATE POLICY "pagos_select" ON pagos FOR SELECT TO authenticated USING (true);
CREATE POLICY "pagos_insert" ON pagos FOR INSERT TO authenticated
  WITH CHECK (get_user_rol() IN ('admin', 'mozo', 'cocina'));
CREATE POLICY "boletas_select" ON boletas FOR SELECT TO authenticated USING (true);
CREATE POLICY "boletas_insert" ON boletas FOR INSERT TO authenticated
  WITH CHECK (get_user_rol() IN ('admin', 'mozo', 'cocina'));

-- Admin tables
CREATE POLICY "reservas_all" ON reservas FOR ALL TO authenticated USING (true);
CREATE POLICY "gastos_admin" ON gastos FOR ALL TO authenticated
  USING (get_user_rol() IN ('admin', 'mozo'));
CREATE POLICY "desperdicios_admin" ON desperdicios FOR ALL TO authenticated
  USING (get_user_rol() = 'admin');
CREATE POLICY "pagos_personal_admin" ON pagos_personal FOR ALL TO authenticated
  USING (get_user_rol() = 'admin');
CREATE POLICY "config_select" ON configuracion FOR SELECT TO authenticated USING (true);
CREATE POLICY "config_admin" ON configuracion FOR ALL TO authenticated
  USING (get_user_rol() = 'admin');
CREATE POLICY "ingredientes_admin" ON ingredientes FOR ALL TO authenticated
  USING (get_user_rol() = 'admin');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE comanda_items;
ALTER PUBLICATION supabase_realtime ADD TABLE mesas;
ALTER PUBLICATION supabase_realtime ADD TABLE comandas;

-- Seed data
INSERT INTO areas (nombre) VALUES ('Terraza Principal'), ('Salón');

INSERT INTO mesas (numero, zona, capacidad, estado) VALUES
  ('Mesa 1', 'Terraza', 4, 'Disponible'),
  ('Mesa 2', 'Terraza', 2, 'Disponible'),
  ('Mesa 3', 'Terraza', 6, 'Disponible'),
  ('Mesa 4', 'Terraza', 4, 'Disponible'),
  ('Mesa 5', 'Salón', 8, 'Disponible'),
  ('Mesa 6', 'Salón', 4, 'Disponible'),
  ('Mesa 7', 'Salón', 4, 'Disponible'),
  ('Mesa 8', 'Salón', 2, 'Disponible');

INSERT INTO productos (nombre, precio, categoria) VALUES
  ('Ceviche Mixto', 45.00, 'comida'),
  ('Ceviche de Pescado', 42.00, 'comida'),
  ('Arroz con Mariscos', 38.00, 'comida'),
  ('Lomo Saltado', 32.00, 'comida'),
  ('Jalea Mixta', 40.00, 'comida'),
  ('Leche de Tigre', 20.00, 'comida'),
  ('Cerveza Pilsner', 12.00, 'bebidas'),
  ('Inca Kola 1L', 15.00, 'bebidas'),
  ('Chicha Morada Jarra', 18.00, 'bebidas');

INSERT INTO configuracion (id, datos) VALUES (1, '{
  "nombre": "Cevicheria Puerto Habana",
  "tipo": "Cevichería",
  "ruc": "10429025546",
  "direccion": "Av. Colonización 1115, Perú - Pucallpa",
  "telefono": "+51 979 459 608"
}'::jsonb);

-- NOTA: Crear usuarios en Authentication → Users con metadata:
-- admin@puertohabana.pe  → rol: admin,  nombre: Admin
-- mozo@puertohabana.pe   → rol: mozo,   nombre: Juan Pérez
-- cocina@puertohabana.pe → rol: cocina, nombre: Ana Gómez
-- Contraseña sugerida: PuertoHabana2026!
