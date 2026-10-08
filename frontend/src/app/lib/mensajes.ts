import { apiFetch } from "./api";

export interface ContactoMensaje {
  id: number;
  nombreCompleto: string;
  rol: string;
}

export interface Mensaje {
  id: number;
  idRemitente: number;
  remitenteNombre: string;
  idDestinatario: number;
  destinatarioNombre: string;
  idSesion: number | null;
  contenido: string;
  leido: boolean;
  fechaEnvio: string;
}

export function listarContactosMensaje(): Promise<ContactoMensaje[]> {
  return apiFetch<ContactoMensaje[]>("/mensajes/contactos");
}

export function listarMensajes(contactoId?: number): Promise<Mensaje[]> {
  const query = contactoId ? `?contactoId=${contactoId}` : "";
  return apiFetch<Mensaje[]>(`/mensajes${query}`);
}

export function enviarMensaje(idDestinatario: number, contenido: string, idSesion?: number): Promise<Mensaje> {
  return apiFetch<Mensaje>("/mensajes", {
    method: "POST",
    body: JSON.stringify({
      idDestinatario,
      idSesion: idSesion ?? null,
      contenido,
    }),
  });
}

export function marcarMensajeLeido(idMensaje: number): Promise<void> {
  return apiFetch<void>(`/mensajes/${idMensaje}/leida`, { method: "PATCH" });
}
