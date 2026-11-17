-- SIGTAU: identificadores automáticos para estudiantes y tutores
-- Ejecutar una sola vez sobre una base de datos existente.
-- Esta migración conserva los carnés actuales y asigna códigos a tutores existentes.

BEGIN;

CREATE SEQUENCE IF NOT EXISTS seq_carnet_estudiante START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_tutor START WITH 1 INCREMENT BY 1;

ALTER TABLE tutores
    ADD COLUMN IF NOT EXISTS codigo_tutor VARCHAR(20);

-- Asignar un código a cada tutor existente que todavía no tenga uno.
WITH tutores_sin_codigo AS (
    SELECT id_tutor,
           ROW_NUMBER() OVER (ORDER BY id_tutor) AS correlativo
    FROM tutores
    WHERE codigo_tutor IS NULL
)
UPDATE tutores AS t
SET codigo_tutor = 'TUT-' || LPAD(ts.correlativo::TEXT, 4, '0')
FROM tutores_sin_codigo AS ts
WHERE t.id_tutor = ts.id_tutor;

CREATE UNIQUE INDEX IF NOT EXISTS uk_tutores_codigo_tutor
    ON tutores (codigo_tutor);

ALTER TABLE tutores
    ALTER COLUMN codigo_tutor SET NOT NULL;

-- Ajustar la secuencia estudiantil al mayor correlativo existente con el nuevo formato.
SELECT setval(
    'seq_carnet_estudiante',
    COALESCE(
        (SELECT MAX(SUBSTRING(carnet FROM '[0-9]+$')::BIGINT)
         FROM estudiante
         WHERE carnet ~ '^[A-Z]{2}[0-9]+$'),
        1
    ),
    EXISTS (
        SELECT 1
        FROM estudiante
        WHERE carnet ~ '^[A-Z]{2}[0-9]+$'
    )
);

-- Ajustar la secuencia de tutores al mayor correlativo asignado.
SELECT setval(
    'seq_codigo_tutor',
    COALESCE(
        (SELECT MAX(SUBSTRING(codigo_tutor FROM '[0-9]+$')::BIGINT)
         FROM tutores
         WHERE codigo_tutor ~ '^TUT-[0-9]+$'),
        1
    ),
    EXISTS (
        SELECT 1
        FROM tutores
        WHERE codigo_tutor ~ '^TUT-[0-9]+$'
    )
);

COMMIT;
