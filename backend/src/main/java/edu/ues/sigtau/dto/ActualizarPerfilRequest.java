package edu.ues.sigtau.dto;

import jakarta.validation.constraints.NotBlank;

public record ActualizarPerfilRequest(
        @NotBlank String nombres,
        @NotBlank String apellidos,
        String carrera
) {}
