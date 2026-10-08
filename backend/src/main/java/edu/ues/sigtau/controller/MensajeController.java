package edu.ues.sigtau.controller;

import edu.ues.sigtau.dto.ContactoMensajeResponse;
import edu.ues.sigtau.dto.EnviarMensajeRequest;
import edu.ues.sigtau.dto.MensajeResponse;
import edu.ues.sigtau.security.AuthenticatedUserService;
import edu.ues.sigtau.service.MensajeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mensajes")
@RequiredArgsConstructor
public class MensajeController {

    private final MensajeService mensajeService;
    private final AuthenticatedUserService authenticatedUserService;

    @GetMapping("/contactos")
    public ResponseEntity<List<ContactoMensajeResponse>> contactos(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(mensajeService.contactos(
                authenticatedUserService.resolve(userDetails).getId()));
    }

    @GetMapping
    public ResponseEntity<List<MensajeResponse>> listar(
            @RequestParam(required = false) Integer contactoId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(mensajeService.listar(
                authenticatedUserService.resolve(userDetails).getId(),
                contactoId,
                authenticatedUserService.isCoordinator(userDetails)));
    }

    @PostMapping
    public ResponseEntity<MensajeResponse> enviar(
            @Valid @RequestBody EnviarMensajeRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(201).body(mensajeService.enviar(
                request,
                authenticatedUserService.resolve(userDetails).getId(),
                authenticatedUserService.isCoordinator(userDetails)));
    }

    @PatchMapping("/{id}/leida")
    public ResponseEntity<Void> marcarLeido(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails) {
        mensajeService.marcarLeido(id, authenticatedUserService.resolve(userDetails).getId());
        return ResponseEntity.noContent().build();
    }
}
