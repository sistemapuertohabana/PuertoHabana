-- Add DNI column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dni TEXT;

-- Safely add new roles to the user_rol enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_rol' AND e.enumlabel = 'ayudante_cocina') THEN
    ALTER TYPE user_rol ADD VALUE 'ayudante_cocina';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_rol' AND e.enumlabel = 'lavaplato') THEN
    ALTER TYPE user_rol ADD VALUE 'lavaplato';
  END IF;
END $$;
