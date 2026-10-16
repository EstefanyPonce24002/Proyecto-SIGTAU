# SIGTAU — Base de datos

PostgreSQL 14+

## Archivos

- `schema.sql` — esquema de referencia **NO CANÓNICO**, pendiente de cotejo con el respaldo oficial. Conserva los ENUM y las restricciones actuales; no debe tratarse como definición oficial ni usarse para despliegues productivos hasta validar la equivalencia.
- `seed.sql` — datos de prueba mínimos para desarrollo local. Ejecutarlo únicamente después de validar y crear el esquema correspondiente.

## Crear la base de datos desde cero

```bash
# 1. Crear la base de datos (una sola vez)
createdb sigtau

# 2. Crear el esquema
# Solo para pruebas aisladas: este script aún no es canónico.
psql -d sigtau -f schema.sql

# 3. (Opcional) Cargar datos de prueba
psql -d sigtau -f seed.sql
```

## Nota sobre desarrollo diario

Si solo quieres levantar el **backend** para programar sin instalar PostgreSQL, usa el perfil `dev` del backend (ver `backend/README.md`), que corre con una base H2 en memoria y no necesita este script — Hibernate genera el esquema automáticamente a partir de las entidades Java. **No uses `schema.sql` como fuente oficial de producción** hasta cotejarlo con el respaldo oficial. Antes de despliegues PostgreSQL, restaura/valida el respaldo oficial y confirma la compatibilidad con las entidades del backend.

## Estado de validación

El archivo `schema.sql` se conserva como referencia provisional, no como fuente canónica. El respaldo oficial prevalece hasta completar el cotejo. La restricción `CHECK (hora_fin > hora_inicio)` en `sesiones` se mantiene pendiente de una decisión funcional; no debe retirarse automáticamente.

## Cambios respecto al diccionario de datos original (informe de avance)

- Se agregó la tabla `tutor_asignatura` (relación N:M).
- Se agregó la columna `id_horario` en `sesiones`.
- Se eliminó la columna duplicada en `estudiante`.
- Se definió la longitud del campo `contrasena` (255).
- Se agregó la tabla `password_reset_tokens`, necesaria para RF-03.
- Se agregaron los índices de rendimiento.

Detalle completo en el documento "Diccionario de Datos v2 + Script SQL" entregado junto con este proyecto.


## Respaldo y restauración

Para PostgreSQL se incluyen scripts reproducibles:

- Linux/macOS: `./backup.sh` crea un archivo `custom dump` en `./backups`.
- Linux/macOS: `./restore.sh backups/sigtau_YYYYMMDD_HHMMSS.dump` restaura un respaldo.
- Windows PowerShell: `./backup.ps1`.

Los scripts usan `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`. No se guarda la contraseña en el repositorio.
