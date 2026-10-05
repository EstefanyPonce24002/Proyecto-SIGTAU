import type { Sesion } from "./sesiones";

const ESTADOS_AGENDA = new Set(["PENDIENTE", "APROBADA"]);

/** Combina fecha y hora de la sesión en un Date local. */
export function inicioSesion(sesion: Sesion): Date {
  return new Date(`${sesion.fechaSesion}T${sesion.horaInicio}`);
}

export function finSesion(sesion: Sesion): Date {
  return new Date(`${sesion.fechaSesion}T${sesion.horaFin}`);
}

export function esAgendaViva(sesion: Sesion): boolean {
  return ESTADOS_AGENDA.has(sesion.estado);
}

/** Próxima = aún no empezó y sigue viva (pendiente o aprobada). */
export function esSesionProxima(sesion: Sesion, ahora = new Date()): boolean {
  return esAgendaViva(sesion) && inicioSesion(sesion).getTime() >= ahora.getTime();
}

function porInicio(a: Sesion, b: Sesion): number {
  return inicioSesion(a).getTime() - inicioSesion(b).getTime();
}

export function sesionesAgenda(sesiones: Sesion[], ahora = new Date()): {
  proximas: Sesion[];
  vencidas: Sesion[];
} {
  const vivas = sesiones.filter(esAgendaViva);
  return {
    proximas: vivas.filter((sesion) => esSesionProxima(sesion, ahora)).sort(porInicio),
    vencidas: vivas.filter((sesion) => !esSesionProxima(sesion, ahora)).sort(porInicio),
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** DATETIME local para ICS (El Salvador no usa DST). */
function toIcsLocal(date: Date): string {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildIcs(sesion: Sesion): string {
  const summary = `Tutoría: ${sesion.asignaturaNombre}`;
  const description = `Tutor: ${sesion.tutorNombre}\nEstado: ${sesion.estado}\nCódigo SIGTAU: #${sesion.id}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SIGTAU//Tutorias//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:sigtau-sesion-${sesion.id}@sigtau`,
    `DTSTAMP:${toIcsLocal(new Date())}`,
    `DTSTART:${toIcsLocal(inicioSesion(sesion))}`,
    `DTEND:${toIcsLocal(finSesion(sesion))}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function descargarIcs(sesion: Sesion): void {
  const blob = new Blob([buildIcs(sesion)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tutoria-${sesion.id}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
