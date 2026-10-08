package edu.ues.sigtau.service;

import edu.ues.sigtau.dto.ActualizarPerfilRequest;
import edu.ues.sigtau.dto.CambiarContrasenaRequest;
import edu.ues.sigtau.dto.PerfilResponse;
import edu.ues.sigtau.model.Estudiante;
import edu.ues.sigtau.model.RolUsuario;
import edu.ues.sigtau.model.Usuario;
import edu.ues.sigtau.repository.EstudianteRepository;
import edu.ues.sigtau.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PerfilService {

    private final UsuarioRepository usuarioRepository;
    private final EstudianteRepository estudianteRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PerfilResponse obtener(Usuario usuario) {
        Estudiante estudiante = estudianteRepository.findById(usuario.getId()).orElse(null);
        return toResponse(usuario, estudiante);
    }

    @Transactional
    public PerfilResponse actualizar(Usuario usuario, ActualizarPerfilRequest request) {
        usuario.setNombres(request.nombres().trim());
        usuario.setApellidos(request.apellidos().trim());
        usuarioRepository.save(usuario);

        Estudiante estudiante = estudianteRepository.findById(usuario.getId()).orElse(null);
        if (estudiante != null && request.carrera() != null && !request.carrera().isBlank()) {
            estudiante.setCarrera(request.carrera().trim());
            estudianteRepository.save(estudiante);
        }

        return toResponse(usuario, estudiante);
    }

    @Transactional
    public void cambiarContrasena(Usuario usuario, CambiarContrasenaRequest request) {
        if (!passwordEncoder.matches(request.contrasenaActual(), usuario.getContrasena())) {
            throw new IllegalArgumentException("La contraseña actual es incorrecta");
        }

        if (passwordEncoder.matches(request.nuevaContrasena(), usuario.getContrasena())) {
            throw new IllegalArgumentException("La nueva contraseña debe ser diferente de la actual");
        }

        usuario.setContrasena(passwordEncoder.encode(request.nuevaContrasena()));
        usuarioRepository.save(usuario);
    }

    private PerfilResponse toResponse(Usuario usuario, Estudiante estudiante) {
        return new PerfilResponse(
                usuario.getId(),
                usuario.getNombres(),
                usuario.getApellidos(),
                usuario.getCorreo(),
                usuario.getRolUsuario(),
                estudiante != null ? estudiante.getCarnet() : null,
                estudiante != null ? estudiante.getCarrera() : null,
                estudiante != null ? estudiante.getCicloActual() : null
        );
    }
}
