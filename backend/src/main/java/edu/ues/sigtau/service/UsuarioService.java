
package edu.ues.sigtau.service;

import edu.ues.sigtau.dto.ActualizarUsuarioRequest;
import edu.ues.sigtau.dto.RegistroRequest;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
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
        usuario.setTelefono(
                request.telefono() == null || request.telefono().isBlank()
                        ? null
                        : request.telefono().trim());

        if (usuario.getRolUsuario() == RolUsuario.ESTUDIANTE) {
            estudianteRepository.findById(id).ifPresent(estudiante -> {
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

    /** Crea una cuenta de coordinador desde una sesión administrativa autenticada. */
    @Transactional
    public UsuarioAdminResponse registrarCoordinador(RegistroRequest request) {
        if (request.rol() != RolUsuario.COORDINADOR) {
            throw new IllegalArgumentException("Esta operación solo permite registrar usuarios con rol COORDINADOR");
        }
        String nombres = request.nombres().trim();
        String apellidos = request.apellidos().trim();
        String correo = generarCorreoCoordinador(nombres, apellidos);

        Usuario usuario = Usuario.builder()
                .nombres(nombres)
                .apellidos(apellidos)
                .correo(correo)
                .telefono(request.telefono() == null || request.telefono().isBlank()
                        ? null : request.telefono().trim())
                .contrasena(passwordEncoder.encode(request.contrasena()))
                .rolUsuario(RolUsuario.COORDINADOR)
                .activo(true)
                .build();

        return UsuarioAdminResponse.basico(usuarioRepository.save(usuario));
    }

    private String generarCorreoCoordinador(String nombres, String apellidos) {
        String base = normalizarPrimerComponente(nombres) + "." + normalizarPrimerComponente(apellidos);
        String dominio = "@sigtau.edu.sv";
        int maximoLocal = 150 - dominio.length();
        if (base.length() > maximoLocal) base = base.substring(0, maximoLocal);

        String candidato = base + dominio;
        int correlativo = 1;
        while (usuarioRepository.existsByCorreo(candidato)) {
            String sufijo = String.valueOf(correlativo++);
            int longitudBase = Math.max(1, maximoLocal - sufijo.length());
            candidato = (base.length() > longitudBase ? base.substring(0, longitudBase) : base)
                    + sufijo + dominio;
        }
        return candidato;
    }

    private String normalizarPrimerComponente(String valor) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("Nombres y apellidos son obligatorios");
        }
        String primero = valor.trim().split("\\s+")[0];
        String normalizado = java.text.Normalizer.normalize(
                primero, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(java.util.Locale.ROOT)
                .replaceAll("[^a-z0-9]", "");
        if (normalizado.isBlank()) {
            throw new IllegalArgumentException("No se pudo generar el correo institucional");
        }
        return normalizado;
    }

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
        String codigoTutor = null;
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
                codigoTutor = tutor.getCodigoTutor();
                especialidad = tutor.getEspecialidad();
            }
        }

        return new UsuarioAdminResponse(
                usuario.getId(),
                usuario.getNombres(),
                usuario.getApellidos(),
                usuario.getCorreo(),
                usuario.getTelefono(),
                usuario.getRolUsuario(),
                usuario.getActivo(),
                usuario.getFechaRegistro(),
                carnet,
                codigoTutor,
                carrera,
                especialidad);
    }
}
