package edu.ues.sigtau.dto;

import edu.ues.sigtau.model.Mensaje;

import java.time.LocalDateTime;

public record MensajeResponse(
        Integer id,
        Integer idRemitente,
        String remitenteNombre,
        Integer idDestinatario,
        String destinatarioNombre,
        Integer idSesion,
        String contenido,
        Boolean leido,
        LocalDateTime fechaEnvio
) {
    public static MensajeResponse from(Mensaje m) {
        return new MensajeResponse(
                m.getId(),
                m.getRemitente().getId(),
                m.getRemitente().getNombres() + " " + m.getRemitente().getApellidos(),
                m.getDestinatario().getId(),
                m.getDestinatario().getNombres() + " " + m.getDestinatario().getApellidos(),
                m.getSesion() != null ? m.getSesion().getId() : null,
                m.getContenido(),
                m.getLeido(),
                m.getFechaEnvio()
        );
    }
}
