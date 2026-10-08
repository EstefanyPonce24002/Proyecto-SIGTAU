package edu.ues.sigtau.dto;

import edu.ues.sigtau.model.EstadoSesion;
import edu.ues.sigtau.model.Sesion;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/** Vista pública de una sesión -- nunca expone contraseñas ni entidades JPA crudas. */
public record SesionResponse(
        Integer id,
        Integer idEstudiante,
        String estudianteNombre,
        Integer idTutor,
        String tutorNombre,
        Integer idAsignatura,
        String asignaturaNombre,
        Integer idHorario,
        LocalDate fechaSesion,
        LocalTime horaInicio,
        LocalTime horaFin,
        String descripcionDificultades,
        EstadoSesion estado,
        String observacionesTutor,
        BigDecimal calificacionProgreso,
        Boolean asistencia,
        LocalDateTime fechaSolicitud
) {
    public static SesionResponse from(Sesion s) {
        return new SesionResponse(
                s.getId(),
                s.getEstudiante().getId(),
                s.getEstudiante().getUsuario().getNombres() + " " + s.getEstudiante().getUsuario().getApellidos(),
                s.getTutor().getId(),
                s.getTutor().getUsuario().getNombres() + " " + s.getTutor().getUsuario().getApellidos(),
                s.getAsignatura().getId(),
                s.getAsignatura().getNombre(),
                s.getHorario() != null ? s.getHorario().getId() : null,
                s.getFechaSesion(),
                s.getHoraInicio(),
                s.getHoraFin(),
                s.getDescripcionDificultades(),
                s.getEstado(),
                s.getObservacionesTutor(),
                s.getCalificacionProgreso(),
                s.getAsistencia(),
                s.getFechaSolicitud()
        );
    }
}
