package edu.ues.sigtau.controller;

import edu.ues.sigtau.dto.CrearHorarioRequest;
import edu.ues.sigtau.dto.HorarioResponse;
import edu.ues.sigtau.security.AuthenticatedUserService;
import edu.ues.sigtau.service.HorarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

@RestController
@RequestMapping("/api/horarios")
@RequiredArgsConstructor
public class HorarioController {

    private final HorarioService horarioService;
    private final AuthenticatedUserService authenticatedUserService;

    /**
     * Lista TODOS los bloques del tutor (disponibles y bloqueados), para la
     * pantalla de gestión.
     */
    @GetMapping("/tutor/{idTutor}")
    public ResponseEntity<List<HorarioResponse>> listarPorTutor(@PathVariable Integer idTutor,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(horarioService.listarPorTutor(idTutor,
                authenticatedUserService.resolve(userDetails).getId(),
                authenticatedUserService.isCoordinator(userDetails)));
    }

    @PostMapping
    public ResponseEntity<HorarioResponse> crear(@Valid @RequestBody CrearHorarioRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(201).body(horarioService.crear(request,
                authenticatedUserService.resolve(userDetails).getId(),
                authenticatedUserService.isCoordinator(userDetails)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails) {
        horarioService.eliminar(id, authenticatedUserService.resolve(userDetails).getId(),
                authenticatedUserService.isCoordinator(userDetails));
        return ResponseEntity.noContent().build();
    }
}
