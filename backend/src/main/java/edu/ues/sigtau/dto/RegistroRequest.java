package edu.ues.sigtau.dto;

import edu.ues.sigtau.model.RolUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// RF-01: Registrar Usuario
// carnet/carrera se usan cuando rol=ESTUDIANTE; especialidad cuando rol=TUTOR.
public record RegistroRequest(
        @NotBlank String nombres,
        @NotBlank String apellidos,
        @NotBlank @Email String correo,
        @NotBlank @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres") String contrasena,
        @NotNull RolUsuario rol,
        String carnet,
        String carrera,
        String especialidad
) {}
