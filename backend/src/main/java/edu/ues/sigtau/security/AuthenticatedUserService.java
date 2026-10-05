package edu.ues.sigtau.security;

import edu.ues.sigtau.model.Usuario;
import edu.ues.sigtau.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticatedUserService {

    private final UsuarioRepository usuarioRepository;

    public Usuario resolve(UserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalStateException("Usuario autenticado no encontrado");
        }

        return usuarioRepository.findByCorreo(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuario autenticado no encontrado"));
    }

    public boolean isCoordinator(UserDetails userDetails) {
        return userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_COORDINADOR".equals(authority.getAuthority()));
    }
}
