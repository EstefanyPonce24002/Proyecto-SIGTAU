package edu.ues.sigtau.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

// RF-04: Solicitar Tutoría
public record SolicitarSesionRequest(
        @NotNull Integer idEstudiante,
        @NotNull Integer idTutor,
        @NotNull Integer idAsignatura,
        @NotNull Integer idHorario,
        @NotNull LocalDate fecha,
        @NotNull LocalTime horaInicio,
        @NotNull LocalTime horaFin,
        String descripcionDificultades
) {}
