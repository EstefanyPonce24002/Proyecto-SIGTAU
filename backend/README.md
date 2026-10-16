# SIGTAU — Backend

Spring Boot 3.3 · Java 17 (bytecode objetivo) · Spring Security + JWT · Spring Data JPA

## Requisitos

- JDK 17 o superior. El proyecto compila para Java 17; un JDK 21 puede compilar y ejecutar bytecode Java 17.
- Maven (o agrega Maven Wrapper si el proyecto lo necesita).
- PostgreSQL 14+ para desarrollo local y producción.

## Arrancar en desarrollo con PostgreSQL

El perfil `dev` se activa automáticamente cuando no se indica otro perfil. Por defecto, conecta con `BD_SIGTAU` en `localhost:5432` y valida el esquema existente; **no crea, borra ni modifica tablas** (`ddl-auto: validate`).

En PowerShell, configura las credenciales y el secreto JWT antes de iniciar:

```powershell
$env:DB_USER = "sigtau_user"
$env:DB_PASSWORD = "TU_PASSWORD"
$env:JWT_SECRET = "REEMPLAZA_POR_UN_SECRETO_SEGURO"
# Opcional: si la base o el puerto son diferentes
# $env:DB_URL = "jdbc:postgresql://localhost:5432/BD_SIGTAU"

mvn spring-boot:run
```

Si tu usuario, contraseña, nombre de base o puerto son diferentes, usa los valores de tu instalación mediante `DB_USER`, `DB_PASSWORD` y `DB_URL`. No compartas ni guardes contraseñas o secretos reales en GitHub.

La API queda disponible en `http://localhost:8080`.

Si el arranque muestra `Schema-validation: missing table`, detén la ejecución y verifica que `DB_URL` apunte a la base correcta y que el esquema oficial contenga esa tabla. No desactives la validación ni ejecutes scripts de creación contra datos reales como solución automática.

## Arrancar contra PostgreSQL de producción (perfil prod)

1. Usa la base restaurada/preparada desde el **respaldo oficial** y confirma que su esquema sea compatible con las entidades JPA. `database/schema.sql` está marcado como NO CANÓNICO; no lo uses en producción hasta cotejarlo con ese respaldo. No ejecutes `database/seed.sql` contra datos reales.
2. Configura las variables de entorno en PowerShell:

   ```powershell
   $env:DB_URL = "jdbc:postgresql://localhost:5432/sigtau"
   $env:DB_USER = "sigtau_user"
   $env:DB_PASSWORD = "TU_PASSWORD"
   $env:JWT_SECRET = "REEMPLAZA_POR_UN_SECRETO_SEGURO"
   ```

3. Arranca explícitamente con el perfil `prod`:

   ```powershell
   mvn spring-boot:run "-Dspring-boot.run.profiles=prod"
   ```

## Endpoints implementados hasta ahora

| Método | Ruta | RF | Descripción |
|---|---|---|---|
| POST | `/api/auth/registro` | RF-01 | Registrar usuario |
| POST | `/api/auth/login` | RF-02 | Iniciar sesión (devuelve JWT) |
| POST | `/api/auth/forgot-password` | RF-03 | Solicitar enlace de recuperación |
| POST | `/api/auth/reset-password` | RF-03 | Confirmar nueva contraseña con el token |
| POST | `/api/sesiones` | RF-04 | Solicitar tutoría |
| PATCH | `/api/sesiones/{id}/resolver?aprobar=true\|false` | RF-07 | Aprobar/rechazar solicitud |
| PATCH | `/api/sesiones/{id}/cancelar` | — | Cancelar sesión (PENDIENTE o APROBADA) |
| GET | `/api/sesiones/estudiante/{id}` | RF-09 | Historial del estudiante |
| GET | `/api/sesiones/tutor/{id}` | RF-09 | Historial del tutor |

Los demás módulos (RF-05, RF-06, RF-08, RF-10, RF-11, RF-12) siguen el mismo patrón de capas (`model` → `repository` → `service` → `controller`) y pueden agregarse siguiendo `SesionService` / `SesionController` como plantilla.

## Configuración importante antes de producción

- Mantén `sigtau.jwt.secret` configurado mediante una variable de entorno; nunca guardes el secreto real en el repositorio.
- Implementa el envío real de correos en `AuthService` (el TODO marcado para `solicitarRecuperacion`).
- Ajusta `sigtau.cors.allowed-origins` al dominio real del frontend en producción.
