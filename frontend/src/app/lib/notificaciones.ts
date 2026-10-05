import { apiFetch } from "./api";

export type TipoNotificacion = "APROBACION" | "RECHAZO" | "CAMBIO_HORARIO" | "RECORDATORIO" | "OBSERVACION";

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
  leida: boolean;
  fechaEnvio: string;
  idSesion: number | null;
}

export function listarNotificaciones(): Promise<Notificacion[]> {
  return apiFetch<Notificacion[]>("/notificaciones");
}

export function marcarNotificacionLeida(id: number): Promise<Notificacion> {
  return apiFetch<Notificacion>(`/notificaciones/${id}/leida`, { method: "PATCH" });
}

export function marcarTodasLeidas(): Promise<void> {
  return apiFetch<void>("/notificaciones/marcar-todas", { method: "PATCH" });
}
