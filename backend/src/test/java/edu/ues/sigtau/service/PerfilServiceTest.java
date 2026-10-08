package edu.ues.sigtau.service;

import edu.ues.sigtau.dto.CambiarContrasenaRequest;
import edu.ues.sigtau.dto.ActualizarPerfilRequest;
import edu.ues.sigtau.model.Estudiante;
import edu.ues.sigtau.model.RolUsuario;
import edu.ues.sigtau.model.Usuario;
import edu.ues.sigtau.repository.EstudianteRepository;
import edu.ues.sigtau.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PerfilServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private EstudianteRepository estudianteRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PerfilService perfilService;

    @Test
    void actualizaNombreYCarreraDelEstudiante() {
        Usuario usuario = Usuario.builder()
                .id(1)
                .nombres("Ana")
                .apellidos("López")
                .correo("ana@ues.edu.sv")
                .rolUsuario(RolUsuario.ESTUDIANTE)
                .build();
        Estudiante estudiante = Estudiante.builder()
                .id(1)
                .usuario(usuario)
                .carnet("20230001")
                .carrera("Ingeniería Civil")
                .build();

        when(estudianteRepository.findById(1)).thenReturn(Optional.of(estudiante));
        when(usuarioRepository.save(usuario)).thenReturn(usuario);
        when(estudianteRepository.save(estudiante)).thenReturn(estudiante);

        var response = perfilService.actualizar(
                usuario,
                new ActualizarPerfilRequest("Ana María", "López", "Ingeniería de Sistemas"));

        assertEquals("Ana María", response.nombres());
        assertEquals("López", response.apellidos());
        assertEquals("Ingeniería de Sistemas", response.carrera());
        verify(usuarioRepository).save(usuario);
        verify(estudianteRepository).save(estudiante);
    }

    @Test
    void rechazaCambioContrasenaSiLaActualEsIncorrecta() {
        Usuario usuario = Usuario.builder()
                .id(1)
                .contrasena("hash")
                .build();

        when(passwordEncoder.matches("incorrecta", "hash")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () ->
                perfilService.cambiarContrasena(
                        usuario,
                        new CambiarContrasenaRequest("incorrecta", "Nueva123!")));

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void cambiaContrasenaCuandoLaActualEsCorrecta() {
        Usuario usuario = Usuario.builder()
                .id(1)
                .contrasena("hash-viejo")
                .build();

        when(passwordEncoder.matches("actual", "hash-viejo")).thenReturn(true);
        when(passwordEncoder.matches("Nueva123!", "hash-viejo")).thenReturn(false);
        when(passwordEncoder.encode("Nueva123!")).thenReturn("hash-nuevo");

        perfilService.cambiarContrasena(
                usuario,
                new CambiarContrasenaRequest("actual", "Nueva123!"));

        assertEquals("hash-nuevo", usuario.getContrasena());
        verify(usuarioRepository).save(usuario);
    }
}
