#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Uso: ./restore.sh ruta/al/backup.dump"
  exit 1
fi

: "${DB_HOST:=localhost}"
: "${DB_PORT:=5432}"
: "${DB_NAME:=sigtau}"
: "${DB_USER:=sigtau_user}"

PGPASSWORD="${DB_PASSWORD:?DB_PASSWORD es obligatorio}" pg_restore \
  --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" \
  --clean --if-exists --no-owner "$1"

echo "Restauración completada."
