import { apiFetch } from "./api";

export type EstadoSesion = "PENDIENTE" | "APROBADA" | "RECHAZADA" | "COMPLETADA" | "CANCELADA";

export interface Sesion {
  id: number;
  idEstudiante: number;
  estudianteNombre: string;
  idTutor: number;
  tutorNombre: string;
  idAsignatura: number;
  asignaturaNombre: string;
  idHorario: number | null;
  fechaSesion: string;   // "YYYY-MM-DD"
  horaInicio: string;    // "HH:mm:ss"
  horaFin: string;
  descripcionDificultades: string | null;
  estado: EstadoSesion;
  observacionesTutor: string | null;
  calificacionProgreso: number | null;
  asistencia: boolean | null;
  fechaSolicitud: string;
}

export interface SolicitarSesionPayload {
  idEstudiante: number;
  idTutor: number;
  idAsignatura: number;
  idHorario: number;
  fecha: string;       // "YYYY-MM-DD"
  horaInicio: string;  // "HH:mm:ss" o "HH:mm"
  horaFin: string;
  descripcionDificultades?: string;
}

/** RF-04 */
export function solicitarTutoria(payload: SolicitarSesionPayload): Promise<Sesion> {
  return apiFetch<Sesion>("/sesiones", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Adjuntar un documento a una sesión ya creada. */
export function subirAdjunto(idSesion: number, file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<unknown>(`/sesiones/${idSesion}/adjuntos`, {
    method: "POST",
    body: formData,
  });
}

/** RF-07 */
export function resolverSolicitud(idSesion: number, aprobar: boolean, justificacion?: string): Promise<Sesion> {
  const params = new URLSearchParams({ aprobar: String(aprobar) });
  if (justificacion) params.set("justificacion", justificacion);
  return apiFetch<Sesion>(`/sesiones/${idSesion}/resolver?${params.toString()}`, { method: "PATCH" });
}

/** Reprogramar una sesión existente. */
export function reprogramarSesion(
  idSesion: number,
  payload: {
    idHorario: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
  }
): Promise<Sesion> {
  return apiFetch<Sesion>(`/sesiones/${idSesion}/reprogramar`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** Cancelar sesión (PENDIENTE o APROBADA) */
export function cancelarSesion(idSesion: number): Promise<Sesion> {
  return apiFetch<Sesion>(`/sesiones/${idSesion}/cancelar`, { method: "PATCH" });
}

/** RF-08 */
export function registrarSeguimiento(
  idSesion: number,
  asistencia: boolean,
  observaciones: string,
  calificacion: number
): Promise<Sesion> {
  const params = new URLSearchParams({
    asistencia: String(asistencia),
    calificacion: String(calificacion),
    ...(observaciones ? { observaciones } : {}),
  });
  return apiFetch<Sesion>(`/sesiones/${idSesion}/seguimiento?${params.toString()}`, { method: "PATCH" });
}

/** RF-09 */
export function historialEstudiante(idEstudiante: number): Promise<Sesion[]> {
  return apiFetch<Sesion[]>(`/sesiones/estudiante/${idEstudiante}`);
}

export function historialTutor(idTutor: number): Promise<Sesion[]> {
  return apiFetch<Sesion[]>(`/sesiones/tutor/${idTutor}`);
}

export function pendientesTutor(idTutor: number): Promise<Sesion[]> {
  return apiFetch<Sesion[]>(`/sesiones/tutor/${idTutor}/pendientes`);
}
