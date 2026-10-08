#!/usr/bin/env bash
set -euo pipefail

: "${DB_HOST:=localhost}"
: "${DB_PORT:=5432}"
: "${DB_NAME:=sigtau}"
: "${DB_USER:=sigtau_user}"
: "${BACKUP_DIR:=./backups}"

mkdir -p "$BACKUP_DIR"
timestamp="$(date +%Y%m%d_%H%M%S)"
output="$BACKUP_DIR/sigtau_${timestamp}.dump"

PGPASSWORD="${DB_PASSWORD:?DB_PASSWORD es obligatorio}" pg_dump \
  --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
  --format=custom --file="$output" "$DB_NAME"

echo "Backup creado: $output"
