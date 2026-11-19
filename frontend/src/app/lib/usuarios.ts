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

type UsuarioAdminApi = UsuarioAdmin & {
  codigo_tutor?: string | null;
  carnet_estudiantil?: string | null;
};

export function registrarUsuario(payload: RegistroPayload): Promise<UsuarioAdmin> {
  return apiFetch<UsuarioAdmin>("/auth/registro", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registrarCoordinador(payload: RegistroPayload): Promise<UsuarioAdmin> {
  return apiFetch<UsuarioAdmin>("/usuarios/coordinadores", {
    method: "POST",
    body: JSON.stringify({ ...payload, rol: "COORDINADOR" }),
  });
}

function normalizarUsuarioAdmin(usuario: UsuarioAdminApi): UsuarioAdmin {
  return {
    ...usuario,
    carnet: usuario.carnet ?? usuario.carnet_estudiantil ?? null,
    codigoTutor: usuario.codigoTutor ?? usuario.codigo_tutor ?? null,
  };
}

export async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  const datos = await apiFetch<UsuarioAdminApi[]>("/usuarios");
  return datos.map(normalizarUsuarioAdmin);
}

export function cambiarEstadoUsuario(
  id: number,
  activo: boolean,
  contrasenaActual?: string,
): Promise<UsuarioAdmin> {
  return apiFetch<UsuarioAdmin>(`/usuarios/${id}/estado?activo=${activo}`, {
    method: "PATCH",
    ...(contrasenaActual === undefined
      ? {}
      : { body: JSON.stringify({ contrasenaActual }) }),
  });
}

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
