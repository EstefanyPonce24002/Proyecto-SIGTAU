package edu.ues.sigtau.dto;

import edu.ues.sigtau.model.RolUsuario;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Los identificadores de estudiante y tutor se generan automáticamente en el backend.
public record RegistroRequest(
        @NotBlank String nombres,
        @NotBlank String apellidos,
        String correo, // Opcional: el backend genera el correo institucional automáticamente.
        String telefono,
        @NotBlank @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres") String contrasena,
        @NotNull RolUsuario rol,
        String carrera,
        String especialidad
) {}
