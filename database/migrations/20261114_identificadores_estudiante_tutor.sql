-- SIGTAU: identificadores automáticos para estudiantes y tutores
-- Ejecutar una sola vez sobre una base de datos existente, antes de desplegar
-- la versión del backend que genera los identificadores.

BEGIN;

-- Secuencias independientes para evitar colisiones entre perfiles.
CREATE SEQUENCE IF NOT EXISTS seq_carnet_estudiante START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_tutor START WITH 1 INCREMENT BY 1;

-- Agregar el código de tutor sin exigirlo todavía para permitir el backfill.
ALTER TABLE tutores
    ADD COLUMN IF NOT EXISTS codigo_tutor VARCHAR(20);

-- Asignar códigos a los tutores existentes que aún no tienen uno.
WITH tutores_sin_codigo AS (
    SELECT id_tutor,
           ROW_NUMBER() OVER (ORDER BY id_tutor) AS correlativo
    FROM tutores
    WHERE codigo_tutor IS NULL
)
UPDATE tutores t
SET codigo_tutor = 'TUT-' || LPAD(ts.correlativo::TEXT, 4, '0')
FROM tutores_sin_codigo ts
WHERE t.id_tutor = ts.id_tutor;

-- Garantizar unicidad y obligatoriedad después de completar los registros.
CREATE UNIQUE INDEX IF NOT EXISTS uk_tutores_codigo_tutor
    ON tutores(codigo_tutor);

ALTER TABLE tutores
    ALTER COLUMN codigo_tutor SET NOT NULL;

-- Continuar los correlativos después del mayor sufijo numérico ya utilizado.
-- Se conservan sin cambios los carnés actuales de los estudiantes.
SELECT setval(
    'seq_carnet_estudiante',
    COALESCE(
        MAX((SUBSTRING(carnet FROM '[0-9]+

SELECT setval(
    'seq_codigo_tutor',
    COALESCE(MAX((SUBSTRING(codigo_tutor FROM '[0-9]+$'))::BIGINT), 1),
    COUNT(codigo_tutor) > 0
)
FROM tutores;

COMMIT;
))::BIGINT)
            FILTER (WHERE carnet ~ '^[A-Z]{2}[0-9]+

SELECT setval(
    'seq_codigo_tutor',
    COALESCE(MAX((SUBSTRING(codigo_tutor FROM '[0-9]+$'))::BIGINT), 1),
    COUNT(codigo_tutor) > 0
)
FROM tutores;

COMMIT;
),
        1
    ),
    COUNT(*) FILTER (WHERE carnet ~ '^[A-Z]{2}[0-9]+

SELECT setval(
    'seq_codigo_tutor',
    COALESCE(MAX((SUBSTRING(codigo_tutor FROM '[0-9]+$'))::BIGINT), 1),
    COUNT(codigo_tutor) > 0
)
FROM tutores;

COMMIT;
) > 0
)
FROM estudiante;

SELECT setval(
    'seq_codigo_tutor',
    COALESCE(MAX((SUBSTRING(codigo_tutor FROM '[0-9]+$'))::BIGINT), 1),
    COUNT(codigo_tutor) > 0
)
FROM tutores;

COMMIT;
