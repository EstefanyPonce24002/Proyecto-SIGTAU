-- =========================================================
-- SIGTAU - Datos de prueba (seed) para desarrollo local
-- Ejecutar DESPUÉS de schema.sql
-- Contraseña de los usuarios de prueba: "password123".
-- Este hash BCrypt corresponde a esa contraseña.
-- =========================================================

-- Usuarios base
INSERT INTO usuarios (nombres, apellidos, correo, contrasena, rol_usuario) VALUES
('María Alejandra', 'Gómez',    'maria.gomez@universidad.edu.sv',      '$2a$10$7EqJtq98hPqEX7fNZaFWoO7xG3KjY2V9hM5dQ8cR1L6T0wE3uS4iG', 'ESTUDIANTE'),
('Andrés',          'Ramírez',  'andres.ramirez@universidad.edu.sv',   '$2a$10$7EqJtq98hPqEX7fNZaFWoO7xG3KjY2V9hM5dQ8cR1L6T0wE3uS4iG', 'TUTOR'),
('Coordinación',    'Académica','coordinacion@universidad.edu.sv',     '$2a$10$7EqJtq98hPqEX7fNZaFWoO7xG3KjY2V9hM5dQ8cR1L6T0wE3uS4iG', 'COORDINADOR');

-- Estudiante
INSERT INTO estudiante (id_estudiante, carnet, carrera, ciclo_actual) VALUES
(1, '20230187', 'Ingeniería en Desarrollo de Software', 5);

-- Tutor
INSERT INTO tutores (id_tutor, especialidad, descripcion_perfil, fecha_vinculacion) VALUES
(2, 'Matemáticas y Programación', 'Docente con 8 años de experiencia en cálculo y algoritmos.', '2023-01-15');

-- Asignaturas
INSERT INTO asignaturas (nombre, codigo, activa) VALUES
('Cálculo Diferencial', 'MAT101', true),
('Álgebra Lineal',      'MAT205', true),
('Programación I',      'SIS110', true),
('Bases de Datos',      'SIS220', true);

-- Relación tutor-asignatura
INSERT INTO tutor_asignatura (id_tutor, id_asignatura) VALUES
(2, 1), (2, 3);

-- Horario del tutor
INSERT INTO horarios (id_tutor, dia_semana, hora_inicio, hora_fin, disponible) VALUES
(2, 'LUNES', '14:00', '16:00', true),
(2, 'JUEVES', '10:00', '12:00', true);

-- Sesión de ejemplo
INSERT INTO sesiones (id_estudiante, id_tutor, id_asignatura, id_horario, fecha_sesion, hora_inicio, hora_fin, estado) VALUES
(1, 2, 1, 1, '2026-10-19', '14:00', '15:00', 'PENDIENTE');

-- Usuarios adicionales para probar múltiples perfiles y solicitudes
INSERT INTO usuarios (nombres, apellidos, correo, contrasena, rol_usuario) VALUES
('Carlos',       'Pineda',    'carlos.pineda@universidad.edu.sv',    '$2a$10$7EqJtq98hPqEX7fNZaFWoO7xG3KjY2V9hM5dQ8cR1L6T0wE3uS4iG', 'ESTUDIANTE'),
('Sofía',        'Hernández', 'sofia.hernandez@universidad.edu.sv', '$2a$10$7EqJtq98hPqEX7fNZaFWoO7xG3KjY2V9hM5dQ8cR1L6T0wE3uS4iG', 'ESTUDIANTE'),
('Diego',        'Martínez',  'diego.martinez@universidad.edu.sv',  '$2a$10$7EqJtq98hPqEX7fNZaFWoO7xG3KjY2V9hM5dQ8cR1L6T0wE3uS4iG', 'ESTUDIANTE'),
('Valentina',    'López',     'valentina.lopez@universidad.edu.sv', '$2a$10$7EqJtq98hPqEX7fNZaFWoO7xG3KjY2V9hM5dQ8cR1L6T0wE3uS4iG', 'TUTOR'),
('Ricardo',      'Castro',    'ricardo.castro@universidad.edu.sv',  '$2a$10$7EqJtq98hPqEX7fNZaFWoO7xG3KjY2V9hM5dQ8cR1L6T0wE3uS4iG', 'TUTOR');

