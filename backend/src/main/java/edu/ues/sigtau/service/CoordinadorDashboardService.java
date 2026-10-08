package edu.ues.sigtau.service;

import edu.ues.sigtau.dto.CoordinadorDashboardResponse;
import edu.ues.sigtau.model.RolUsuario;
import edu.ues.sigtau.repository.AsignaturaRepository;
import edu.ues.sigtau.repository.SesionRepository;
import edu.ues.sigtau.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class CoordinadorDashboardService {

    private final SesionRepository sesionRepository;
    private final UsuarioRepository usuarioRepository;
    private final AsignaturaRepository asignaturaRepository;

    @Transactional(readOnly = true)
    public CoordinadorDashboardResponse obtener() {
        DateTimeFormatter fecha = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter hora = DateTimeFormatter.ofPattern("HH:mm");

        var actividad = sesionRepository.findTop20ByOrderByFechaSolicitudDesc().stream()
                .limit(10)
                .map(s -> new CoordinadorDashboardResponse.ActividadReciente(
                        s.getId(),
                        s.getEstado().name(),
                        s.getEstudiante().getUsuario().getNombres() + " " + s.getEstudiante().getUsuario().getApellidos(),
                        s.getTutor().getUsuario().getNombres() + " " + s.getTutor().getUsuario().getApellidos(),
                        s.getAsignatura().getNombre(),
                        s.getFechaSesion().format(fecha),
                        s.getHoraInicio().format(hora)
                ))
                .toList();

        return new CoordinadorDashboardResponse(
                sesionRepository.count(),
                usuarioRepository.countByRolUsuarioAndActivoTrue(RolUsuario.TUTOR),
                usuarioRepository.countByRolUsuarioAndActivoTrue(RolUsuario.ESTUDIANTE),
                asignaturaRepository.countByActivaTrue(),
                actividad
        );
    }
}
