-- ============================================================
--  Puerto Habana — Migración: Campo turno en inventario
--  Agrega columna 'turno' (mañana/tarde) a la tabla inventario
-- ============================================================

ALTER TABLE inventario
ADD COLUMN IF NOT EXISTS turno TEXT CHECK (turno IN ('manana', 'tarde', 'ambos')) DEFAULT 'ambos';

-- Actualizar items existentes con un valor por defecto
UPDATE inventario SET turno = 'ambos' WHERE turno IS NULL;
