package edu.ues.sigtau.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Datos editables desde la administración de usuarios. */
public record ActualizarUsuarioRequest(
        @NotBlank String nombres,
        @NotBlank String apellidos,
        @Size(max = 25, message = "El teléfono no puede superar los 25 caracteres")
        String telefono,
        String carnet,
        String carrera,
        String especialidad) {
}
