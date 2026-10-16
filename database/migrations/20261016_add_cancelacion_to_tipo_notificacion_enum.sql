-- SIGTAU
-- Compatibilidad: el respaldo oficial puede no incluir CANCELACION.
-- Ejecutar una sola vez contra la base SIGTAU correspondiente.
-- IF NOT EXISTS permite repetir el script sin error si el valor ya existe.

ALTER TYPE public.tipo_notificacion_enum
    ADD VALUE IF NOT EXISTS 'CANCELACION';

-- Verificación posterior:
-- SELECT e.enumlabel
-- FROM pg_type t
-- JOIN pg_enum e ON e.enumtypid = t.oid
-- JOIN pg_namespace n ON n.oid = t.typnamespace
-- WHERE n.nspname = 'public'
--   AND t.typname = 'tipo_notificacion_enum'
-- ORDER BY e.enumsortorder;
