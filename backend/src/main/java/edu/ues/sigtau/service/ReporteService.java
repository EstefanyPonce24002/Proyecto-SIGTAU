package edu.ues.sigtau.service;

import edu.ues.sigtau.dto.*;
import edu.ues.sigtau.model.*;
import edu.ues.sigtau.repository.SesionRepository;
import edu.ues.sigtau.repository.ReporteRepository;
import edu.ues.sigtau.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private final SesionRepository sesionRepository;
    private final ReporteRepository reporteRepository;
    private final UsuarioRepository usuarioRepository;

    private static final String SIN_FILTRO = "Todas las carreras";

    @Transactional
    public ReporteGeneradoResponse generar(GenerarReporteRequest request, Integer idCoordinador) {
        List<Sesion> sesiones = sesionRepository.findByFechaSesionBetween(request.fechaInicio(), request.fechaFin());

        if (request.filtroCarrera() != null && !request.filtroCarrera().isBlank() && !request.filtroCarrera().equals(SIN_FILTRO)) {
            sesiones = sesiones.stream()
                    .filter(s -> request.filtroCarrera().equals(s.getEstudiante().getCarrera()))
                    .toList();
        }

        ReporteGeneradoResponse respuesta = switch (request.tipoReporte()) {
            case ASISTENCIA -> generarAsistencia(sesiones);
            case RENDIMIENTO -> generarRendimiento(sesiones);
            case ESTADISTICAS -> generarEstadisticas(sesiones);
            case POR_TUTOR -> generarPorTutor(sesiones);
        };

        // RF-11: registrar el reporte generado en la tabla reportes
        Usuario coordinador = usuarioRepository.findById(idCoordinador)
                .orElseThrow(() -> new IllegalStateException("Coordinador no encontrado"));
        reporteRepository.save(Reporte.builder()
                .coordinador(coordinador)
                .tipoReporte(request.tipoReporte())
                .fechaInicio(request.fechaInicio())
                .fechaFin(request.fechaFin())
                .filtroCarrera(request.filtroCarrera())
                .build());

        return respuesta;
    }

    /* ── ASISTENCIA ───────────────────────────────────────────────────── */
    private ReporteGeneradoResponse generarAsistencia(List<Sesion> sesiones) {
        Map<String, List<Sesion>> porAsignatura = sesiones.stream()
                .collect(Collectors.groupingBy(s -> s.getAsignatura().getNombre()));

        List<List<String>> rows = new ArrayList<>();
        List<ChartPointDto> chart = new ArrayList<>();
        long totalCompletadas = 0, totalConAsistencia = 0, totalCanceladas = 0;

        for (var entry : porAsignatura.entrySet()) {
            List<Sesion> lista = entry.getValue();
            long completadas = lista.stream().filter(s -> s.getEstado() == EstadoSesion.COMPLETADA).count();
            long canceladas  = lista.stream().filter(s -> s.getEstado() == EstadoSesion.CANCELADA).count();
            long pendientes  = lista.stream().filter(s -> s.getEstado() == EstadoSesion.PENDIENTE || s.getEstado() == EstadoSesion.APROBADA).count();
            long asistieron  = lista.stream().filter(s -> s.getEstado() == EstadoSesion.COMPLETADA && Boolean.TRUE.equals(s.getAsistencia())).count();
            String indice = completadas == 0 ? "N/A" : porcentaje(asistieron, completadas);

            rows.add(List.of(entry.getKey(), String.valueOf(completadas), String.valueOf(canceladas), String.valueOf(pendientes), indice));
            chart.add(new ChartPointDto(entry.getKey(), completadas));

            totalCompletadas += completadas;
            totalConAsistencia += asistieron;
            totalCanceladas += canceladas;
        }

        rows.sort((a, b) -> b.get(1).compareTo(a.get(1))); // por completadas desc (orden lexicográfico simple, suficiente aquí)
        chart.sort((a, b) -> Double.compare(b.value(), a.value()));

        List<KpiDto> kpis = List.of(
                new KpiDto("Total sesiones", String.valueOf(sesiones.size())),
                new KpiDto("Índice global", totalCompletadas == 0 ? "N/A" : porcentaje(totalConAsistencia, totalCompletadas)),
                new KpiDto("Canceladas", String.valueOf(totalCanceladas)),
                new KpiDto("Asignaturas", String.valueOf(porAsignatura.size()))
        );

        return new ReporteGeneradoResponse(TipoReporte.ASISTENCIA,
                List.of("Asignatura", "Completadas", "Canceladas", "Pendientes", "Índice asistencia"),
                rows, kpis, chart.stream().limit(8).toList(), rows.size(), java.time.LocalDateTime.now());
    }

    /* ── RENDIMIENTO ──────────────────────────────────────────────────── */
    private ReporteGeneradoResponse generarRendimiento(List<Sesion> sesiones) {
        Map<String, List<BigDecimal>> calificacionesPorAsignatura = sesiones.stream()
                .filter(s -> s.getEstado() == EstadoSesion.COMPLETADA && s.getCalificacionProgreso() != null)
                .collect(Collectors.groupingBy(s -> s.getAsignatura().getNombre(),
                        Collectors.mapping(Sesion::getCalificacionProgreso, Collectors.toList())));

        List<List<String>> rows = new ArrayList<>();
        List<ChartPointDto> chart = new ArrayList<>();
        List<BigDecimal> todas = new ArrayList<>();

        for (var entry : calificacionesPorAsignatura.entrySet()) {
            List<BigDecimal> notas = entry.getValue();
            BigDecimal promedio = promedio(notas);
            BigDecimal min = notas.stream().min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
            BigDecimal max = notas.stream().max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);

            rows.add(List.of(entry.getKey(), promedio.toPlainString(), String.valueOf(notas.size()), min.toPlainString(), max.toPlainString()));
            chart.add(new ChartPointDto(entry.getKey(), promedio.doubleValue()));
            todas.addAll(notas);
        }

        rows.sort((a, b) -> b.get(1).compareTo(a.get(1)));
        chart.sort((a, b) -> Double.compare(b.value(), a.value()));

        List<KpiDto> kpis = List.of(
                new KpiDto("Promedio general", todas.isEmpty() ? "N/A" : promedio(todas).toPlainString()),
                new KpiDto("Calif. máxima", todas.isEmpty() ? "N/A" : todas.stream().max(Comparator.naturalOrder()).get().toPlainString()),
                new KpiDto("Calif. mínima", todas.isEmpty() ? "N/A" : todas.stream().min(Comparator.naturalOrder()).get().toPlainString()),
                new KpiDto("Asignaturas eval.", String.valueOf(calificacionesPorAsignatura.size()))
        );

        return new ReporteGeneradoResponse(TipoReporte.RENDIMIENTO,
                List.of("Asignatura", "Promedio", "Sesiones", "Calif. mín.", "Calif. máx."),
                rows, kpis, chart.stream().limit(8).toList(), rows.size(), java.time.LocalDateTime.now());
    }

    /* ── ESTADISTICAS ─────────────────────────────────────────────────── */
    private ReporteGeneradoResponse generarEstadisticas(List<Sesion> sesiones) {
        long totalSesiones = sesiones.size();
        long estudiantesActivos = sesiones.stream().map(s -> s.getEstudiante().getId()).distinct().count();
        long tutoresActivos = sesiones.stream().map(s -> s.getTutor().getId()).distinct().count();
        long completadas = sesiones.stream().filter(s -> s.getEstado() == EstadoSesion.COMPLETADA).count();
        long asistieron = sesiones.stream().filter(s -> s.getEstado() == EstadoSesion.COMPLETADA && Boolean.TRUE.equals(s.getAsistencia())).count();
        long canceladas = sesiones.stream().filter(s -> s.getEstado() == EstadoSesion.CANCELADA).count();
        long pendientes = sesiones.stream().filter(s -> s.getEstado() == EstadoSesion.PENDIENTE || s.getEstado() == EstadoSesion.APROBADA).count();
        List<BigDecimal> notas = sesiones.stream()
                .filter(s -> s.getEstado() == EstadoSesion.COMPLETADA && s.getCalificacionProgreso() != null)
                .map(Sesion::getCalificacionProgreso).toList();
        String tasaAsistencia = completadas == 0 ? "N/A" : porcentaje(asistieron, completadas);
        String promedioGeneral = notas.isEmpty() ? "N/A" : promedio(notas).toPlainString();

        List<List<String>> rows = List.of(
                List.of("Total sesiones registradas", String.valueOf(totalSesiones)),
                List.of("Estudiantes activos", String.valueOf(estudiantesActivos)),
                List.of("Tutores activos", String.valueOf(tutoresActivos)),
                List.of("Sesiones completadas", String.valueOf(completadas)),
                List.of("Sesiones canceladas", String.valueOf(canceladas)),
                List.of("Sesiones pendientes/aprobadas", String.valueOf(pendientes)),
                List.of("Tasa de asistencia global", tasaAsistencia),
                List.of("Promedio de calificaciones", promedioGeneral)
        );

        List<KpiDto> kpis = List.of(
                new KpiDto("Total sesiones", String.valueOf(totalSesiones)),
                new KpiDto("Estudiantes activos", String.valueOf(estudiantesActivos)),
                new KpiDto("Tutores activos", String.valueOf(tutoresActivos)),
                new KpiDto("Tasa asistencia", tasaAsistencia)
        );

        List<ChartPointDto> chart = List.of(
                new ChartPointDto("Sesiones", totalSesiones),
                new ChartPointDto("Estudiantes", estudiantesActivos),
                new ChartPointDto("Tutores", tutoresActivos),
                new ChartPointDto("Completadas", completadas),
                new ChartPointDto("Canceladas", canceladas)
        );

        return new ReporteGeneradoResponse(TipoReporte.ESTADISTICAS,
                List.of("Indicador", "Valor"), rows, kpis, chart, rows.size(), java.time.LocalDateTime.now());
    }

    /* ── POR_TUTOR ────────────────────────────────────────────────────── */
    private ReporteGeneradoResponse generarPorTutor(List<Sesion> sesiones) {
        Map<String, List<Sesion>> porTutor = sesiones.stream()
                .collect(Collectors.groupingBy(s -> s.getTutor().getUsuario().getNombres() + " " + s.getTutor().getUsuario().getApellidos()));

        List<List<String>> rows = new ArrayList<>();
        List<ChartPointDto> chart = new ArrayList<>();
        double mejorPromedio = 0;
        double mejorAprobacion = 0;

        for (var entry : porTutor.entrySet()) {
            List<Sesion> lista = entry.getValue();
            long total = lista.size();
            long aceptadas = lista.stream().filter(s -> s.getEstado() == EstadoSesion.APROBADA || s.getEstado() == EstadoSesion.COMPLETADA).count();
            double pctAprobacion = total == 0 ? 0 : (aceptadas * 100.0 / total);
            List<BigDecimal> notas = lista.stream()
                    .filter(s -> s.getEstado() == EstadoSesion.COMPLETADA && s.getCalificacionProgreso() != null)
                    .map(Sesion::getCalificacionProgreso).toList();
            String promedioStr = notas.isEmpty() ? "N/A" : promedio(notas).toPlainString();
            String asignaturas = lista.stream().map(s -> s.getAsignatura().getNombre()).distinct().collect(Collectors.joining(", "));

            rows.add(List.of(entry.getKey(), String.valueOf(total), String.valueOf(aceptadas),
                    String.format(Locale.US, "%.1f%%", pctAprobacion), promedioStr, asignaturas));
            chart.add(new ChartPointDto(entry.getKey(), total));

            mejorAprobacion = Math.max(mejorAprobacion, pctAprobacion);
            if (!notas.isEmpty()) mejorPromedio = Math.max(mejorPromedio, promedio(notas).doubleValue());
        }

        rows.sort((a, b) -> Integer.parseInt(b.get(1)) - Integer.parseInt(a.get(1)));
        chart.sort((a, b) -> Double.compare(b.value(), a.value()));

        List<KpiDto> kpis = List.of(
                new KpiDto("Tutores evaluados", String.valueOf(porTutor.size())),
                new KpiDto("Mayor % aprobación", String.format(Locale.US, "%.1f%%", mejorAprobacion)),
                new KpiDto("Mejor promedio", mejorPromedio == 0 ? "N/A" : String.format(Locale.US, "%.1f", mejorPromedio)),
                new KpiDto("Total sesiones", String.valueOf(sesiones.size()))
        );

        return new ReporteGeneradoResponse(TipoReporte.POR_TUTOR,
                List.of("Tutor", "Sesiones", "Aprobadas/Completadas", "% Aprobación", "Prom. evaluación", "Asignaturas"),
                rows, kpis, chart.stream().limit(8).toList(), rows.size(), java.time.LocalDateTime.now());
    }

    /* ── Helpers ──────────────────────────────────────────────────────── */
    private String porcentaje(long parte, long total) {
        return String.format(Locale.US, "%.1f%%", parte * 100.0 / total);
    }

    private BigDecimal promedio(List<BigDecimal> valores) {
        if (valores.isEmpty()) return BigDecimal.ZERO;
        BigDecimal suma = valores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return suma.divide(BigDecimal.valueOf(valores.size()), 1, RoundingMode.HALF_UP);
    }
}
