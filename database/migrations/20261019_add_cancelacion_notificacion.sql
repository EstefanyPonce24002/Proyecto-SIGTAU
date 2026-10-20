-- Agrega el tipo CANCELACION a las notificaciones.
-- El backend (TipoNotificacion.java) ya lo usa, pero el respaldo sigtau_backup.sql no lo incluye,
-- por lo que cancelar una sesión fallaba al guardar la notificación.
-- Ejecutar una vez sobre BD_SIGTAU (pgAdmin > Query Tool). Es seguro repetirlo.
ALTER TYPE public.tipo_notificacion_enum ADD VALUE IF NOT EXISTS 'CANCELACION';
