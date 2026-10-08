package edu.ues.sigtau.dto;

import java.util.List;

public record CoordinadorDashboardResponse(
        long sesiones,
        long tutoresActivos,
        long estudiantesActivos,
        long asignaturasActivas,
        List<ActividadReciente> actividadReciente
) {
    public record ActividadReciente(
            Integer idSesion,
            String estado,
            String estudiante,
            String tutor,
            String asignatura,
            String fecha,
            String hora
    ) {}
}
