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
        if (request.fechaInicio().isAfter(request.fechaFin())) {
            throw new IllegalArgumentException("La fecha de inicio no puede ser posterior a la fecha de fin.");
        }

        List<Sesion> sesiones = sesionRepository.findByFechaSesionBetween(
                request.fechaInicio(), request.fechaFin());

        String filtroCarrera = request.filtroCarrera();
        if (filtroCarrera != null && !filtroCarrera.isBlank() && !SIN_FILTRO.equalsIgnoreCase(filtroCarrera.trim())) {
            String carreraBuscada = filtroCarrera.trim();
            sesiones = sesiones.stream()
                    .filter(s -> s.getEstudiante() != null
                            && carreraBuscada.equalsIgnoreCase(
                                    Objects.toString(s.getEstudiante().getCarrera(), "").trim()))
                    .toList();
        }

        ReporteGeneradoResponse respuesta = switch (request.tipoReporte()) {
            case ASISTENCIA -> generarAsistencia(sesiones);
            case RENDIMIENTO -> generarRendimiento(sesiones);
            case ESTADISTICAS -> generarEstadisticas(sesiones);
            case TUTORIAS_POR_CARRERA -> generarTutoriasPorCarrera(sesiones);
            case ESTUDIANTES_ATENDIDOS -> generarEstudiantesAtendidos(sesiones);
            case TUTORIAS_MAS_SOLICITADAS -> generarTutoriasMasSolicitadas(sesiones);
        };

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

    /* ASISTENCIA */
    private ReporteGeneradoResponse generarAsistencia(List<Sesion> sesiones) {
        Map<String, List<Sesion>> porAsignatura = sesiones.stream()
                .filter(s -> s.getAsignatura() != null)
                .collect(Collectors.groupingBy(s -> s.getAsignatura().getNombre()));

        List<List<String>> rows = new ArrayList<>();
        List<ChartPointDto> chart = new ArrayList<>();
        long totalCompletadas = 0, totalConAsistencia = 0, totalCanceladas = 0;

        for (var entry : porAsignatura.entrySet()) {
            List<Sesion> lista = entry.getValue();
            long completadas = lista.stream().filter(s -> s.getEstado() == EstadoSesion.COMPLETADA).count();
            long canceladas = lista.stream().filter(s -> s.getEstado() == EstadoSesion.CANCELADA).count();
            long pendientes = lista.stream().filter(s -> s.getEstado() == EstadoSesion.PENDIENTE
                    || s.getEstado() == EstadoSesion.APROBADA).count();
            long asistieron = lista.stream().filter(s -> s.getEstado() == EstadoSesion.COMPLETADA
                    && Boolean.TRUE.equals(s.getAsistencia())).count();
            String indice = completadas == 0 ? "N/A" : porcentaje(asistieron, completadas);

            rows.add(List.of(entry.getKey(), String.valueOf(completadas), String.valueOf(canceladas),
                    String.valueOf(pendientes), indice));
            chart.add(new ChartPointDto(entry.getKey(), completadas));
            totalCompletadas += completadas;
            totalConAsistencia += asistieron;
            totalCanceladas += canceladas;
        }

        rows.sort(Comparator.comparingLong((List<String> row) -> Long.parseLong(row.get(1))).reversed());
        chart.sort(Comparator.comparingDouble(ChartPointDto::value).reversed());

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

    /* RENDIMIENTO */
    private ReporteGeneradoResponse generarRendimiento(List<Sesion> sesiones) {
        Map<String, List<BigDecimal>> calificacionesPorAsignatura = sesiones.stream()
                .filter(s -> s.getEstado() == EstadoSesion.COMPLETADA && s.getCalificacionProgreso() != null
                        && s.getAsignatura() != null)
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
            rows.add(List.of(entry.getKey(), promedio.toPlainString(), String.valueOf(notas.size()),
                    min.toPlainString(), max.toPlainString()));
            chart.add(new ChartPointDto(entry.getKey(), promedio.doubleValue()));
            todas.addAll(notas);
        }

        rows.sort(Comparator.comparing((List<String> row) -> new BigDecimal(row.get(1))).reversed());
        chart.sort(Comparator.comparingDouble(ChartPointDto::value).reversed());

        List<KpiDto> kpis = List.of(
                new KpiDto("Promedio general", todas.isEmpty() ? "N/A" : promedio(todas).toPlainString()),
                new KpiDto("Calif. máxima", todas.stream().max(Comparator.naturalOrder()).map(BigDecimal::toPlainString).orElse("N/A")),
                new KpiDto("Calif. mínima", todas.stream().min(Comparator.naturalOrder()).map(BigDecimal::toPlainString).orElse("N/A")),
                new KpiDto("Asignaturas eval.", String.valueOf(calificacionesPorAsignatura.size()))
        );

        return new ReporteGeneradoResponse(TipoReporte.RENDIMIENTO,
                List.of("Asignatura", "Promedio", "Sesiones", "Calif. mín.", "Calif. máx."),
                rows, kpis, chart.stream().limit(8).toList(), rows.size(), java.time.LocalDateTime.now());
    }

    /* ESTADÍSTICAS GENERALES */
    private ReporteGeneradoResponse generarEstadisticas(List<Sesion> sesiones) {
        long totalSesiones = sesiones.size();
        long estudiantesActivos = sesiones.stream().filter(s -> s.getEstudiante() != null)
                .map(s -> s.getEstudiante().getId()).distinct().count();
        long tutoresActivos = sesiones.stream().filter(s -> s.getTutor() != null)
                .map(s -> s.getTutor().getId()).distinct().count();
        long completadas = sesiones.stream().filter(s -> s.getEstado() == EstadoSesion.COMPLETADA).count();
        long asistieron = sesiones.stream().filter(s -> s.getEstado() == EstadoSesion.COMPLETADA
                && Boolean.TRUE.equals(s.getAsistencia())).count();
        long canceladas = sesiones.stream().filter(s -> s.getEstado() == EstadoSesion.CANCELADA).count();
        long pendientes = sesiones.stream().filter(s -> s.getEstado() == EstadoSesion.PENDIENTE
                || s.getEstado() == EstadoSesion.APROBADA).count();
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

    /* TUTORÍAS POR CARRERA: la carrera pertenece al estudiante en el modelo actual. */
    private ReporteGeneradoResponse generarTutoriasPorCarrera(List<Sesion> sesiones) {
        Map<String, List<Sesion>> porCarrera = sesiones.stream()
                .filter(s -> s.getEstudiante() != null)
                .collect(Collectors.groupingBy(s -> {
                    String carrera = s.getEstudiante().getCarrera();
                    return carrera == null || carrera.isBlank() ? "Sin carrera registrada" : carrera;
                }));

        List<List<String>> rows = new ArrayList<>();
        List<ChartPointDto> chart = new ArrayList<>();
        long totalCompletadas = 0;
        long totalAsistidas = 0;

        for (var entry : porCarrera.entrySet()) {
            List<Sesion> lista = entry.getValue();
            long total = lista.size();
            long completadas = lista.stream().filter(s -> s.getEstado() == EstadoSesion.COMPLETADA).count();
            long asistidas = lista.stream().filter(s -> s.getEstado() == EstadoSesion.COMPLETADA
                    && Boolean.TRUE.equals(s.getAsistencia())).count();
            long estudiantes = lista.stream().filter(s -> s.getEstudiante() != null)
                    .map(s -> s.getEstudiante().getId()).distinct().count();
            long asignaturas = lista.stream().filter(s -> s.getAsignatura() != null)
                    .map(s -> s.getAsignatura().getId()).distinct().count();
            String tasaAsistencia = completadas == 0 ? "N/A" : porcentaje(asistidas, completadas);

            rows.add(List.of(entry.getKey(), String.valueOf(total), String.valueOf(estudiantes),
                    String.valueOf(completadas), tasaAsistencia, String.valueOf(asignaturas)));
            chart.add(new ChartPointDto(entry.getKey(), total));
            totalCompletadas += completadas;
            totalAsistidas += asistidas;
        }

        rows.sort(Comparator.comparingLong((List<String> row) -> Long.parseLong(row.get(1))).reversed());
        chart.sort(Comparator.comparingDouble(ChartPointDto::value).reversed());
        List<KpiDto> kpis = List.of(
                new KpiDto("Carreras", String.valueOf(porCarrera.size())),
                new KpiDto("Total tutorías", String.valueOf(sesiones.size())),
                new KpiDto("Sesiones completadas", String.valueOf(totalCompletadas)),
                new KpiDto("Asistencia global", totalCompletadas == 0 ? "N/A" : porcentaje(totalAsistidas, totalCompletadas))
        );

        return new ReporteGeneradoResponse(TipoReporte.TUTORIAS_POR_CARRERA,
                List.of("Carrera", "Tutorías solicitadas", "Estudiantes", "Completadas", "Tasa asistencia", "Asignaturas"),
                rows, kpis, chart.stream().limit(8).toList(), rows.size(), java.time.LocalDateTime.now());
    }

    /* ESTUDIANTES ATENDIDOS: estudiantes con al menos una sesión completada y asistencia confirmada. */
    private ReporteGeneradoResponse generarEstudiantesAtendidos(List<Sesion> sesiones) {
        Map<Integer, List<Sesion>> porEstudiante = sesiones.stream()
                .filter(s -> s.getEstudiante() != null
                        && s.getEstado() == EstadoSesion.COMPLETADA
                        && Boolean.TRUE.equals(s.getAsistencia()))
                .collect(Collectors.groupingBy(s -> s.getEstudiante().getId()));

        List<List<String>> rows = new ArrayList<>();
        List<ChartPointDto> chart = new ArrayList<>();

        for (var entry : porEstudiante.entrySet()) {
            List<Sesion> lista = entry.getValue();
            Estudiante estudiante = lista.get(0).getEstudiante();
            String nombre = estudiante.getUsuario() == null ? "Estudiante #" + estudiante.getId()
                    : (Objects.toString(estudiante.getUsuario().getNombres(), "") + " "
                            + Objects.toString(estudiante.getUsuario().getApellidos(), "")).trim();
            String carrera = estudiante.getCarrera() == null || estudiante.getCarrera().isBlank()
                    ? "Sin carrera registrada" : estudiante.getCarrera();
            long asignaturas = lista.stream().filter(s -> s.getAsignatura() != null)
                    .map(s -> s.getAsignatura().getId()).distinct().count();
            String nombresAsignaturas = lista.stream().filter(s -> s.getAsignatura() != null)
                    .map(s -> s.getAsignatura().getNombre()).distinct().sorted()
                    .collect(Collectors.joining(", "));

            rows.add(List.of(nombre, carrera, String.valueOf(lista.size()),
                    String.valueOf(asignaturas), nombresAsignaturas));
            chart.add(new ChartPointDto(nombre, lista.size()));
        }

        rows.sort(Comparator.comparingLong((List<String> row) -> Long.parseLong(row.get(2))).reversed());
        chart.sort(Comparator.comparingDouble(ChartPointDto::value).reversed());
        long totalSesionesAtendidas = porEstudiante.values().stream().mapToLong(List::size).sum();

        List<KpiDto> kpis = List.of(
                new KpiDto("Estudiantes atendidos", String.valueOf(porEstudiante.size())),
                new KpiDto("Tutorías con asistencia", String.valueOf(totalSesionesAtendidas)),
                new KpiDto("Carreras representadas", String.valueOf(porEstudiante.values().stream()
                        .map(lista -> lista.get(0).getEstudiante().getCarrera())
                        .filter(Objects::nonNull).distinct().count())),
                new KpiDto("Asignaturas atendidas", String.valueOf(porEstudiante.values().stream()
                        .flatMap(List::stream).filter(s -> s.getAsignatura() != null)
                        .map(s -> s.getAsignatura().getId()).distinct().count()))
        );

        return new ReporteGeneradoResponse(TipoReporte.ESTUDIANTES_ATENDIDOS,
                List.of("Estudiante", "Carrera", "Tutorías atendidas", "Asignaturas", "Detalle de asignaturas"),
                rows, kpis, chart.stream().limit(8).toList(), rows.size(), java.time.LocalDateTime.now());
    }

    /* TUTORÍAS MÁS SOLICITADAS */
    private ReporteGeneradoResponse generarTutoriasMasSolicitadas(List<Sesion> sesiones) {
        Map<String, Long> porAsignatura = sesiones.stream()
                .filter(s -> s.getAsignatura() != null)
                .collect(Collectors.groupingBy(s -> s.getAsignatura().getNombre(), Collectors.counting()));

        List<List<String>> rows = porAsignatura.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> List.of(e.getKey(), String.valueOf(e.getValue())))
                .toList();
        List<ChartPointDto> chart = porAsignatura.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(8).map(e -> new ChartPointDto(e.getKey(), e.getValue())).toList();

        long total = sesiones.size();
        String masSolicitada = rows.isEmpty() ? "N/A" : rows.get(0).get(0);
        List<KpiDto> kpis = List.of(
                new KpiDto("Tutorías solicitadas", String.valueOf(total)),
                new KpiDto("Asignaturas con demanda", String.valueOf(porAsignatura.size())),
                new KpiDto("Más solicitada", masSolicitada),
                new KpiDto("Mayor demanda", rows.isEmpty() ? "0" : rows.get(0).get(1))
        );

        return new ReporteGeneradoResponse(TipoReporte.TUTORIAS_MAS_SOLICITADAS,
                List.of("Asignatura", "Tutorías solicitadas"),
                rows, kpis, chart, rows.size(), java.time.LocalDateTime.now());
    }

    private String porcentaje(long parte, long total) {
        if (total == 0) return "N/A";
        return String.format(Locale.US, "%.1f%%", parte * 100.0 / total);
    }

    private BigDecimal promedio(List<BigDecimal> valores) {
        if (valores.isEmpty()) return BigDecimal.ZERO;
        BigDecimal suma = valores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return suma.divide(BigDecimal.valueOf(valores.size()), 1, RoundingMode.HALF_UP);
    }
}