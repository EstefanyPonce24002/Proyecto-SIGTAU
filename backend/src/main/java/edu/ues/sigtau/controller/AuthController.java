package edu.ues.sigtau.controller;

import edu.ues.sigtau.dto.*;
import edu.ues.sigtau.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoints públicos de autenticación.
 * Cubre RF-01 (Registrar Usuario), RF-02 (Iniciar Sesión)
 * y RF-03 (Recuperar Contraseña).
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/registro")
    public ResponseEntity<UsuarioAdminResponse> registrar(@Valid @RequestBody RegistroRequest request) {
        return ResponseEntity.status(201).body(authService.registrar(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.solicitarRecuperacion(request);
        // Siempre 200, para no revelar si el correo existe en el sistema.
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.confirmarRecuperacion(request);
        return ResponseEntity.ok().build();
    }
}
