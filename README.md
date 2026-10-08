# SIGTAU — Sistema Integral de Gestión de Tutorías Académicas Universitarias

Universidad de El Salvador · Facultad Multidisciplinaria de Occidente · Equipo 6

SIGTAU es una aplicación web para gestionar tutorías académicas, solicitudes de estudiantes, aprobación y seguimiento por tutores y supervisión/administración por coordinadores.

## Estructura

```
SIGTAU/
├── frontend/    React + Vite
├── backend/     Spring Boot + Spring Security + JWT
└── database/    PostgreSQL: esquema y datos de desarrollo
```

## Funcionalidades implementadas

### Estudiante
- Inicio de sesión y cierre de sesión.
- Consulta de asignaturas, tutores y horarios disponibles.
- Solicitud de tutoría con validación de tutor, asignatura, horario, fecha y disponibilidad.
- Historial y detalle de tutorías.
- Cancelación de sesiones.
- Notificaciones.
- Perfil y cambio de contraseña.
- Recuperación y restablecimiento de contraseña mediante token de un solo uso y correo configurable.

### Tutor
- Consulta de solicitudes pendientes.
- Aprobación o rechazo de solicitudes.
- Visualización de las dificultades declaradas por el estudiante.
- Gestión de horarios propios.
- Validación de propiedad, disponibilidad y solapamientos.
- Registro de asistencia, observaciones y calificación de progreso.
- Historial de tutorías.
- Notificaciones de cambios relevantes.

### Coordinador
- Gestión de usuarios.
- Gestión y activación/desactivación de asignaturas.
- Asignación de tutores a asignaturas.
- Dashboard con indicadores y actividad real del sistema.
- Supervisión global de sesiones con filtros.
- Generación de reportes.
- Cancelación administrativa de sesiones.

## Base de datos

El esquema PostgreSQL se encuentra en `database/schema.sql`.

Incluye:
- usuarios y roles;
- perfiles de estudiantes y tutores;
- asignaturas y relación tutor–asignatura;
- horarios;
- sesiones y seguimiento;
- notificaciones;
- reportes;
- tokens de recuperación de contraseña;
- índices y restricciones de integridad.

`database/seed.sql` contiene datos de desarrollo con contraseñas de prueba `password123` mediante BCrypt y fechas compatibles con los horarios definidos.

## Seguridad

- Autenticación mediante JWT.
- Contraseñas almacenadas con BCrypt.
- Autorización por rol.
- Validación de propiedad de recursos en servicios.
- Tokens de recuperación temporales y de un solo uso.
- JWT inválidos o malformados no se convierten en errores internos.
- Configuración de secretos productivos mediante variables de entorno.
- CORS configurable.

## Ejecución local

El backend dispone de un perfil `dev` con H2 en memoria y un perfil `prod` para PostgreSQL.

Las variables sensibles de producción deben configurarse mediante entorno, entre ellas:
- `JWT_SECRET`
- `DB_USER`
- `DB_PASSWORD`
- `CORS_ALLOWED_ORIGINS`
- `FRONTEND_URL`
- `MAIL_FROM`
- variables SMTP cuando se utilice recuperación por correo.

Las instrucciones específicas de frontend y backend se mantienen en sus respectivos directorios.

## Estado de pruebas

Las pruebas automatizadas existentes y las nuevas pruebas de servicios están incorporadas al repositorio.

**La ejecución local de Maven/Vite no se realizó en esta revisión porque el entorno de ejecución disponible no tiene acceso de red para clonar/obtener el proyecto y sus dependencias.** Por tanto, no se declara aquí una compilación o suite de pruebas exitosa.

## Documentación de referencia

Consultar los documentos del proyecto relacionados con:
- requisitos funcionales;
- matriz de trazabilidad;
- diccionario de datos;
- correcciones técnicas del informe de avance.
