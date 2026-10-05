package edu.ues.sigtau.dto;

import edu.ues.sigtau.model.TipoReporte;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

// RF-11: Generar Reporte Académico
public record GenerarReporteRequest(
        @NotNull TipoReporte tipoReporte,
        @NotNull LocalDate fechaInicio,
        @NotNull LocalDate fechaFin,
        String filtroCarrera // null o "Todas las carreras" = sin filtro
) {}
