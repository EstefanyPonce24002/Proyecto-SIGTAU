package edu.ues.sigtau.dto;

import edu.ues.sigtau.model.DiaSemana;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

// RF-06: Gestionar Horarios
public record CrearHorarioRequest(
        @NotNull Integer idTutor,
        @NotNull DiaSemana diaSemana,
        @NotNull LocalTime horaInicio,
        @NotNull LocalTime horaFin
) {}
