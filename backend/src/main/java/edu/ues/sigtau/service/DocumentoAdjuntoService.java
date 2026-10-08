package edu.ues.sigtau.service;

import edu.ues.sigtau.dto.DocumentoAdjuntoResponse;
import edu.ues.sigtau.model.DocumentoAdjunto;
import edu.ues.sigtau.model.Sesion;
import edu.ues.sigtau.repository.DocumentoAdjuntoRepository;
import edu.ues.sigtau.repository.SesionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentoAdjuntoService {
    private static final long MAX_FILE_SIZE = 25L * 1024 * 1024;
    private static final int MAX_FILES_PER_SESSION = 5;
    private static final Set<String> EXTENSIONES_PERMITIDAS = Set.of("pdf", "doc", "docx", "xls", "xlsx");
    private static final Set<String> MIME_PERMITIDOS = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    private final DocumentoAdjuntoRepository documentoRepository;
    private final SesionRepository sesionRepository;

    @Value("$" + "{sigtau.storage.upload-dir:./uploads}")
    private String uploadDir;

    @Transactional
    public DocumentoAdjuntoResponse guardar(Integer idSesion, MultipartFile file, Integer actorId, boolean coordinator) {
        Sesion sesion = obtenerSesion(idSesion);
        if (!coordinator && !sesion.getEstudiante().getId().equals(actorId)) {
            throw new IllegalStateException("Solo el estudiante de la sesión puede adjuntar documentos");
        }
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("El archivo no puede estar vacío");
        if (file.getSize() > MAX_FILE_SIZE) throw new IllegalArgumentException("El archivo supera el límite de 25 MB");
        if (documentoRepository.countBySesion_Id(idSesion) >= MAX_FILES_PER_SESSION) {
            throw new IllegalArgumentException("Una tutoría admite como máximo 5 documentos");
        }

        String nombreOriginal = file.getOriginalFilename();
        if (nombreOriginal == null || nombreOriginal.isBlank()) throw new IllegalArgumentException("El archivo no tiene un nombre válido");

        String extension = extension(nombreOriginal);
        String contentType = file.getContentType();
        if (!EXTENSIONES_PERMITIDAS.contains(extension) || contentType == null || !MIME_PERMITIDOS.contains(contentType)) {
            throw new IllegalArgumentException("Tipo de archivo no permitido. Solo PDF, DOC, DOCX, XLS y XLSX");
        }

        try {
            Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(base);
            String nombreSeguro = UUID.randomUUID() + "." + extension;
            Path destino = base.resolve(nombreSeguro).normalize();
            if (!destino.startsWith(base)) throw new IllegalArgumentException("Ruta de archivo inválida");

            file.transferTo(destino);
            DocumentoAdjunto documento = DocumentoAdjunto.builder()
                    .sesion(sesion)
                    .nombreOriginal(Paths.get(nombreOriginal).getFileName().toString())
                    .rutaArchivo(destino.toString())
                    .tipoMime(contentType)
                    .tamanio(file.getSize())
                    .build();
            return DocumentoAdjuntoResponse.from(documentoRepository.save(documento));
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo guardar el documento", e);
        }
    }

    @Transactional(readOnly = true)
    public List<DocumentoAdjuntoResponse> listar(Integer idSesion, Integer actorId, boolean coordinator) {
        validarAcceso(obtenerSesion(idSesion), actorId, coordinator);
        return documentoRepository.findBySesion_IdOrderByFechaSubidaAsc(idSesion).stream()
                .map(DocumentoAdjuntoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Resource descargar(Integer idDocumento, Integer actorId, boolean coordinator) {
        DocumentoAdjunto documento = obtener(idDocumento, actorId, coordinator);
        try {
            Path path = Paths.get(documento.getRutaArchivo()).toAbsolutePath().normalize();
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) throw new IllegalArgumentException("El archivo ya no está disponible");
            return resource;
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo acceder al documento", e);
        }
    }

    @Transactional(readOnly = true)
    public DocumentoAdjunto obtener(Integer idDocumento, Integer actorId, boolean coordinator) {
        DocumentoAdjunto documento = documentoRepository.findById(idDocumento)
                .orElseThrow(() -> new IllegalArgumentException("Documento no encontrado"));
        validarAcceso(documento.getSesion(), actorId, coordinator);
        return documento;
    }

    private Sesion obtenerSesion(Integer idSesion) {
        return sesionRepository.findById(idSesion).orElseThrow(() -> new IllegalArgumentException("Sesión no encontrada"));
    }

    private void validarAcceso(Sesion sesion, Integer actorId, boolean coordinator) {
        boolean participante = sesion.getEstudiante().getId().equals(actorId) || sesion.getTutor().getId().equals(actorId);
        if (!coordinator && !participante) throw new IllegalStateException("No tiene acceso a los documentos de esta sesión");
    }

    private String extension(String nombre) {
        int punto = nombre.lastIndexOf('.');
        return punto >= 0 ? nombre.substring(punto + 1).toLowerCase() : "";
    }
}
