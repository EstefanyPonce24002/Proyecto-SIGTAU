package edu.ues.sigtau.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// RF-03: Recuperar Contraseña -- paso 2, confirmar con el token recibido por correo
public record ResetPasswordRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 8) String nuevaContrasena
) {}
