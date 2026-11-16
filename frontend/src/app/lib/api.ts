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
    const responseText = await response.text();

    if (responseText) {
      try {
        const body = JSON.parse(responseText) as {
          mensaje?: unknown;
          message?: unknown;
          error?: unknown;
          errores?: unknown;
        };
        const detail = body.mensaje ?? body.message ?? body.error ?? body.errores;

        if (typeof detail === "string") {
          message = detail;
        } else if (detail && typeof detail === "object") {
          if (Array.isArray(detail)) {
            message = detail.map(String).join(". ");
          } else {
            message = Object.entries(detail)
              .map(([field, value]) =>
                `${field === "correo" ? "Correo electrónico" : field === "contrasena" ? "Contraseña" : field}: ${String(value)}`,
              )
              .join(". ");
          }
        }
      } catch {
        if (!responseText.trimStart().startsWith("<")) {
          message = responseText.slice(0, 300);
        }
      }
    }

    throw new ApiError(message, response.status);
  }

  // 204 No Content u otras respuestas vacías
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function apiFetchBlob(
  path: string,
  options: ApiFetchOptions = {},
): Promise<Blob> {
  const { auth = true, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
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
    throw new ApiError(`Error ${response.status}`, response.status);
  }

  return response.blob();
}
