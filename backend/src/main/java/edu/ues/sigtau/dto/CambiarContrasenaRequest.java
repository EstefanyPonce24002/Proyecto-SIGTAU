package edu.ues.sigtau.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CambiarContrasenaRequest(
        @NotBlank String contrasenaActual,
        @NotBlank @Size(min = 8, message = "La nueva contraseña debe tener al menos 8 caracteres")
        String nuevaContrasena
) {}
