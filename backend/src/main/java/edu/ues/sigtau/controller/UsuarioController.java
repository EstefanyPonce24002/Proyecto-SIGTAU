package edu.ues.sigtau.controller;

import edu.ues.sigtau.dto.UsuarioAdminResponse;
import edu.ues.sigtau.dto.RegistroRequest;
import edu.ues.sigtau.dto.ActualizarAsignaturasTutorRequest;
import edu.ues.sigtau.dto.ActualizarUsuarioRequest;
import edu.ues.sigtau.dto.CambiarEstadoUsuarioRequest;
import edu.ues.sigtau.model.Usuario;
import edu.ues.sigtau.security.AuthenticatedUserService;
import edu.ues.sigtau.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final AuthenticatedUserService authenticatedUserService;

    @PostMapping("/coordinadores")
    public ResponseEntity<UsuarioAdminResponse> registrarCoordinador(
            @Valid @RequestBody RegistroRequest request) {
        return ResponseEntity.status(201).body(usuarioService.registrarCoordinador(request));
    }

    @GetMapping
    public ResponseEntity<List<UsuarioAdminResponse>> listarTodos() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<UsuarioAdminResponse> cambiarEstado(
            @PathVariable Integer id,
            @RequestParam boolean activo,
            @RequestBody(required = false) CambiarEstadoUsuarioRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario actor = authenticatedUserService.resolve(userDetails);
        String contrasenaActual = request == null ? null : request.contrasenaActual();
        return ResponseEntity.ok(
                usuarioService.cambiarEstado(id, activo, actor, contrasenaActual));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UsuarioAdminResponse> actualizar(
            @PathVariable Integer id,
            @Valid @RequestBody ActualizarUsuarioRequest request) {
        return ResponseEntity.ok(usuarioService.actualizar(id, request));
    }

    @PutMapping("/{id}/asignaturas")
    public ResponseEntity<Void> actualizarAsignaturasTutor(
            @PathVariable Integer id,
            @Valid @RequestBody ActualizarAsignaturasTutorRequest request) {

        usuarioService.actualizarAsignaturasTutor(
                id,
                request.idAsignaturas());

        return ResponseEntity.noContent().build();
    }
}
