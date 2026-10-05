package edu.ues.sigtau.dto;

import jakarta.validation.constraints.NotBlank;

public record CrearAsignaturaRequest(
        @NotBlank String nombre,
        String codigo,
        String descripcion
) {}
