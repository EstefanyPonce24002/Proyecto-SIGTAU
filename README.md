# SIGTAU — Sistema Integral de Gestión de Tutorías Académicas Universitarias

## 📋 Descripción del Proyecto

**SIGTAU** es una aplicación web diseñada para optimizar la gestión de tutorías académicas universitarias en la Universidad de El Salvador. Permite centralizar las solicitudes de tutoría, la asignación de tutores y asignaturas, la programación de sesiones y el seguimiento del progreso académico, mediante funcionalidades específicas para estudiantes, tutores y coordinadores.

El sistema integra autenticación, control de acceso por roles, notificaciones, mensajería, reportes y herramientas de administración para facilitar la organización y supervisión de las tutorías.

### Problema que resuelve

La gestión de tutorías académicas requiere coordinar estudiantes, tutores, asignaturas, horarios y sesiones, además de mantener un registro de las solicitudes y del seguimiento académico.

**SIGTAU** busca centralizar estos procesos en una plataforma web, reduciendo la gestión dispersa de la información y facilitando la comunicación, el control de horarios y la supervisión de las actividades de tutoría.

### Funcionalidades principales

| Módulo                        | Descripción                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| 🔐 Autenticación y seguridad  | Inicio y cierre de sesión, JWT, control de acceso por roles y contraseñas protegidas con BCrypt. |
| 👨‍🎓 Gestión de estudiantes     | Consulta de asignaturas, tutores y horarios; solicitudes, cancelaciones e historial de tutorías. |
| 👨‍🏫 Gestión de tutores         | Atención de solicitudes, aprobación o rechazo, gestión de horarios y seguimiento académico.      |
| 📚 Asignaturas y tutores      | Administración de asignaturas y asignación de materias a los tutores correspondientes.           |
| 📅 Gestión de sesiones        | Programación, disponibilidad, reprogramación, cancelación y prevención de conflictos de horario. |
| 📝 Seguimiento académico      | Registro de asistencia, observaciones y calificación del progreso del estudiante.                |
| 🔔 Notificaciones             | Avisos relacionados con las solicitudes, las sesiones y los cambios de horario.                  |
| 💬 Mensajería                 | Comunicación entre estudiantes, tutores y coordinadores.                                         |
| 📊 Panel de coordinación      | Indicadores de actividad, supervisión global de sesiones y reportes.                             |
| 📎 Documentos adjuntos        | Incorporación de documentos de apoyo a las solicitudes de tutoría.                               |
| 🔑 Recuperación de contraseña | Restablecimiento mediante tokens temporales de un solo uso y correo configurable.                |

---

## 🏗️ Arquitectura del sistema

SIGTAU utiliza una arquitectura cliente-servidor con separación entre la interfaz de usuario, la lógica de negocio y el acceso a los datos.

El frontend se comunica con el backend mediante una **API REST**. El backend utiliza una organización por capas para separar las responsabilidades y facilitar el mantenimiento y las pruebas.

### Capas principales

| Capa              | Responsabilidad                                                       |
| ----------------- | --------------------------------------------------------------------- |
| **Presentación**  | Interfaz web desarrollada con React y TypeScript.                     |
| **Controladores** | Recepción y gestión de solicitudes HTTP mediante controladores REST.  |
| **Servicios**     | Implementación de las reglas de negocio y validaciones del sistema.   |
| **Persistencia**  | Acceso a los datos y ejecución de operaciones sobre la base de datos. |
| **Modelo**        | Representación de las entidades y estructuras de información.         |
| **Seguridad**     | Autenticación JWT, autorización por roles y protección de recursos.   |

Esta arquitectura permite mantener separadas las responsabilidades de cada componente y facilita la incorporación de nuevas funcionalidades sin concentrar toda la lógica en una sola capa.

---

## 🗄️ Base de datos PostgreSQL

El esquema de la base de datos se encuentra en `database/schema.sql`, mientras que los registros iniciales para desarrollo se encuentran en `database/seed.sql`.

El modelo de datos contempla usuarios, perfiles, asignaturas, horarios, sesiones, seguimiento académico, notificaciones, reportes, recuperación de contraseñas, documentos adjuntos y mensajería.

### Descripción de las entidades principales

