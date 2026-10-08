/**
 * Cliente API centralizado para SIGTAU.
 * Todas las pantallas deben usar `apiFetch` en vez de `fetch` directo,
 * así el token JWT y el manejo de errores quedan en un solo lugar.
 */

// En desarrollo Vite reenvia `/api` al backend; en produccion se configura la URL real.
const API_URL = import.meta.env.VITE_API_URL ?? "/api";

const TOKEN_KEY = "sigtau_token";

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface ApiFetchOptions extends RequestInit {
  auth?: boolean; // si true (default), agrega el header Authorization
}

/**
 * Wrapper sobre fetch que:
 * - antepone la URL base del backend
 * - agrega el JWT automáticamente (a menos que auth:false, como en /auth/login)
 * - parsea JSON y convierte errores HTTP en ApiError con el mensaje del backend
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;

  const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData;
  const finalHeaders: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const body = await response.json();
      message = body.mensaje ?? body.errores ?? message;
      if (typeof message === "object" && message !== null) {
        const details = Object.entries(message)
          .map(([field, detail]) => `${field === "correo" ? "Correo electrónico" : field === "contrasena" ? "Contraseña" : field}: ${detail}`)
          .join(". ");
        message = details || "Revisa los datos ingresados";
      }
    } catch {
      // el cuerpo no era JSON, se mantiene el mensaje genérico
    }
    throw new ApiError(typeof message === "string" ? message : JSON.stringify(message), response.status);
  }

  // 204 No Content u otras respuestas vacías
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
