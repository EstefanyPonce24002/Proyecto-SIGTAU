import { apiFetch } from "./api";

export interface Asignatura {
  id: number;
  nombre: string;
  codigo: string | null;
  activa?: boolean;
}

export interface TutorOption {
  id: number;
  nombreCompleto: string;
  especialidad: string | null;
}

export interface HorarioOption {
  id: number;
  diaSemana: "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES";
  horaInicio: string; // "HH:mm:ss"
  horaFin: string;
  disponible: boolean;
}

export function listarAsignaturas(): Promise<Asignatura[]> {
  return apiFetch<Asignatura[]>("/asignaturas");
}

export function listarTutoresPorAsignatura(idAsignatura: number): Promise<TutorOption[]> {
  return apiFetch<TutorOption[]>(`/asignaturas/${idAsignatura}/tutores`);
}

export function listarHorariosDisponibles(idTutor: number): Promise<HorarioOption[]> {
  return apiFetch<HorarioOption[]>(`/tutores/${idTutor}/horarios`);
}

export const DIA_LABEL: Record<HorarioOption["diaSemana"], string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
};

/** "14:00:00" -> "14:00" para mostrar en la UI */
export function formatHora(hora: string): string {
  return hora.slice(0, 5);
}

/* ── Gestión de horarios (RF-06) ─────────────────────────────────────── */

export function listarHorariosDelTutor(idTutor: number): Promise<HorarioOption[]> {
  return apiFetch<HorarioOption[]>(`/horarios/tutor/${idTutor}`);
}

export interface CrearHorarioPayload {
  idTutor: number;
  diaSemana: HorarioOption["diaSemana"];
  horaInicio: string; // "HH:mm"
  horaFin: string;
}

export function crearHorario(payload: CrearHorarioPayload): Promise<HorarioOption> {
  return apiFetch<HorarioOption>("/horarios", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function eliminarHorario(idHorario: number): Promise<void> {
  return apiFetch<void>(`/horarios/${idHorario}`, { method: "DELETE" });
}

/* ── Asignación tutor-asignatura (RF-05 / RF-12) ─────────────────────── */

export function listarTodosLosTutores(): Promise<TutorOption[]> {
  return apiFetch<TutorOption[]>("/tutores");
}

export function asignarTutorAAsignatura(idAsignatura: number, idTutor: number): Promise<void> {
  return apiFetch<void>(`/asignaturas/${idAsignatura}/tutores/${idTutor}`, { method: "POST" });
}

export function quitarTutorDeAsignatura(idAsignatura: number, idTutor: number): Promise<void> {
  return apiFetch<void>(`/asignaturas/${idAsignatura}/tutores/${idTutor}`, { method: "DELETE" });
}

/* ── Administración de asignaturas (RF-12) ───────────────────────────── */

export function listarTodasLasAsignaturas(): Promise<Asignatura[]> {
  return apiFetch<Asignatura[]>("/asignaturas/todas");
}

export function crearAsignatura(nombre: string, codigo: string, descripcion?: string): Promise<Asignatura> {
  return apiFetch<Asignatura>("/asignaturas", {
    method: "POST",
    body: JSON.stringify({ nombre, codigo, descripcion }),
  });
}

export function cambiarEstadoAsignatura(id: number, activa: boolean): Promise<Asignatura> {
  return apiFetch<Asignatura>(`/asignaturas/${id}/estado?activa=${activa}`, { method: "PATCH" });
}
