package edu.ues.sigtau.controller;

import edu.ues.sigtau.dto.GenerarReporteRequest;
import edu.ues.sigtau.dto.ReporteGeneradoResponse;
import edu.ues.sigtau.model.Usuario;
import edu.ues.sigtau.repository.UsuarioRepository;
import edu.ues.sigtau.service.ReporteService;
import edu.ues.sigtau.service.CoordinadorDashboardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;
    private final CoordinadorDashboardService dashboardService;
    private final UsuarioRepository usuarioRepository;

    @PostMapping("/generar")
    public ResponseEntity<ReporteGeneradoResponse> generar(
            @Valid @RequestBody GenerarReporteRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Usuario coordinador = usuarioRepository.findByCorreo(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuario autenticado no encontrado"));
        return ResponseEntity.ok(reporteService.generar(request, coordinador.getId()));
    }
    @GetMapping("/dashboard")
    public ResponseEntity<edu.ues.sigtau.dto.CoordinadorDashboardResponse> dashboard() {
        return ResponseEntity.ok(dashboardService.obtener());
    }

}
