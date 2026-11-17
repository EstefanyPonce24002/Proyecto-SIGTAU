package edu.ues.sigtau.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CrearAsignaturaRequest(
        @NotBlank(message = "El nombre de la asignatura es obligatorio")
        @Size(max = 150, message = "El nombre no puede superar los 150 caracteres")
        String nombre,

        @Size(max = 20, message = "El código no puede superar los 20 caracteres")
        @Pattern(regexp = "^[A-Za-z0-9-]+$",
                 message = "El código solo puede contener letras, números y guiones")
        String codigo,

        @Size(max = 1000, message = "La descripción no puede superar los 1000 caracteres")
        String descripcion
) {
    public CrearAsignaturaRequest {
        nombre = (nombre == null) ? null : nombre.trim();
        codigo = (codigo == null || codigo.isBlank()) ? null : codigo.trim().toUpperCase();
        descripcion = (descripcion == null || descripcion.isBlank()) ? null : descripcion.trim();
    }
}
