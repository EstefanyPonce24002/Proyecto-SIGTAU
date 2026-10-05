package edu.ues.sigtau.dto;

import edu.ues.sigtau.model.Asignatura;

public record AsignaturaResponse(Integer id, String nombre, String codigo, Boolean activa) {
    public static AsignaturaResponse from(Asignatura a) {
        return new AsignaturaResponse(a.getId(), a.getNombre(), a.getCodigo(), a.getActiva());
    }
}
