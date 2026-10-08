package edu.ues.sigtau.service;

import edu.ues.sigtau.dto.*;
import edu.ues.sigtau.model.PasswordResetToken;
import edu.ues.sigtau.model.RolUsuario;
import edu.ues.sigtau.model.Usuario;
import edu.ues.sigtau.repository.PasswordResetTokenRepository;
import edu.ues.sigtau.repository.UsuarioRepository;
import edu.ues.sigtau.security.CustomUserDetailsService;
import edu.ues.sigtau.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final edu.ues.sigtau.repository.EstudianteRepository estudianteRepository;
    private final edu.ues.sigtau.repository.TutorRepository tutorRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final EmailService emailService;
    // Inyectar aquí un EmailService real (SMTP/SendGrid) cuando esté disponible.

    private static final long RESET_TOKEN_EXPIRY_MINUTES = 30;

    /** RF-02: Iniciar Sesión */
    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.correo(), request.contrasena())
        );

        Usuario usuario = usuarioRepository.findByCorreo(request.correo())
                .orElseThrow(() -> new IllegalStateException("Usuario no encontrado tras autenticar"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(usuario.getCorreo());
        String token = jwtService.generateToken(userDetails, Map.of(
                "rol", usuario.getRolUsuario().name(),
                "idUsuario", usuario.getId()
        ));

        return new LoginResponse(
                token,
                usuario.getNombres() + " " + usuario.getApellidos(),
                usuario.getRolUsuario().name(),
                usuario.getId()
        );
    }

    /** RF-01: Registrar Usuario */
    @Transactional
    public UsuarioAdminResponse registrar(RegistroRequest request) {
        if (usuarioRepository.existsByCorreo(request.correo())) {
            throw new IllegalArgumentException("El correo ya está registrado");
        }

        Usuario usuario = Usuario.builder()
                .nombres(request.nombres())
                .apellidos(request.apellidos())
                .correo(request.correo())
                .contrasena(passwordEncoder.encode(request.contrasena()))
                .rolUsuario(request.rol())
                .activo(true)
                .build();

        usuario = usuarioRepository.save(usuario);

        if (request.rol() == RolUsuario.ESTUDIANTE) {
            if (request.carnet() == null || request.carnet().isBlank()) {
                throw new IllegalArgumentException("El carnet es obligatorio para un estudiante");
            }
            estudianteRepository.save(edu.ues.sigtau.model.Estudiante.builder()
                    .usuario(usuario)
                    .carnet(request.carnet())
                    .carrera(request.carrera())
                    .build());
        } else if (request.rol() == RolUsuario.TUTOR) {
            tutorRepository.save(edu.ues.sigtau.model.Tutor.builder()
                    .usuario(usuario)
                    .especialidad(request.especialidad())
                    .build());
        }

        // TODO: enviar correo de confirmación de cuenta (exigido por RF-01).

        return UsuarioAdminResponse.basico(usuario);
    }

    /** RF-03: Recuperar Contraseña -- paso 1 */
    @Transactional
    public void solicitarRecuperacion(ForgotPasswordRequest request) {
        Usuario usuario = usuarioRepository.findByCorreo(request.correo())
                .orElse(null);

        // Por seguridad, no revelamos si el correo existe o no.
        if (usuario == null) return;

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .usuario(usuario)
                .token(token)
                .usado(false)
                .expiraEn(LocalDateTime.now().plusMinutes(RESET_TOKEN_EXPIRY_MINUTES))
                .build();

        resetTokenRepository.save(resetToken);

        emailService.enviarRecuperacion(usuario.getCorreo(), usuario.getNombres(), token);
    }

    /** RF-03: Recuperar Contraseña -- paso 2 */
    @Transactional
    public void confirmarRecuperacion(ResetPasswordRequest request) {
        PasswordResetToken resetToken = resetTokenRepository.findByTokenAndUsadoFalse(request.token())
                .orElseThrow(() -> new IllegalArgumentException("Token inválido o ya utilizado"));

        if (resetToken.getExpiraEn().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("El enlace de recuperación ha expirado");
        }

        Usuario usuario = resetToken.getUsuario();
        usuario.setContrasena(passwordEncoder.encode(request.nuevaContrasena()));
        usuarioRepository.save(usuario);

        resetToken.setUsado(true);
        resetTokenRepository.save(resetToken);
    }
}
