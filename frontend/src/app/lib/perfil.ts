import { apiFetch } from "./api";
import type { Rol } from "./auth";

export interface Perfil {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: Rol;
  carnet: string | null;
  carrera: string | null;
  cicloActual: number | null;
}

export interface ActualizarPerfilPayload {
  nombres: string;
  apellidos: string;
  carrera?: string;
}

export function obtenerPerfil(): Promise<Perfil> {
  return apiFetch<Perfil>("/perfil");
}

export function actualizarPerfil(payload: ActualizarPerfilPayload): Promise<Perfil> {
  return apiFetch<Perfil>("/perfil", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function cambiarContrasena(
  contrasenaActual: string,
  nuevaContrasena: string,
): Promise<void> {
  return apiFetch<void>("/perfil/contrasena", {
    method: "PATCH",
    body: JSON.stringify({ contrasenaActual, nuevaContrasena }),
  });
}
