param(
  [string]$BackupDir = ".\backups"
)

$ErrorActionPreference = "Stop"

if (-not $env:DB_PASSWORD) { throw "DB_PASSWORD es obligatorio." }

$hostName = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$port = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "sigtau" }
$dbUser = if ($env:DB_USER) { $env:DB_USER } else { "sigtau_user" }

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$output = Join-Path $BackupDir "sigtau_$timestamp.dump"

& pg_dump --host=$hostName --port=$port --username=$dbUser --format=custom --file=$output $dbName
Write-Host "Backup creado: $output"
