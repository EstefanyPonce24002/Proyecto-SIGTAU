package edu.ues.sigtau.service;

import edu.ues.sigtau.dto.UsuarioAdminResponse;
import edu.ues.sigtau.dto.ActualizarUsuarioRequest;
import edu.ues.sigtau.model.RolUsuario;
import edu.ues.sigtau.model.Usuario;
import edu.ues.sigtau.repository.EstudianteRepository;
import edu.ues.sigtau.repository.TutorRepository;
import edu.ues.sigtau.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final EstudianteRepository estudianteRepository;
    private final TutorRepository tutorRepository;

    @Transactional(readOnly = true)
    public List<UsuarioAdminResponse> listarTodos() {
        return usuarioRepository.findAll().stream().map(this::enriquecer).toList();
    }

    @Transactional
    public UsuarioAdminResponse cambiarEstado(Integer id, boolean activo) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        usuario.setActivo(activo);
        return enriquecer(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioAdminResponse actualizar(Integer id, ActualizarUsuarioRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        usuario.setNombres(request.nombres().trim());
        usuario.setApellidos(request.apellidos().trim());

        if (usuario.getRolUsuario() == RolUsuario.ESTUDIANTE) {
            estudianteRepository.findById(id).ifPresent(estudiante -> {
                if (request.carnet() != null && !request.carnet().isBlank())
                    estudiante.setCarnet(request.carnet().trim());
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

    private UsuarioAdminResponse enriquecer(Usuario u) {
        String carnet = null, carrera = null, especialidad = null;

        if (u.getRolUsuario() == RolUsuario.ESTUDIANTE) {
            var est = estudianteRepository.findById(u.getId()).orElse(null);
            if (est != null) {
                carnet = est.getCarnet();
                carrera = est.getCarrera();
            }
        } else if (u.getRolUsuario() == RolUsuario.TUTOR) {
            var tut = tutorRepository.findById(u.getId()).orElse(null);
            if (tut != null) {
                especialidad = tut.getEspecialidad();
            }
        }

        return new UsuarioAdminResponse(
                u.getId(), u.getNombres(), u.getApellidos(), u.getCorreo(),
                u.getRolUsuario(), u.getActivo(), u.getFechaRegistro(),
                carnet, carrera, especialidad);
    }
}
