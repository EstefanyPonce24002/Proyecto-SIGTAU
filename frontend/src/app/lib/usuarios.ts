import { apiFetch } from "./api";
import type { Rol } from "./auth";

export interface UsuarioAdmin {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  rol: Rol;
  activo: boolean;
  fechaRegistro: string;
  carnet: string | null;
  codigoTutor: string | null;
  carrera: string | null;
  especialidad: string | null;
}

export interface RegistroPayload {
  nombres: string;
  apellidos: string;
  telefono?: string;
  contrasena: string;
  rol: Rol;
  carrera?: string;
  especialidad?: string;
}

/** Registrar estudiante o tutor; el backend genera su correo e identificador institucional. */
export function registrarUsuario(
  payload: RegistroPayload,
): Promise<UsuarioAdmin> {
  return apiFetch<UsuarioAdmin>("/auth/registro", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Normaliza los nombres de propiedades que puede devolver la API. */
type UsuarioAdminApi = UsuarioAdmin & {
  codigo_tutor?: string | null;
  carnet_estudiantil?: string | null;
};

function normalizarUsuarioAdmin(usuario: UsuarioAdminApi): UsuarioAdmin {
  return {
    ...usuario,
    carnet: usuario.carnet ?? usuario.carnet_estudiantil ?? null,
    codigoTutor: usuario.codigoTutor ?? usuario.codigo_tutor ?? null,
  };
}

/** Lista usuarios y normaliza los identificadores institucionales. */
export async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  const datos = await apiFetch<UsuarioAdminApi[]>("/usuarios");
  return datos.map(normalizarUsuarioAdmin);
}

/** activar o desactivar una cuenta */
export function cambiarEstadoUsuario(
  id: number,
  activo: boolean,
): Promise<UsuarioAdmin> {
  return apiFetch<UsuarioAdmin>(`/usuarios/${id}/estado?activo=${activo}`, {
    method: "PATCH",
  });
}

/** Actualiza todas las asignaturas asignadas a un tutor. */
export function actualizarAsignaturasDelTutor(
  idTutor: number,
  idAsignaturas: number[],
): Promise<void> {
  return apiFetch<void>(`/usuarios/${idTutor}/asignaturas`, {
    method: "PUT",
    body: JSON.stringify({ idAsignaturas }),
  });
}

export function actualizarUsuario(
  id: number,
  payload: Omit<RegistroPayload, "contrasena" | "rol">,
): Promise<UsuarioAdmin> {
  return apiFetch<UsuarioAdmin>(`/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