| Entidad o área              | Descripción                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| **Usuarios**                | Información general de los usuarios y sus roles.                        |
| **Perfiles de estudiantes** | Información complementaria de los estudiantes.                          |
| **Perfiles de tutores**     | Información complementaria de los tutores.                              |
| **Asignaturas**             | Catálogo de asignaturas y estado de activación.                         |
| **Tutor–Asignatura**        | Relación entre tutores y las asignaturas que pueden atender.            |
| **Horarios**                | Disponibilidad horaria registrada por los tutores.                      |
| **Sesiones**                | Información de las tutorías solicitadas, programadas y gestionadas.     |
| **Seguimiento académico**   | Asistencia, observaciones y calificación del progreso.                  |
| **Notificaciones**          | Avisos generados por los procesos del sistema.                          |
| **Reportes**                | Información utilizada para la supervisión de las tutorías.              |
| **Tokens de recuperación**  | Información necesaria para restablecer contraseñas de forma controlada. |
| **Documentos adjuntos**     | Referencias y datos asociados a los archivos de apoyo.                  |
| **Mensajes**                | Información de la comunicación entre los participantes.                 |

_La tabla anterior es una descripción funcional de las áreas del modelo de datos, no una lista literal de nombres de tablas o columnas._

### Integridad y restricciones

El esquema contempla relaciones, índices y restricciones de integridad para mantener la consistencia de los datos.

En la tabla de sesiones se debe conservar la validación que garantiza que la hora de finalización sea posterior a la hora de inicio:

```sql
CHECK (hora_fin > hora_inicio)
```

Los tipos enumerados de PostgreSQL deben permanecer sincronizados con los valores definidos en el backend. Cualquier modificación de estados o tipos de notificación debe ser compatible con el código fuente y los datos existentes.

---

## 🛠️ Stack tecnológico

| Capa                            | Tecnología                                        |
| ------------------------------- | ------------------------------------------------- |
| **Frontend**                    | React · TypeScript · Vite                         |
| **Backend**                     | Java · Spring Boot                                |
| **Seguridad**                   | Spring Security · JWT · BCrypt                    |
| **Base de datos principal**     | PostgreSQL                                        |
| **Base de datos de desarrollo** | H2 en memoria, mediante el perfil `dev`           |
| **Comunicación**                | API REST mediante HTTP                            |
| **Control de versiones**        | Git · GitHub                                      |
| **Pruebas**                     | Pruebas automatizadas incorporadas al repositorio |

Las versiones concretas de las dependencias deben consultarse en los archivos de configuración del proyecto.

---

## 📁 Estructura del repositorio

```text
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
- Descripción de dificultades y carga de documentos de apoyo (PDF/DOC/DOCX/XLS/XLSX).
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
- Reprogramación de sesiones y notificación de cambio de horario.
- Calendario mensual de sesiones.
- Notificaciones, recordatorios automáticos y mensajería.

### Coordinador
- Gestión de usuarios.
- Gestión y activación/desactivación de asignaturas.
- Asignación de tutores a asignaturas.
- Dashboard con indicadores y actividad real del sistema.
- Supervisión global de sesiones con filtros.
- Generación de reportes.
- Cancelación administrativa de sesiones.
- Mensajería con estudiantes y tutores.
- Reporte de tutorías más solicitadas por asignatura.

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
- documentos adjuntos y mensajes;
- índices y restricciones de integridad.

`database/seed.sql` contiene datos de desarrollo con contraseñas de prueba `password123` mediante BCrypt y fechas compatibles con los horarios definidos.

## Seguridad

- Autenticación mediante JWT.
- Autorización según los roles del sistema.
- Contraseñas protegidas mediante BCrypt.
- Validación de propiedad de recursos en los servicios.
- Validaciones de disponibilidad y reglas de negocio.
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
- `SIGTAU_UPLOAD_DIR`
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


## Respaldo de datos

Los scripts de database/backup.sh, database/restore.sh y database/backup.ps1 permiten crear y restaurar respaldos PostgreSQL en formato custom. Requieren las variables de conexión y DB_PASSWORD; la contraseña no se almacena en el repositorio.

## Nota sobre validación final

La revisión de código y trazabilidad de requisitos se realizó de forma estática. La compilación, ejecución de pruebas automatizadas, validación de PostgreSQL/H2 y pruebas manuales de frontend quedan para la etapa final de validación local.
