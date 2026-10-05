package edu.ues.sigtau.dto;

import edu.ues.sigtau.model.Notificacion;
import edu.ues.sigtau.model.TipoNotificacion;

import java.time.LocalDateTime;

public record NotificacionResponse(
        Integer id,
        TipoNotificacion tipo,
        String mensaje,
        Boolean leida,
        LocalDateTime fechaEnvio,
        Integer idSesion
) {
    public static NotificacionResponse from(Notificacion n) {
        return new NotificacionResponse(
                n.getId(), n.getTipo(), n.getMensaje(), n.getLeida(),
                n.getFechaEnvio(), n.getSesion() != null ? n.getSesion().getId() : null
        );
    }
}
