package edu.ues.sigtau.controller;

import edu.ues.sigtau.dto.NotificacionResponse;
import edu.ues.sigtau.model.Usuario;
import edu.ues.sigtau.repository.UsuarioRepository;
import edu.ues.sigtau.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionService notificacionService;
    private final UsuarioRepository usuarioRepository;

    /** Resuelve el id del usuario autenticado a partir del correo (subject del JWT). */
    private Integer idUsuarioActual(UserDetails userDetails) {
        Usuario usuario = usuarioRepository.findByCorreo(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuario autenticado no encontrado"));
        return usuario.getId();
    }

    /** RF-10: notificaciones del usuario autenticado (cualquier rol), más recientes primero. */
    @GetMapping
    public ResponseEntity<List<NotificacionResponse>> listarPropias(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(notificacionService.listarPropias(idUsuarioActual(userDetails)));
    }

    @PatchMapping("/{id}/leida")
    public ResponseEntity<NotificacionResponse> marcarLeida(
            @PathVariable Integer id, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(notificacionService.marcarLeida(id, idUsuarioActual(userDetails)));
    }

    @PatchMapping("/marcar-todas")
    public ResponseEntity<Void> marcarTodasLeidas(@AuthenticationPrincipal UserDetails userDetails) {
        notificacionService.marcarTodasLeidas(idUsuarioActual(userDetails));
        return ResponseEntity.noContent().build();
    }
}
