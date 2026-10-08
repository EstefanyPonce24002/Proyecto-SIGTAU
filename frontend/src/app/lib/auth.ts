import { apiFetch, setToken, clearToken } from "./api";

export type Rol = "ESTUDIANTE" | "TUTOR" | "COORDINADOR";

export interface LoginResponse {
  token: string;
  nombreCompleto: string;
  rol: Rol;
  idUsuario: number;
}

/** RF-02: Iniciar Sesión */
export async function login(correo: string, contrasena: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ correo, contrasena }),
  });
  setToken(data.token);
  return data;
}

export function logout(): void {
  clearToken();
}

/** RF-03: Recuperar Contraseña -- paso 1 */
export async function solicitarRecuperacion(correo: string): Promise<void> {
  await apiFetch<void>("/auth/forgot-password", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ correo }),
  });
}

export async function restablecerContrasena(token: string, nuevaContrasena: string): Promise<void> {
  await apiFetch<void>("/auth/reset-password", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ token, nuevaContrasena }),
  });
}