-- Perfiles de estudiantes relacionados con los usuarios 4, 5 y 6
INSERT INTO estudiante (id_estudiante, carnet, carrera, ciclo_actual) VALUES
(4, '20240214', 'Ingeniería en Desarrollo de Software', 3),
(5, '20220456', 'Ingeniería Industrial', 7),
(6, '20250321', 'Licenciatura en Informática', 2);

-- Perfiles de tutores relacionados con los usuarios 7 y 8
INSERT INTO tutores (id_tutor, especialidad, descripcion_perfil, fecha_vinculacion) VALUES
(7, 'Álgebra y Bases de Datos', 'Tutoría enfocada en razonamiento matemático y modelado de datos.', '2024-02-01'),
(8, 'Programación y Desarrollo Web', 'Acompañamiento práctico en programación, estructuras y desarrollo web.', '2024-08-15');

-- Nuevas relaciones entre tutores y asignaturas
INSERT INTO tutor_asignatura (id_tutor, id_asignatura) VALUES
(7, 2), (7, 4),
(8, 3), (8, 4);

-- Disponibilidad adicional para cada tutor
INSERT INTO horarios (id_tutor, dia_semana, hora_inicio, hora_fin, disponible) VALUES
(7, 'MARTES',  '08:00', '10:00', true),
(7, 'VIERNES', '13:00', '15:00', true),
(8, 'MIERCOLES', '09:00', '11:00', true),
(8, 'JUEVES',  '15:00', '17:00', false);

-- Sesiones relacionadas para cubrir solicitudes, aprobaciones y resultados
INSERT INTO sesiones (
	id_estudiante, id_tutor, id_asignatura, id_horario, fecha_sesion,
	hora_inicio, hora_fin, estado, descripcion_dificultades,
	observaciones_tutor, calificacion_progreso, asistencia
) VALUES
(4, 2, 3, 1, '2026-10-20', '14:00', '15:00', 'APROBADA',
 'Dificultad con ciclos y funciones.', NULL, NULL, NULL),
(5, 7, 2, 3, '2026-10-21', '08:00', '09:00', 'COMPLETADA',
 'Necesita practicar operaciones con matrices.', 'Resolvió correctamente los ejercicios asignados.', 8.5, true),
(6, 8, 4, 5, '2026-10-22', '09:00', '10:00', 'RECHAZADA',
 'Quiere repasar consultas SQL.', 'El horario solicitado ya no estaba disponible.', NULL, NULL),
(1, 7, 2, 4, '2026-10-23', '13:00', '14:00', 'PENDIENTE',
 'Preparación para el examen de álgebra.', NULL, NULL, NULL),
(4, 8, 4, 6, '2026-10-26', '15:00', '16:00', 'CANCELADA',
 'Revisión de normalización de bases de datos.', 'La sesión fue cancelada por el estudiante.', NULL, false),
(5, 2, 1, 2, '2026-10-27', '10:00', '11:00', 'APROBADA',
 'Repaso de derivadas y aplicaciones.', NULL, NULL, NULL);

-- Notificaciones vinculadas a sesiones existentes
INSERT INTO notificaciones (id_usuario, id_sesion, tipo, mensaje, leida) VALUES
(1, 1, 'RECORDATORIO', 'Tienes una tutoría pendiente de Cálculo Diferencial.', false),
(4, 2, 'APROBACION', 'Tu solicitud de Programación I fue aprobada.', false),
(5, 3, 'OBSERVACION', 'Tu tutor registró observaciones sobre tu progreso.', true),
(6, 4, 'RECHAZO', 'La solicitud de Bases de Datos fue rechazada por falta de disponibilidad.', false),
(1, 5, 'RECORDATORIO', 'Recuerda revisar los ejercicios de Álgebra Lineal.', false),
(4, 6, 'CAMBIO_HORARIO', 'La sesión de Bases de Datos fue cancelada.', true);

-- Reportes de ejemplo para el panel de coordinación
INSERT INTO reportes (id_coordinador, tipo_reporte, fecha_inicio, fecha_fin, filtro_carrera) VALUES
(3, 'ASISTENCIA',   '2026-10-01', '2026-10-31', NULL),
(3, 'RENDIMIENTO',  '2026-09-01', '2026-09-30', 'Ingeniería en Desarrollo de Software'),
(3, 'POR_TUTOR',    '2026-09-01', '2026-09-30', NULL);
