package edu.ues.sigtau.dto;

import edu.ues.sigtau.model.RolUsuario;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// El correo y los identificadores institucionales se calculan en el backend.
public record RegistroRequest(
        @NotBlank @Size(max = 100, message = "Los nombres no pueden superar los 100 caracteres") String nombres,
        @NotBlank @Size(max = 50, message = "Los apellidos no pueden superar los 50 caracteres") String apellidos,
        String correo, // Se conserva por compatibilidad; el backend no confía en este valor.
        @Size(max = 25, message = "El teléfono no puede superar los 25 caracteres") String telefono,
        @NotBlank @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres") String contrasena,
        @NotNull RolUsuario rol,
        @Size(max = 150, message = "La carrera no puede superar los 150 caracteres") String carrera,
        @Size(max = 200, message = "La especialidad no puede superar los 200 caracteres") String especialidad
) {}
