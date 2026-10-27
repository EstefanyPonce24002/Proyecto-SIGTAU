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
├── backend/
│   └── src/
│       ├── main/
│       │   ├── java/              # Código fuente de Java
│       │   │   └── edu/ues/sigtau/
│       │   │       ├── controller/ # Controladores REST
│       │   │       ├── service/    # Lógica de negocio
│       │   │       ├── model/      # Modelos y entidades
│       │   │       └── ...         # Otros paquetes del backend
│       │   └── resources/          # Configuración y recursos
│       └── test/                   # Pruebas automatizadas
│
├── frontend/
│   ├── src/                        # Código fuente de React
│   └── ...                         # Configuración y dependencias
│
├── database/
│   ├── schema.sql                  # Esquema de PostgreSQL
│   ├── seed.sql                    # Datos iniciales de desarrollo
│   ├── backup.sh                   # Respaldo de PostgreSQL
│   ├── restore.sh                  # Restauración de respaldos
│   └── backup.ps1                  # Respaldo desde PowerShell
│
└── README.md                       # Documentación principal
```

La estructura muestra los componentes principales del repositorio. Los paquetes, archivos y subdirectorios adicionales deben consultarse directamente en el código fuente.

---

## 🚀 Ejecución del sistema

SIGTAU contempla un perfil de desarrollo con H2 en memoria y un perfil de producción orientado a PostgreSQL.

### Prerrequisitos

- **Git** instalado. -**Java** compatible con la configuración del backend.
- **Maven**, si corresponde al mecanismo de construcción configurado.
- **Node.js** y npm compatibles con el frontend.
- **PostgreSQL** para la ejecución con la base de datos principal.
- Variables de entorno configuradas según el perfil seleccionado.

### 1. Clonar el repositorio

```bash
git clone https://github.com/EstefanyPonce24002/Proyecto-SIGTAU.git
cd Proyecto-SIGTAU
```

### 2. Preparar la base de datos

Para utilizar PostgreSQL:

1. Crear o seleccionar la base de datos de desarrollo.
2. Configurar las credenciales de conexión.
3. Revisar y aplicar `database/schema.sql`.
4. Cargar `database/seed.sql` cuando se necesiten los datos iniciales de prueba.

Antes de ejecutar los scripts, se recomienda revisar su contenido y confirmar que se está utilizando la base de datos correcta.

### 3. Ejecutar el backend

Desde el directorio `backend/`, utilizar el mecanismo de construcción y ejecución definido por el proyecto.

El backend debe iniciarse con el perfil adecuado:

- `dev`: para desarrollo con H2 en memoria, según la configuración existente.
- `prod`: para la configuración de PostgreSQL y las variables de entorno correspondientes.

Los comandos específicos deben confirmarse en el archivo `pom.xml` y en la configuración de Spring Boot.

### 4. Ejecutar el frontend

Desde una terminal, ingresar al directorio del frontend:

```bash
cd frontend
npm install
npm run dev
```

La dirección local de acceso será la que indique Vite al iniciar correctamente el servidor de desarrollo.

### 5. Verificar la conexión

Una vez iniciados los componentes, comprobar que:

- El frontend puede comunicarse con la API REST.
- El backend puede conectarse a la base de datos seleccionada.
- El inicio de sesión funciona con usuarios de prueba válidos.
- Las operaciones están restringidas de acuerdo con el rol del usuario.

---

## ⚙️ Variables de entorno

El backend utiliza configuración externa para los datos sensibles y los parámetros dependientes del entorno.

| Variable               | Propósito                                                                     |
| ---------------------- | ----------------------------------------------------------------------------- |
| `JWT_SECRET`           | Secreto para la firma y validación de los JWT.                                |
| `DB_USER`              | Usuario de conexión a PostgreSQL.                                             |
| `DB_PASSWORD`          | Contraseña de conexión a PostgreSQL.                                          |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos para las solicitudes del frontend.                        |
| `FRONTEND_URL`         | Dirección del frontend para los flujos que la requieran.                      |
| `MAIL_FROM`            | Dirección remitente de los correos.                                           |
| `SIGTAU_UPLOAD_DIR`    | Directorio de almacenamiento de documentos.                                   |
| Variables SMTP         | Configuración del servidor de correo cuando se habilita el envío de mensajes. |

Los nombres indicados deben contrastarse con la configuración vigente antes de iniciar el sistema. No deben publicarse contraseñas, tokens ni secretos reales en el repositorio.

---

## 🔌 API REST

El backend expone servicios HTTP que permiten al frontend interactuar con las funcionalidades de SIGTAU.

Los controladores del backend constituyen el punto de entrada de las solicitudes, mientras que los servicios aplican las reglas de negocio y realizan las operaciones correspondientes.

### Áreas funcionales de la API

| Área                        | Operaciones funcionales                                                               |
| --------------------------- | ------------------------------------------------------------------------------------- |
| **Autenticación**           | Inicio y cierre de sesión y procesos relacionados con la recuperación de contraseñas. |
| **Usuarios**                | Consulta y administración de usuarios según los permisos asignados.                   |
| **Asignaturas**             | Consulta, administración y activación o desactivación de asignaturas.                 |
| **Asignaciones de tutores** | Consulta y actualización de las asignaturas asignadas a cada tutor.                   |
| **Horarios**                | Consulta de disponibilidad y gestión de horarios.                                     |
| **Sesiones**                | Solicitud, aprobación, rechazo, reprogramación y cancelación de tutorías.             |
| **Seguimiento**             | Registro de asistencia, observaciones y progreso académico.                           |
| **Notificaciones**          | Consulta y gestión de notificaciones.                                                 |
| **Mensajería**              | Comunicación entre los participantes autorizados.                                     |
| **Reportes**                | Consulta de indicadores e información para la supervisión administrativa.             |

Los endpoints, métodos HTTP, parámetros y permisos específicos deben documentarse a partir de los controladores vigentes. No se incluyen rutas de ejemplo que no hayan sido verificadas en el código fuente.

---

## 🔐 Seguridad y autenticación JWT

SIGTAU utiliza Spring Security y JWT para proteger los recursos que requieren autenticación.

### Flujo general de autenticación

```text
Frontend (React)                Backend (Spring Boot)
       │                                │
       │  Solicitud de inicio de sesión │
       │ ──────────────────────────────>│
       │                                │
       │                         Valida credenciales
       │                         Genera o entrega JWT
       │                                │
       │<───────────────────────────────│
       │       Respuesta de sesión      │
       │                                │
       │  Solicitud a recurso protegido │
       │  con token de autorización     │
       │ ──────────────────────────────>│
       │                                │
       │                         Valida autenticación
       │                         y permisos del usuario
       │                                │
       │<───────────────────────────────│
       │       Respuesta de la API      │
