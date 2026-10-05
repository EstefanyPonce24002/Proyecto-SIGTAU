package edu.ues.sigtau.dto;

import edu.ues.sigtau.model.Tutor;

public record TutorResponse(Integer id, String nombreCompleto, String especialidad) {
    public static TutorResponse from(Tutor t) {
        return new TutorResponse(
                t.getId(),
                t.getUsuario().getNombres() + " " + t.getUsuario().getApellidos(),
                t.getEspecialidad()
        );
    }
}
