package edu.ues.sigtau.controller;

import edu.ues.sigtau.dto.AsignaturaResponse;
import edu.ues.sigtau.dto.CrearAsignaturaRequest;
import edu.ues.sigtau.service.AsignaturaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** RF-12: administración de asignaturas (distinto del listado público de CatalogoController). */
@RestController
@RequestMapping("/api/asignaturas")
@RequiredArgsConstructor
public class AsignaturaController {

    private final AsignaturaService asignaturaService;

    /** Todas las asignaturas (activas e inactivas) -- para la pantalla de administración. */
    @GetMapping("/todas")
    public ResponseEntity<List<AsignaturaResponse>> listarTodas() {
        return ResponseEntity.ok(asignaturaService.listarTodas());
    }

    @PostMapping
    public ResponseEntity<AsignaturaResponse> crear(@Valid @RequestBody CrearAsignaturaRequest request) {
        return ResponseEntity.status(201).body(asignaturaService.crear(request));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<AsignaturaResponse> cambiarEstado(@PathVariable Integer id, @RequestParam boolean activa) {
        return ResponseEntity.ok(asignaturaService.cambiarEstado(id, activa));
    }
}
