# SIGTAU — Sistema Integral de Gestión de Tutorías Académicas Universitarias

Universidad de El Salvador · Facultad Multidisciplinaria de Occidente · Equipo 6

Este repositorio contiene la aplicación completa organizada en tres módulos independientes:

```
SIGTAU/
├── frontend/    Vite 6 + React 18 + Tailwind 4 + shadcn/ui (prototipo visual, con correcciones aplicadas)
├── backend/     Spring Boot 3 + Spring Security + JWT (API REST)
└── database/    Script SQL de PostgreSQL (esquema + datos de prueba)
```

## Orden recomendado para levantar el proyecto localmente

1. **Base de datos** (`database/`) — crea el esquema en PostgreSQL, o usa el perfil `dev` del backend (H2 en memoria) para no instalar nada todavía.
2. **Backend** (`backend/`) — API REST en `http://localhost:8080`.
3. **Frontend** (`frontend/`) — interfaz en `http://localhost:5173`, ya configurada para consumir el backend.

Cada carpeta tiene su propio `README.md` con instrucciones detalladas.

## Estado del proyecto

- **Frontend**: 17 pantallas del prototipo Figma Make, con la corrección del estado `EN_CURSO` ya aplicada en `Supervision.tsx` para que coincida con el modelo de datos. Todavía usa datos de prueba en memoria (mock) — no está conectado al backend.
- **Backend**: estructura completa (entidades JPA para las 10 tablas, repositorios, seguridad JWT) con dos módulos de negocio ya implementados como ejemplo: autenticación (RF-01, RF-02, RF-03) y sesiones de tutoría (RF-04, RF-07, RF-09, cancelación). Los demás módulos (horarios, asignaturas, reportes, notificaciones, administración de usuarios) siguen el mismo patrón y quedan por implementar.
- **Base de datos**: esquema v2 corregido, con las 2 tablas nuevas (`tutor_asignatura`, `password_reset_tokens`) y los índices de rendimiento ya incluidos.

## Documentos de referencia

Ver también, en la carpeta de entregables del proyecto:
- Correcciones técnicas al informe de avance
- Diccionario de datos v2 + script SQL
- Matriz de trazabilidad RF ↔ Pantalla ↔ Base de datos
