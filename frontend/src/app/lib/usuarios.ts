import { apiFetch } from "./api";
import type { Rol } from "./auth";

export interface UsuarioAdmin {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  fechaRegistro: string;
  carnet: string | null;
  carrera: string | null;
  especialidad: string | null;
}

export interface RegistroPayload {
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string;
  rol: Rol;
  carnet?: string;
  carrera?: string;
  especialidad?: string;
}

/** RF-01: Registrar Usuario (coordinador crea estudiantes/tutores/coordinadores) */
export function registrarUsuario(payload: RegistroPayload): Promise<UsuarioAdmin> {
  return apiFetch<UsuarioAdmin>("/auth/registro", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** RF-12: listar todos los usuarios */
export function listarUsuarios(): Promise<UsuarioAdmin[]> {
  return apiFetch<UsuarioAdmin[]>("/usuarios");
}

/** RF-12: activar o desactivar una cuenta */
export function cambiarEstadoUsuario(id: number, activo: boolean): Promise<UsuarioAdmin> {
  return apiFetch<UsuarioAdmin>(`/usuarios/${id}/estado?activo=${activo}`, { method: "PATCH" });
}

export function actualizarUsuario(id: number, payload: Omit<RegistroPayload, "correo" | "contrasena" | "rol">): Promise<UsuarioAdmin> {
  return apiFetch<UsuarioAdmin>(`/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
