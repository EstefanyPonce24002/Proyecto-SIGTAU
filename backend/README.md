# SIGTAU — Backend

Spring Boot 3.3 · Java 17 · Spring Security + JWT · Spring Data JPA

## Requisitos

- Java 17 o superior (`java -version`)
- Maven (o usa el wrapper `./mvnw` si lo agregas con `mvn wrapper:wrapper`)
- PostgreSQL 14+ solo para el perfil `prod`. Para desarrollo diario **no hace falta instalar nada**: el perfil `dev` usa una base H2 en memoria.

## Arrancar en modo desarrollo (H2 en memoria, recomendado para empezar)

```bash
cd backend
mvn spring-boot:run
```

Por defecto corre con el perfil `dev` (definido en `application.yml`), que:
- Crea el esquema automáticamente a partir de las entidades Java (`ddl-auto: create-drop`)
- No requiere PostgreSQL instalado
- Expone una consola web de la base de datos en `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:sigtau`, usuario `sa`, sin contraseña)

La API queda disponible en `http://localhost:8080`.

## Arrancar contra PostgreSQL real (perfil prod)

1. Crea la base de datos y ejecuta `database/schema.sql` (y opcionalmente `database/seed.sql`).
2. Define las variables de entorno:
   ```bash
   export DB_USER=sigtau_user
   export DB_PASSWORD=tu_password
   ```
3. Arranca con el perfil `prod`:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=prod
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

- Cambia `sigtau.jwt.secret` en `application.yml` por un secreto real (nunca lo dejes en el repositorio en texto plano — usa variables de entorno).
- Implementa el envío real de correos en `AuthService` (el TODO marcado para `solicitarRecuperacion`).
- Ajusta `sigtau.cors.allowed-origins` al dominio real del frontend en producción.
