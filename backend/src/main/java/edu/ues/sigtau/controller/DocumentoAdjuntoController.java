package edu.ues.sigtau.controller;

import edu.ues.sigtau.dto.DocumentoAdjuntoResponse;
import edu.ues.sigtau.model.DocumentoAdjunto;
import edu.ues.sigtau.security.AuthenticatedUserService;
import edu.ues.sigtau.service.DocumentoAdjuntoService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/sesiones")
@RequiredArgsConstructor
public class DocumentoAdjuntoController {

    private final DocumentoAdjuntoService documentoService;
    private final AuthenticatedUserService authenticatedUserService;

    @PostMapping("/{idSesion}/adjuntos")
    public ResponseEntity<DocumentoAdjuntoResponse> subir(
            @PathVariable Integer idSesion,
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(201).body(documentoService.guardar(
                idSesion, file,
                authenticatedUserService.resolve(userDetails).getId(),
                authenticatedUserService.isCoordinator(userDetails)));
    }

    @GetMapping("/{idSesion}/adjuntos")
    public ResponseEntity<List<DocumentoAdjuntoResponse>> listar(
            @PathVariable Integer idSesion,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(documentoService.listar(
                idSesion,
                authenticatedUserService.resolve(userDetails).getId(),
                authenticatedUserService.isCoordinator(userDetails)));
    }

    @GetMapping("/adjuntos/{idDocumento}/descarga")
    public ResponseEntity<Resource> descargar(
            @PathVariable Integer idDocumento,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer actorId = authenticatedUserService.resolve(userDetails).getId();
        boolean coordinator = authenticatedUserService.isCoordinator(userDetails);
        DocumentoAdjunto documento = documentoService.obtener(idDocumento, actorId, coordinator);
        Resource resource = documentoService.descargar(idDocumento, actorId, coordinator);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(documento.getTipoMime()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(documento.getNombreOriginal()).build().toString())
                .body(resource);
    }
}
