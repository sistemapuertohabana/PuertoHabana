-- ============================================================
--  Migración: Permitir categoría 'tapers' en comandas
--  Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Actualizar CHECK constraint en comanda_items para permitir 'tapers'
ALTER TABLE comanda_items
DROP CONSTRAINT IF EXISTS comanda_items_categoria_check;

ALTER TABLE comanda_items
ADD CONSTRAINT comanda_items_categoria_check
  CHECK (categoria IN ('comida','bebidas','tapers'));

-- 2. Agregar columna total_tapers a ventas_diarias (si no existe)
ALTER TABLE ventas_diarias
ADD COLUMN IF NOT EXISTS total_tapers NUMERIC(10,2) NOT NULL DEFAULT 0.00;

-- 3. Actualizar función upsert_ventas_diarias para aceptar tapers
CREATE OR REPLACE FUNCTION upsert_ventas_diarias(
  p_fecha DATE,
  p_ingresos NUMERIC,
  p_comida NUMERIC,
  p_bebidas NUMERIC,
  p_tapers NUMERIC DEFAULT 0
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO ventas_diarias (fecha, total_comandas, total_ingresos, total_comida, total_bebidas, total_tapers)
  VALUES (p_fecha, 1, p_ingresos, p_comida, p_bebidas, p_tapers)
  ON CONFLICT (fecha) DO UPDATE
    SET total_comandas = ventas_diarias.total_comandas + 1,
        total_ingresos = ventas_diarias.total_ingresos + EXCLUDED.total_ingresos,
        total_comida   = ventas_diarias.total_comida   + EXCLUDED.total_comida,
        total_bebidas  = ventas_diarias.total_bebidas  + EXCLUDED.total_bebidas,
        total_tapers   = ventas_diarias.total_tapers   + EXCLUDED.total_tapers,
        updated_at     = now();
END;
$$;
