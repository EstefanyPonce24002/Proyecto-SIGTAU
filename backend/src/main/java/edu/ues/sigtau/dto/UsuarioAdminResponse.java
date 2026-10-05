package edu.ues.sigtau.dto;

import edu.ues.sigtau.model.RolUsuario;
import edu.ues.sigtau.model.Usuario;

import java.time.LocalDateTime;

/** Vista para la pantalla de administración de usuarios (RF-12). Nunca incluye la contraseña. */
public record UsuarioAdminResponse(
        Integer id,
        String nombres,
        String apellidos,
        String correo,
        RolUsuario rol,
        Boolean activo,
        LocalDateTime fechaRegistro,
        String carnet,        // solo ESTUDIANTE
        String carrera,       // solo ESTUDIANTE
        String especialidad   // solo TUTOR
) {
    public static UsuarioAdminResponse basico(Usuario u) {
        return new UsuarioAdminResponse(
                u.getId(), u.getNombres(), u.getApellidos(), u.getCorreo(),
                u.getRolUsuario(), u.getActivo(), u.getFechaRegistro(),
                null, null, null
        );
    }
}
