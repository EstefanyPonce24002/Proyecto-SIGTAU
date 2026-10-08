package edu.ues.sigtau.dto;

import edu.ues.sigtau.model.RolUsuario;

public record PerfilResponse(
        Integer id,
        String nombres,
        String apellidos,
        String correo,
        RolUsuario rol,
        String carnet,
        String carrera,
        Short cicloActual
) {}
