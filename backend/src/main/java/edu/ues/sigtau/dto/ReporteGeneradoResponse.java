package edu.ues.sigtau.dto;

import edu.ues.sigtau.model.TipoReporte;

import java.time.LocalDateTime;
import java.util.List;

public record ReporteGeneradoResponse(
        TipoReporte tipoReporte,
        List<String> headers,
        List<List<String>> rows,
        List<KpiDto> kpis,
        List<ChartPointDto> chart,
        int totalRegistros,
        LocalDateTime fechaGeneracion
) {}
