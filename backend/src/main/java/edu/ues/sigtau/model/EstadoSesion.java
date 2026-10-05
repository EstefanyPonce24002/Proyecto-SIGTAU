package edu.ues.sigtau.model;

/**
 * Estados válidos de una sesión de tutoría.
 * NOTA: "EN_CURSO" fue removido intencionalmente. Existía en la
 * pantalla Supervision.tsx del prototipo original pero no está
 * contemplado en el diccionario de datos ni aporta una transición
 * de negocio distinta a APROBADA. Ver documento de correcciones
 * técnicas para más detalle.
 */
public enum EstadoSesion {
    PENDIENTE,
    APROBADA,
    RECHAZADA,
    COMPLETADA,
    CANCELADA
}
