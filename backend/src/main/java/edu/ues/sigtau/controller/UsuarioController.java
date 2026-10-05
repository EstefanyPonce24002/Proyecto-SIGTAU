package edu.ues.sigtau.controller;

import edu.ues.sigtau.dto.UsuarioAdminResponse;
import edu.ues.sigtau.dto.ActualizarUsuarioRequest;
import edu.ues.sigtau.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<List<UsuarioAdminResponse>> listarTodos() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<UsuarioAdminResponse> cambiarEstado(@PathVariable Integer id, @RequestParam boolean activo) {
        return ResponseEntity.ok(usuarioService.cambiarEstado(id, activo));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UsuarioAdminResponse> actualizar(
            @PathVariable Integer id,
            @Valid @RequestBody ActualizarUsuarioRequest request) {
        return ResponseEntity.ok(usuarioService.actualizar(id, request));
    }
}
