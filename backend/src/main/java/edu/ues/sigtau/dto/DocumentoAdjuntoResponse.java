package edu.ues.sigtau.dto;

import edu.ues.sigtau.model.DocumentoAdjunto;

import java.time.LocalDateTime;

public record DocumentoAdjuntoResponse(
        Integer id,
        String nombreOriginal,
        String tipoMime,
        Long tamanio,
        LocalDateTime fechaSubida
) {
    public static DocumentoAdjuntoResponse from(DocumentoAdjunto documento) {
        return new DocumentoAdjuntoResponse(
                documento.getId(),
                documento.getNombreOriginal(),
                documento.getTipoMime(),
                documento.getTamanio(),
                documento.getFechaSubida()
        );
    }
}
