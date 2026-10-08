package edu.ues.sigtau.repository;

import edu.ues.sigtau.model.RolUsuario;
import edu.ues.sigtau.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    Optional<Usuario> findByCorreo(String correo);
    boolean existsByCorreo(String correo);
    long countByActivoTrue();
    long countByRolUsuarioAndActivoTrue(RolUsuario rolUsuario);
}