package edu.ues.sigtau.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Datos editables desde la administración de usuarios. Los identificadores son inmutables. */
public record ActualizarUsuarioRequest(
        @NotBlank @Size(max = 100, message = "Los nombres no pueden superar los 100 caracteres") String nombres,
        @NotBlank @Size(max = 50, message = "Los apellidos no pueden superar los 50 caracteres") String apellidos,
        @Size(max = 25, message = "El teléfono no puede superar los 25 caracteres")
        String telefono,
        @Size(max = 150, message = "La carrera no puede superar los 150 caracteres")
        String carrera,
        @Size(max = 200, message = "La especialidad no puede superar los 200 caracteres")
        String especialidad) {
}
