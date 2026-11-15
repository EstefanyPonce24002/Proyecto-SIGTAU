-- SIGTAU: sincronizar la secuencia global de códigos de tutores
-- Considera tanto los códigos históricos (CO0001, MR0001, etc.)
-- como los códigos actuales (TUT-0001), sin modificar los registros.

BEGIN;

SELECT setval(
    'seq_codigo_tutor',
    GREATEST(
        COALESCE(
            (
                SELECT MAX(SUBSTRING(codigo_tutor FROM '[0-9]+$')::BIGINT)
                FROM tutores
                WHERE codigo_tutor ~ '[0-9]+$'
            ),
            1
        ),
        1
    ),
    EXISTS (
        SELECT 1
        FROM tutores
        WHERE codigo_tutor ~ '[0-9]+$'
    )
);

COMMIT;
