package edu.ues.sigtau.dto;

public record LoginResponse(
        String token,
        String nombreCompleto,
        String rol,
        Integer idUsuario
) {}
