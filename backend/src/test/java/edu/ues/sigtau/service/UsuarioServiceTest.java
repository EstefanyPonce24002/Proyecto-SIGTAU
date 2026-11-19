package edu.ues.sigtau.service;

import edu.ues.sigtau.model.RolUsuario;
import edu.ues.sigtau.model.Usuario;
import edu.ues.sigtau.repository.AsignaturaRepository;
import edu.ues.sigtau.repository.EstudianteRepository;
import edu.ues.sigtau.repository.TutorAsignaturaRepository;
import edu.ues.sigtau.repository.TutorRepository;
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
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private EstudianteRepository estudianteRepository;
    @Mock
    private TutorRepository tutorRepository;
    @Mock
    private AsignaturaRepository asignaturaRepository;
    @Mock
    private TutorAsignaturaRepository tutorAsignaturaRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private CorreoInstitucionalService correoInstitucionalService;

    @InjectMocks
    private UsuarioService usuarioService;

    @Test
    void noPermiteDesactivarLaCuentaDelCoordinadorAutenticado() {
        Usuario coordinador = coordinador(1);

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> usuarioService.cambiarEstado(1, false, coordinador, "secreto"));

        assertEquals("No puedes desactivar la cuenta que estás usando", error.getMessage());
        verifyNoInteractions(usuarioRepository, passwordEncoder);
    }

    @Test
    void exigeContrasenaCorrectaParaDesactivar() {
        Usuario coordinador = coordinador(1);
        when(passwordEncoder.matches("incorrecta", "hash-coordinador")).thenReturn(false);

        assertThrows(IllegalArgumentException.class,
                () -> usuarioService.cambiarEstado(2, false, coordinador, "incorrecta"));

        verify(usuarioRepository, never()).findById(anyInt());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void desactivaOtroUsuarioConContrasenaValida() {
        Usuario coordinador = coordinador(1);
        Usuario usuario = Usuario.builder()
                .id(2)
                .nombres("Ana")
                .apellidos("Pérez")
                .correo("ana@sigtau.edu.sv")
                .contrasena("hash-usuario")
                .rolUsuario(RolUsuario.COORDINADOR)
                .activo(true)
                .build();
        when(passwordEncoder.matches("secreto", "hash-coordinador")).thenReturn(true);
        when(usuarioRepository.findById(2)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(usuario)).thenReturn(usuario);

        usuarioService.cambiarEstado(2, false, coordinador, "secreto");

        assertEquals(false, usuario.getActivo());
        verify(usuarioRepository).save(usuario);
    }

    private Usuario coordinador(Integer id) {
        return Usuario.builder()
                .id(id)
                .nombres("Coordinación")
                .apellidos("Académica")
                .correo("coordinacion@sigtau.edu.sv")
                .contrasena("hash-coordinador")
                .rolUsuario(RolUsuario.COORDINADOR)
                .activo(true)
                .build();
    }
}