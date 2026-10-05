-- =========================================================
-- SIGTAU - Script de creación de base de datos (PostgreSQL)
-- Versión 2.0 - Incluye correcciones respecto al diccionario
-- de datos original (informe de primer avance, 07/06/2026)
-- =========================================================

-- ---------------------------------------------------------
-- Tipos ENUM
-- ---------------------------------------------------------
CREATE TYPE rol_usuario_enum AS ENUM ('ESTUDIANTE', 'TUTOR', 'COORDINADOR');

CREATE TYPE dia_semana_enum AS ENUM ('LUNES','MARTES','MIERCOLES','JUEVES','VIERNES');

CREATE TYPE estado_sesion_enum AS ENUM (
    'PENDIENTE', 'APROBADA', 'RECHAZADA', 'COMPLETADA', 'CANCELADA'
);

CREATE TYPE tipo_notificacion_enum AS ENUM (
    'APROBACION', 'RECHAZO', 'CAMBIO_HORARIO', 'RECORDATORIO', 'OBSERVACION'
);

CREATE TYPE tipo_reporte_enum AS ENUM (
    'ASISTENCIA', 'RENDIMIENTO', 'ESTADISTICAS', 'POR_TUTOR'
);

-- ---------------------------------------------------------
-- Tabla 1: usuarios
-- ---------------------------------------------------------
CREATE TABLE usuarios (
    id_usuario      SERIAL PRIMARY KEY,
    nombres         VARCHAR(100) NOT NULL,
    apellidos       VARCHAR(50)  NOT NULL,
    correo          VARCHAR(150) NOT NULL UNIQUE,
    contrasena      VARCHAR(255) NOT NULL,          -- [CORREGIDO] longitud definida (hash BCrypt)
    rol_usuario     rol_usuario_enum NOT NULL,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Tabla 2: estudiante  [CORREGIDO: se eliminó FK duplicada]
-- ---------------------------------------------------------
CREATE TABLE estudiante (
    id_estudiante   INT PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    carnet          VARCHAR(20) NOT NULL UNIQUE,
    carrera         VARCHAR(150),
    ciclo_actual    SMALLINT
);

-- ---------------------------------------------------------
-- Tabla 3: tutores
-- ---------------------------------------------------------
CREATE TABLE tutores (
    id_tutor            INT PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    especialidad        VARCHAR(200),
    descripcion_perfil  TEXT,
    fecha_vinculacion   DATE
);

-- ---------------------------------------------------------
-- Tabla 4: asignaturas
-- ---------------------------------------------------------
CREATE TABLE asignaturas (
    id_asignatura  SERIAL PRIMARY KEY,
    nombre         VARCHAR(150) NOT NULL,
    codigo         VARCHAR(20) UNIQUE,
    descripcion    TEXT,
    activa         BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------
-- Tabla 5: tutor_asignatura  [NUEVA] relación N:M
-- ---------------------------------------------------------
CREATE TABLE tutor_asignatura (
    id_tutor       INT NOT NULL REFERENCES tutores(id_tutor) ON DELETE CASCADE,
    id_asignatura  INT NOT NULL REFERENCES asignaturas(id_asignatura) ON DELETE CASCADE,
    PRIMARY KEY (id_tutor, id_asignatura)
);

-- ---------------------------------------------------------
-- Tabla 6: horarios
-- ---------------------------------------------------------
CREATE TABLE horarios (
    id_horario   SERIAL PRIMARY KEY,
    id_tutor     INT NOT NULL REFERENCES tutores(id_tutor) ON DELETE CASCADE,
    dia_semana   dia_semana_enum NOT NULL,
    hora_inicio  TIME NOT NULL,
    hora_fin     TIME NOT NULL,
    disponible   BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK (hora_fin > hora_inicio)
);

-- ---------------------------------------------------------
-- Tabla 7: sesiones  [CORREGIDO: se agregó id_horario]
-- ---------------------------------------------------------
CREATE TABLE sesiones (
    id_sesion              SERIAL PRIMARY KEY,
    id_estudiante          INT NOT NULL REFERENCES estudiante(id_estudiante),
    id_tutor               INT NOT NULL REFERENCES tutores(id_tutor),
    id_asignatura          INT NOT NULL REFERENCES asignaturas(id_asignatura),
    id_horario             INT REFERENCES horarios(id_horario),   -- [NUEVO]
    fecha_sesion           DATE NOT NULL,
    hora_inicio            TIME NOT NULL,
    hora_fin               TIME NOT NULL,
    estado                 estado_sesion_enum NOT NULL DEFAULT 'PENDIENTE',
    descripcion_dificultades TEXT,           -- [CORREGIDO] faltaba: la descripción que el estudiante escribe al solicitar (RF-04)
    observaciones_tutor    TEXT,
    calificacion_progreso  DECIMAL(3,1) CHECK (calificacion_progreso BETWEEN 0.0 AND 10.0),
    asistencia             BOOLEAN,
    fecha_solicitud        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Tabla 8: notificaciones
-- ---------------------------------------------------------
CREATE TABLE notificaciones (
    id_notificacion  SERIAL PRIMARY KEY,
    id_usuario       INT NOT NULL REFERENCES usuarios(id_usuario),
    id_sesion        INT NOT NULL REFERENCES sesiones(id_sesion),
    tipo             tipo_notificacion_enum NOT NULL,
    mensaje          TEXT NOT NULL,
    leida            BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_envio      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Tabla 9: reportes
-- ---------------------------------------------------------
CREATE TABLE reportes (
    id_reporte        SERIAL PRIMARY KEY,
    id_coordinador    INT NOT NULL REFERENCES usuarios(id_usuario),
    tipo_reporte      tipo_reporte_enum NOT NULL,
    fecha_generacion  TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_inicio      DATE,
    fecha_fin         DATE,
    filtro_carrera    VARCHAR(150),
    ruta_archivo      VARCHAR(255)
);

-- ---------------------------------------------------------
-- Tabla 10: password_reset_tokens  [NUEVA - requerida por RF-03]
-- Token temporal de un solo uso para recuperación de contraseña.
-- ---------------------------------------------------------
CREATE TABLE password_reset_tokens (
    id_token     SERIAL PRIMARY KEY,
    id_usuario   INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    token        VARCHAR(255) NOT NULL UNIQUE,
    usado        BOOLEAN NOT NULL DEFAULT FALSE,
    expira_en    TIMESTAMP NOT NULL,
    creado_en    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Índices recomendados (RNF de rendimiento)
-- ---------------------------------------------------------
CREATE INDEX idx_sesiones_estudiante  ON sesiones(id_estudiante);
CREATE INDEX idx_sesiones_tutor       ON sesiones(id_tutor);
CREATE INDEX idx_sesiones_estado      ON sesiones(estado);
CREATE INDEX idx_sesiones_horario     ON sesiones(id_horario);
CREATE INDEX idx_horarios_tutor       ON horarios(id_tutor);
CREATE INDEX idx_tutasig_asignatura   ON tutor_asignatura(id_asignatura);
CREATE INDEX idx_notif_usuario_leida  ON notificaciones(id_usuario, leida);
CREATE INDEX idx_reportes_coordinador ON reportes(id_coordinador);
CREATE INDEX idx_reset_token          ON password_reset_tokens(token);
