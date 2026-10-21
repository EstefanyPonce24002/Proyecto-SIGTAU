
package edu.ues.sigtau.service;

import edu.ues.sigtau.dto.ActualizarUsuarioRequest;
import edu.ues.sigtau.dto.UsuarioAdminResponse;
import edu.ues.sigtau.model.Asignatura;
import edu.ues.sigtau.model.RolUsuario;
import edu.ues.sigtau.model.Tutor;
import edu.ues.sigtau.model.TutorAsignatura;
import edu.ues.sigtau.model.Usuario;
import edu.ues.sigtau.repository.AsignaturaRepository;
import edu.ues.sigtau.repository.EstudianteRepository;
import edu.ues.sigtau.repository.TutorAsignaturaRepository;
import edu.ues.sigtau.repository.TutorRepository;
import edu.ues.sigtau.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final EstudianteRepository estudianteRepository;
    private final TutorRepository tutorRepository;
    private final AsignaturaRepository asignaturaRepository;
    private final TutorAsignaturaRepository tutorAsignaturaRepository;

    @Transactional(readOnly = true)
    public List<UsuarioAdminResponse> listarTodos() {
        return usuarioRepository.findAll()
                .stream()
                .map(this::enriquecer)
                .toList();
    }

    @Transactional
    public UsuarioAdminResponse cambiarEstado(Integer id, boolean activo) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        usuario.setActivo(activo);
        return enriquecer(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioAdminResponse actualizar(
            Integer id,
            ActualizarUsuarioRequest request) {

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        usuario.setNombres(request.nombres().trim());
        usuario.setApellidos(request.apellidos().trim());

        if (usuario.getRolUsuario() == RolUsuario.ESTUDIANTE) {
            estudianteRepository.findById(id).ifPresent(estudiante -> {
                if (request.carnet() != null
                        && !request.carnet().isBlank()) {
                    estudiante.setCarnet(request.carnet().trim());
                }

                estudiante.setCarrera(request.carrera());
                estudianteRepository.save(estudiante);
            });

        } else if (usuario.getRolUsuario() == RolUsuario.TUTOR) {
            tutorRepository.findById(id).ifPresent(tutor -> {
                tutor.setEspecialidad(request.especialidad());
                tutorRepository.save(tutor);
            });
        }

        return enriquecer(usuarioRepository.save(usuario));
    }

    @Transactional
    public void actualizarAsignaturasTutor(
            Integer idTutor,
            List<Integer> idsSolicitados) {

        if (idsSolicitados == null
                || idsSolicitados.stream().anyMatch(id -> id == null)) {
            throw new IllegalArgumentException(
                    "La lista de asignaturas y sus identificadores son obligatorios");
        }

        Tutor tutor = tutorRepository.findById(idTutor)
                .orElseThrow(() -> new IllegalArgumentException("Tutor no encontrado"));

        if (tutor.getUsuario() == null
                || !Boolean.TRUE.equals(tutor.getUsuario().getActivo())) {
            throw new IllegalStateException(
                    "No se pueden modificar asignaturas de un tutor inactivo");
        }

        Set<Integer> nuevas = new HashSet<>(idsSolicitados);

        if (nuevas.size() != idsSolicitados.size()) {
            throw new IllegalArgumentException(
                    "La selección contiene asignaturas duplicadas");
        }

        List<TutorAsignatura> actuales = tutorAsignaturaRepository.findByTutor_Id(idTutor);

        Set<Integer> existentes = actuales.stream()
                .map(ta -> ta.getAsignatura().getId())
                .collect(Collectors.toSet());

        // Validar las nuevas asignaturas antes de modificar relaciones.
        for (Integer idAsignatura : nuevas) {
            if (existentes.contains(idAsignatura)) {
                continue;
            }

            Asignatura asignatura = asignaturaRepository.findById(idAsignatura)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Asignatura no encontrada: " + idAsignatura));

            if (!Boolean.TRUE.equals(asignatura.getActiva())) {
                throw new IllegalStateException(
                        "No se puede asignar una asignatura inactiva: "
                                + asignatura.getNombre());
            }
        }

        // Eliminar solo las relaciones desmarcadas.
        actuales.stream()
                .filter(ta -> !nuevas.contains(ta.getAsignatura().getId()))
                .forEach(tutorAsignaturaRepository::delete);

        // Crear solo las relaciones nuevas.
        for (Integer idAsignatura : nuevas) {
            if (existentes.contains(idAsignatura)) {
                continue;
            }

            Asignatura asignatura = asignaturaRepository.findById(idAsignatura)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Asignatura no encontrada: " + idAsignatura));

            tutorAsignaturaRepository.save(
                    TutorAsignatura.builder()
                            .tutor(tutor)
                            .asignatura(asignatura)
                            .build());
        }
    }

    private UsuarioAdminResponse enriquecer(Usuario usuario) {
        String carnet = null;
        String carrera = null;
        String especialidad = null;

        if (usuario.getRolUsuario() == RolUsuario.ESTUDIANTE) {
            var estudiante = estudianteRepository
                    .findById(usuario.getId())
                    .orElse(null);

            if (estudiante != null) {
                carnet = estudiante.getCarnet();
                carrera = estudiante.getCarrera();
            }

        } else if (usuario.getRolUsuario() == RolUsuario.TUTOR) {
            var tutor = tutorRepository
                    .findById(usuario.getId())
                    .orElse(null);

            if (tutor != null) {
                especialidad = tutor.getEspecialidad();
            }
        }

        return new UsuarioAdminResponse(
                usuario.getId(),
                usuario.getNombres(),
                usuario.getApellidos(),
                usuario.getCorreo(),
                usuario.getRolUsuario(),
                usuario.getActivo(),
                usuario.getFechaRegistro(),
                carnet,
                carrera,
                especialidad);
    }
}