```

### Medidas de seguridad

- Autenticación mediante JWT.
- Autorización según los roles del sistema.
- Contraseñas protegidas mediante BCrypt.
- Validación de propiedad de recursos en los servicios.
- Validaciones de disponibilidad y reglas de negocio.
- Tokens de recuperación temporales y de un solo uso.
- Manejo controlado de tokens inválidos o malformados.
- Configuración de CORS.
- Uso de variables de entorno para secretos y credenciales.

La configuración de seguridad debe revisarse para confirmar que las rutas públicas, las rutas protegidas y los permisos asignados correspondan al comportamiento esperado.

---

## 💾 Respaldo y restauración de datos

El directorio `database/` incluye herramientas para generar y restaurar respaldos de PostgreSQL.

| Archivo      | Función                                              |
| ------------ | ---------------------------------------------------- |
| `backup.sh`  | Genera un respaldo en sistemas compatibles con Bash. |
| `restore.sh` | Permite restaurar un respaldo de PostgreSQL.         |
| `backup.ps1` | Ejecuta el proceso de respaldo desde PowerShell.     |

Los scripts utilizan la configuración de conexión y las variables de entorno previstas para el entorno correspondiente.

Antes de restaurar un respaldo, se recomienda verificar el archivo, la base de datos de destino y las opciones de restauración, ya que el proceso puede modificar los datos existentes.

---

## 🧪 Pruebas y validación

El repositorio incorpora pruebas automatizadas, incluidas pruebas de servicios, destinadas a verificar el comportamiento de parte de la lógica de negocio.

La validación integral debe incluir:

- Compilación del backend.
- Ejecución de las pruebas automatizadas.
- Compilación y ejecución del frontend.
- Verificación de la conexión con PostgreSQL.
- Validación del perfil de desarrollo con H2.
- Pruebas de autenticación y autorización por roles.
- Pruebas de solicitudes, aprobaciones, rechazos y cancelaciones.
- Validación de asignaturas y asignaciones de tutores.
- Comprobación de disponibilidad y prevención de solapamientos.
- Pruebas de notificaciones, mensajería y recuperación de contraseñas.
- Validación de los procesos de respaldo y restauración.

**Estado de validación:** la revisión estática del código no equivale a una compilación exitosa ni demuestra que todas las pruebas hayan pasado. Los resultados deben registrarse después de ejecutar las verificaciones en un entorno con las dependencias y servicios necesarios.

---

## 📸 Evidencias de funcionamiento

En esta sección se pueden incorporar capturas reales de la aplicación para documentar las principales funcionalidades.

Se recomienda organizar las evidencias de la siguiente manera:

### Inicio de sesión y seguridad

- Pantalla de inicio de sesión.
- Acceso a las funcionalidades según el rol.
- Recuperación y restablecimiento de contraseña.

### Gestión académica

- Administración de usuarios.
- Catálogo de asignaturas.
- Asignación de materias a tutores.
- Gestión de horarios.

### Gestión de tutorías

- Solicitud de tutoría.
- Aprobación y rechazo de solicitudes.
- Reprogramación y cancelación de sesiones.
- Registro de asistencia y seguimiento académico.

### Supervisión y reportes

- Dashboard del coordinador.
- Supervisión global de sesiones.
- Reportes e indicadores.

Las imágenes deben añadirse cuando las capturas estén disponibles y correspondan a funcionalidades verificadas.

---

## 👥 Equipo de desarrollo

**Equipo 6**

Proyecto académico desarrollado en la Universidad de El Salvador, Facultad Multidisciplinaria de Occidente.

---

## Licencia y uso académico

SIGTAU es un proyecto académico orientado a la gestión integral de tutorías universitarias.

---

## 🏛️ Información institucional

| Campo              | Información                                                       |
| ------------------ | ----------------------------------------------------------------- |
| **Institución**    | Universidad de El Salvador                                        |
| **Facultad**       | Facultad Multidisciplinaria de Occidente                          |
| **Proyecto**       | Sistema Integral de Gestión de Tutorías Académicas Universitarias |
| **Identificación** | SIGTAU                                                            |
| **Equipo**         | 6                                                                 |
