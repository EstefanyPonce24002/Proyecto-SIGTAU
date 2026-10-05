package edu.ues.sigtau.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// RF-03: Recuperar Contraseña -- paso 1, solicitar el enlace
public record ForgotPasswordRequest(
        @NotBlank @Email String correo
) {}
