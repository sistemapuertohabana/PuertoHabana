-- Add Salary columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS salario_monto NUMERIC(10,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS salario_tipo TEXT CHECK (salario_tipo IN ('diario', 'semanal', 'mensual'));
