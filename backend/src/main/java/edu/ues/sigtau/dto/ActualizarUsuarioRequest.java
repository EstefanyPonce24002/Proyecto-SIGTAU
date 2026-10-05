package edu.ues.sigtau.dto;

import jakarta.validation.constraints.NotBlank;

/** Datos editables desde la administración de usuarios. */
public record ActualizarUsuarioRequest(
        @NotBlank String nombres,
        @NotBlank String apellidos,
        String carnet,
        String carrera,
        String especialidad) {
}
