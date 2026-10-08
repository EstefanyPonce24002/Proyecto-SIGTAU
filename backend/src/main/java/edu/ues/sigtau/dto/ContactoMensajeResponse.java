package edu.ues.sigtau.dto;

import edu.ues.sigtau.model.Usuario;

public record ContactoMensajeResponse(
        Integer id,
        String nombreCompleto,
        String rol
) {
    public static ContactoMensajeResponse from(Usuario u) {
        return new ContactoMensajeResponse(
                u.getId(),
                u.getNombres() + " " + u.getApellidos(),
                u.getRolUsuario().name()
        );
    }
}
