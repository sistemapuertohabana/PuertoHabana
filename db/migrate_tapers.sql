-- ============================================================
--  Migración: Permitir categoría 'tapers' en comandas
--  Ejecutar TODO este SQL en el SQL Editor de Supabase
-- ============================================================
--  NOTA: Ejecuta el script COMPLETO de una sola vez.
--  Si ya lo ejecutaste antes y decía OK, ejecútalo de nuevo
--  con esta versión corregida.
-- ============================================================

-- 1. Encontrar y eliminar el CHECK constraint existente en comanda_items.categoria
--    (PostgreSQL le asigna un nombre auto-generado que puede variar)
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  -- Buscar el constraint actual en la columna 'categoria'
  SELECT con.conname INTO v_constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'comanda_items'
    AND con.contype = 'c'
    AND con.conkey::text LIKE '%' || (
      SELECT attnum::text FROM pg_attribute 
      WHERE attrelid = rel.oid AND attname = 'categoria'
    ) || '%';
  
  -- Si encontramos un constraint, lo eliminamos
  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE comanda_items DROP CONSTRAINT %I', v_constraint_name);
    RAISE NOTICE 'Constraint eliminado: %', v_constraint_name;
  ELSE
    RAISE NOTICE 'No se encontró constraint en comanda_items.categoria';
  END IF;
END;
$$;

-- 2. Agregar el nuevo constraint que permite 'tapers'
ALTER TABLE comanda_items
ADD CONSTRAINT comanda_items_categoria_check
  CHECK (categoria IN ('comida','bebidas','tapers'));

-- 3. Agregar columna total_tapers a ventas_diarias (si no existe)
ALTER TABLE ventas_diarias
ADD COLUMN IF NOT EXISTS total_tapers NUMERIC(10,2) NOT NULL DEFAULT 0.00;

-- 4. Actualizar función upsert_ventas_diarias para aceptar tapers
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

-- ============================================================
--  VERIFICACIÓN: Ejecuta estas consultas para confirmar
-- ============================================================
-- SELECT conname, contype, conkey FROM pg_constraint 
-- WHERE conrelid = 'comanda_items'::regclass AND contype = 'c';
-- 
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'ventas_diarias' AND column_name = 'total_tapers';
