-- Migración de tipo_reporte_enum para SIGTAU.
-- Ejecutar una sola vez en una base de datos que todavía tenga POR_TUTOR y DEMANDA.
-- Conserva los reportes históricos convirtiendo los valores anteriores a los nuevos.
-- La columna reportes.tipo_reporte es la única dependencia conocida de este enum.

CREATE TYPE tipo_reporte_enum_nuevo AS ENUM (
    'ASISTENCIA',
    'RENDIMIENTO',
    'ESTADISTICAS',
    'TUTORIAS_POR_CARRERA',
    'ESTUDIANTES_ATENDIDOS',
    'TUTORIAS_MAS_SOLICITADAS'
);

ALTER TABLE reportes
    ALTER COLUMN tipo_reporte TYPE tipo_reporte_enum_nuevo
    USING (
        CASE tipo_reporte::text
            WHEN 'POR_TUTOR' THEN 'TUTORIAS_POR_CARRERA'
            WHEN 'DEMANDA' THEN 'TUTORIAS_MAS_SOLICITADAS'
            ELSE tipo_reporte::text
        END
    )::tipo_reporte_enum_nuevo;

DROP TYPE tipo_reporte_enum;
ALTER TYPE tipo_reporte_enum_nuevo RENAME TO tipo_reporte_enum;
