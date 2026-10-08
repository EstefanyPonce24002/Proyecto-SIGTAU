package edu.ues.sigtau.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EnviarMensajeRequest(
        @NotNull Integer idDestinatario,
        Integer idSesion,
        @NotBlank @Size(max = 2000) String contenido
) {}
