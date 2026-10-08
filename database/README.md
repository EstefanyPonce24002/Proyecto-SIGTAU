# SIGTAU — Base de datos

PostgreSQL 14+

## Archivos

- `schema.sql` — crea las 12 tablas, los tipos ENUM y los índices de rendimiento. Es la versión corregida (v2) del diccionario de datos original.
- `seed.sql` — datos de prueba mínimos (3 usuarios, 1 estudiante, 1 tutor, asignaturas, horario y una sesión de ejemplo) para desarrollo local. Ejecutar **después** de `schema.sql`.

## Crear la base de datos desde cero

```bash
# 1. Crear la base de datos (una sola vez)
createdb sigtau

# 2. Crear el esquema
psql -d sigtau -f schema.sql

# 3. (Opcional) Cargar datos de prueba
psql -d sigtau -f seed.sql
```

## Nota sobre desarrollo diario

Si solo quieres levantar el **backend** para programar sin instalar PostgreSQL, usa el perfil `dev` del backend (ver `backend/README.md`), que corre con una base H2 en memoria y no necesita este script — Hibernate genera el esquema automáticamente a partir de las entidades Java. Usa `schema.sql` cuando trabajes contra PostgreSQL real o para el despliegue final.

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
