package edu.ues.sigtau.dto;

import edu.ues.sigtau.model.DiaSemana;
import edu.ues.sigtau.model.Horario;

import java.time.LocalTime;

public record HorarioResponse(Integer id, DiaSemana diaSemana, LocalTime horaInicio, LocalTime horaFin, Boolean disponible) {
    public static HorarioResponse from(Horario h) {
        return new HorarioResponse(h.getId(), h.getDiaSemana(), h.getHoraInicio(), h.getHoraFin(), h.getDisponible());
    }
}
