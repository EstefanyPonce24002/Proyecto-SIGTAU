package edu.ues.sigtau.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ActualizarAsignaturasTutorRequest(
        @NotNull
        List<@NotNull Integer> idAsignaturas
) {}