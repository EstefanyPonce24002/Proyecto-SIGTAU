package edu.ues.sigtau.controller;

import edu.ues.sigtau.dto.SesionResponse;
import edu.ues.sigtau.dto.SolicitarSesionRequest;
import edu.ues.sigtau.service.SesionService;
import edu.ues.sigtau.security.AuthenticatedUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/sesiones")
@RequiredArgsConstructor
public class SesionController {

    private final SesionService sesionService;
    private final AuthenticatedUserService authenticatedUserService;

    /** RF-04 */
    @PostMapping
    public ResponseEntity<SesionResponse> solicitar(@Valid @RequestBody SolicitarSesionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(201)
                .body(sesionService.solicitar(request, authenticatedUserService.resolve(userDetails).getId()));
    }

    /** RF-07 */
    @PatchMapping("/{id}/resolver")
    public ResponseEntity<SesionResponse> resolver(
            @PathVariable Integer id,
            @RequestParam boolean aprobar,
            @RequestParam(required = false) String justificacion,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sesionService.resolverSolicitud(id, aprobar, justificacion,
                authenticatedUserService.resolve(userDetails).getId(),
                authenticatedUserService.isCoordinator(userDetails)));
    }

    /** Cancelación (sin RF formal aún, ver documento de correcciones) */
    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<SesionResponse> cancelar(@PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sesionService.cancelar(id, authenticatedUserService.resolve(userDetails).getId(),
                authenticatedUserService.isCoordinator(userDetails)));
    }

    /** RF-08 */
    @PatchMapping("/{id}/seguimiento")
    public ResponseEntity<SesionResponse> registrarSeguimiento(
            @PathVariable Integer id,
            @RequestParam Boolean asistencia,
            @RequestParam(required = false) String observaciones,
            @RequestParam BigDecimal calificacion,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sesionService.registrarSeguimiento(id, asistencia, observaciones, calificacion,
                authenticatedUserService.resolve(userDetails).getId(),
                authenticatedUserService.isCoordinator(userDetails)));
    }

    /** RF-09 */
    @GetMapping("/estudiante/{idEstudiante}")
    public ResponseEntity<List<SesionResponse>> historialEstudiante(@PathVariable Integer idEstudiante,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sesionService.historialEstudiante(idEstudiante,
                authenticatedUserService.resolve(userDetails).getId(),
                authenticatedUserService.isCoordinator(userDetails)));
    }

    @GetMapping("/tutor/{idTutor}")
    public ResponseEntity<List<SesionResponse>> historialTutor(@PathVariable Integer idTutor,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sesionService.historialTutor(idTutor,
                authenticatedUserService.resolve(userDetails).getId(),
                authenticatedUserService.isCoordinator(userDetails)));
    }

    /**
     * Subconjunto de historialTutor filtrado a PENDIENTE, usado por
     * SolicitudesPendientes.tsx
     */
    @GetMapping("/tutor/{idTutor}/pendientes")
    public ResponseEntity<List<SesionResponse>> pendientesTutor(@PathVariable Integer idTutor,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sesionService.pendientesTutor(idTutor,
                authenticatedUserService.resolve(userDetails).getId(),
                authenticatedUserService.isCoordinator(userDetails)));
    }
}
