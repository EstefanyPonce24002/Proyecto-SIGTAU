package edu.ues.sigtau.controller;

import edu.ues.sigtau.dto.ActualizarPerfilRequest;
import edu.ues.sigtau.dto.CambiarContrasenaRequest;
import edu.ues.sigtau.dto.PerfilResponse;
import edu.ues.sigtau.security.AuthenticatedUserService;
import edu.ues.sigtau.service.PerfilService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/perfil")
@RequiredArgsConstructor
public class PerfilController {

    private final PerfilService perfilService;
    private final AuthenticatedUserService authenticatedUserService;

    @GetMapping
    public ResponseEntity<PerfilResponse> obtener(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(perfilService.obtener(
                authenticatedUserService.resolve(userDetails)));
    }

    @PatchMapping
    public ResponseEntity<PerfilResponse> actualizar(
            @Valid @RequestBody ActualizarPerfilRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(perfilService.actualizar(
                authenticatedUserService.resolve(userDetails), request));
    }

    @PatchMapping("/contrasena")
    public ResponseEntity<Void> cambiarContrasena(
            @Valid @RequestBody CambiarContrasenaRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        perfilService.cambiarContrasena(
                authenticatedUserService.resolve(userDetails), request);
        return ResponseEntity.noContent().build();
    }
}
