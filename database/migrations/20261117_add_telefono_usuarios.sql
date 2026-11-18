-- SIGTAU: agrega la columna telefono a usuarios.
-- La entidad Usuario.java y schema.sql ya la incluyen, pero no había migración para
-- bases existentes; sin ella el backend no arranca (Schema-validation: missing column [telefono]).
-- Ejecutar una vez sobre BD_SIGTAU. Es seguro repetirlo.
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS telefono VARCHAR(25);
