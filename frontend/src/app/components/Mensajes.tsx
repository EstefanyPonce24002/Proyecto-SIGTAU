// =====================================================================
// IMPORTACIONES
// =====================================================================

// Hooks de React:
// - useCallback: memoriza una función para no recrearla en cada render
// - useEffect: ejecuta efectos secundarios (cargar datos)
// - useState: maneja el estado local del componente
import { useCallback, useEffect, useRef, useState } from "react";

// Iconos de la librería lucide-react
import {
  Check,
  CheckCheck,
  Clock3,
  Loader2,
  MessageCircle,
  RotateCw,
  Send,
} from "lucide-react";

// Clase de error personalizada para distinguir errores que vienen del backend
import { ApiError } from "../lib/api";

// Funciones y tipos de la capa de datos (API de mensajes)
// - enviarMensaje: envía un mensaje a un contacto
// - listarContactosMensaje: obtiene los contactos disponibles
// - listarMensajes: obtiene la conversación con un contacto
// - marcarMensajeLeido: marca un mensaje como leído
// - ContactoMensaje / Mensaje: tipos TypeScript del modelo de datos
import {
  enviarMensaje,
  listarContactosMensaje,
  listarMensajes,
  marcarMensajeLeido,
  type ContactoMensaje,
  type Mensaje,
} from "../lib/mensajes";

// =====================================================================
// TIPOS
// =====================================================================

// Propiedades que recibe el componente
interface Props {
  idUsuario: number;
  rol: "estudiante" | "tutor" | "coordinador";
}

type MensajeVista = Mensaje & { estadoEnvio?: "enviando" | "fallido" };

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join("")
    .toUpperCase();
}

// =====================================================================
// COMPONENTE PRINCIPAL: Mensajes
// Chat con lista de contactos a la izquierda y conversación a la derecha.
// =====================================================================
export function Mensajes({ idUsuario, rol }: Props) {
  // -------------------------------------------------------------------
  // ESTADOS
  // -------------------------------------------------------------------
  const [contactos, setContactos] = useState<ContactoMensaje[]>([]);
  const [contactoId, setContactoId] = useState<number | null>(null);
  const [mensajes, setMensajes] = useState<MensajeVista[]>([]);
  const fallidosPorContacto = useRef<Record<number, MensajeVista[]>>({});
  const [conversaciones, setConversaciones] = useState<
    Record<number, MensajeVista[]>
  >({});
  const [texto, setTexto] = useState("");
  const [cargandoContactos, setCargandoContactos] = useState(true);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------
  // CARGA DE CONTACTOS
  // -------------------------------------------------------------------
  // Cargar únicamente contactos que sean estudiantes o tutores.
  // Se ejecuta una sola vez al montar el componente.
  useEffect(() => {
    listarContactosMensaje()
      .then(async (data) => {
        // Filtra por rol (normalizando espacios y mayúsculas)
        const contactosPermitidos = data.filter((contacto) => {
          const rol = contacto.rol.trim().toUpperCase();
          return rol === "TUTOR" || rol === "ESTUDIANTE";
        });

        const resultados = await Promise.all(
          contactosPermitidos.map(async (contacto) => {
            try {
              return [contacto.id, await listarMensajes(contacto.id)] as const;
            } catch {
              return [contacto.id, []] as const;
            }
          }),
        );
        const mensajesPorContacto = Object.fromEntries(resultados);
        setContactos(contactosPermitidos);
        setConversaciones(mensajesPorContacto);

        // Selecciona automáticamente el primer contacto (si existe)
        if (contactosPermitidos.length > 0) {
          setContactoId(contactosPermitidos[0].id);
        } else {
          setContactoId(null);
        }
      })
      .catch((err) =>
        // Si es un ApiError se muestra su mensaje; si no, uno genérico
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar los contactos.",
        ),
      )
      .finally(() => setCargandoContactos(false)); // Siempre se quita el estado de carga
  }, []);

  // -------------------------------------------------------------------
  // CARGA DE MENSAJES
  // -------------------------------------------------------------------
  // Cargar mensajes del contacto seleccionado.
  // useCallback evita recrear la función salvo que cambie el contacto o el usuario.
  const cargarMensajes = useCallback(() => {
    // Sin contacto seleccionado no hay nada que mostrar
    if (contactoId === null) {
      setMensajes([]);
      return;
    }

    setCargandoMensajes(true);
    setError(null);

    listarMensajes(contactoId)
      .then(async (data) => {
        const fallidosLocales = fallidosPorContacto.current[contactoId] ?? [];
        const idsRecibidos = new Set(data.map((m) => m.id));
        const visibles = [
          ...data,
          ...fallidosLocales.filter((m) => !idsRecibidos.has(m.id)),
        ].sort(
          (a, b) =>
            new Date(a.fechaEnvio).getTime() - new Date(b.fechaEnvio).getTime(),
        );
        setMensajes(visibles);
        setConversaciones((prev) => ({ ...prev, [contactoId]: visibles }));

        // Marca como leídos los mensajes recibidos que aún no lo están
        // (los que tienen como destinatario al usuario actual)
        const porLeer = data.filter(
          (m) => m.idDestinatario === idUsuario && !m.leido,
        );
        await Promise.all(porLeer.map((m) => marcarMensajeLeido(m.id)));
        if (porLeer.length > 0) {
          const actualizados = visibles.map((m) =>
            porLeer.some((pendiente) => pendiente.id === m.id)
              ? { ...m, leido: true }
              : m,
          );
          setMensajes(actualizados);
          setConversaciones((prev) => ({
            ...prev,
            [contactoId]: actualizados,
          }));
        }
      })
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar los mensajes.",
        ),
      )
      .finally(() => setCargandoMensajes(false));
  }, [contactoId, idUsuario]);

  // Vuelve a cargar la conversación cada vez que cambia el contacto seleccionado
  useEffect(() => {
    cargarMensajes();
  }, [cargarMensajes]);

  // Datos del contacto seleccionado (para el encabezado del chat)
  const contacto = contactos.find((c) => c.id === contactoId);

  // -------------------------------------------------------------------
  // ACCIÓN: ENVIAR MENSAJE
  // -------------------------------------------------------------------
  // Enviar mensaje al contacto seleccionado.
  async function enviar(contenidoForzado?: string, reintento?: MensajeVista) {
    const contenido = (contenidoForzado ?? texto).trim();
    const destinatarioId = reintento?.idDestinatario ?? contactoId;

    // No envía si no hay contacto o el mensaje está vacío
    if (destinatarioId === null || !contenido) return;

    const temporal: MensajeVista = reintento ?? {
      id: -Date.now(),
      idRemitente: idUsuario,
      remitenteNombre: "",
      idDestinatario: destinatarioId,
      destinatarioNombre: "",
      idSesion: null,
      contenido,
      leido: false,
      fechaEnvio: new Date().toISOString(),
      estadoEnvio: "enviando",
    };
    const temporalEnviando = { ...temporal, estadoEnvio: "enviando" as const };
    if (reintento) {
      setMensajes((prev) =>
        prev.map((m) => (m.id === temporal.id ? temporalEnviando : m)),
      );
      setConversaciones((prev) => ({
        ...prev,
        [destinatarioId]: (prev[destinatarioId] ?? []).map((m) =>
          m.id === temporal.id ? temporalEnviando : m,
        ),
      }));
    } else {
      setMensajes((prev) => [...prev, temporalEnviando]);
      setConversaciones((prev) => ({
        ...prev,
        [destinatarioId]: [
          ...(prev[destinatarioId] ?? []),
          temporalEnviando,
        ],
      }));
      setTexto("");
    }

    setEnviando(true);
    setError(null);

    try {
      const nuevo = await enviarMensaje(destinatarioId, contenido);
      setMensajes((prev) =>
        prev.map((m) => (m.id === temporal.id ? nuevo : m)),
      );
      setConversaciones((prev) => ({
        ...prev,
        [destinatarioId]: (prev[destinatarioId] ?? []).map((m) =>
          m.id === temporal.id ? nuevo : m,
        ),
      }));
      fallidosPorContacto.current[destinatarioId] = (
        fallidosPorContacto.current[destinatarioId] ?? []
      ).filter((m) => m.id !== temporal.id);
    } catch {
      const fallido = { ...temporalEnviando, estadoEnvio: "fallido" as const };
      fallidosPorContacto.current[destinatarioId] = [
        ...(fallidosPorContacto.current[destinatarioId] ?? []).filter(
          (m) => m.id !== fallido.id,
        ),
        fallido,
      ];
      setMensajes((prev) =>
        prev.map((m) => (m.id === temporal.id ? fallido : m)),
      );
      setConversaciones((prev) => ({
        ...prev,
        [destinatarioId]: (prev[destinatarioId] ?? []).map((m) =>
          m.id === temporal.id ? fallido : m,
        ),
      }));
    } finally {
      setEnviando(false);
    }
  }

  function fechaHora(fecha: string): string {
    const instante = new Date(fecha);
    const fechaLegible = instante.toLocaleDateString("es-SV", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const hora = instante.toLocaleTimeString("es-SV", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${fechaLegible}, ${hora}`;
  }

  function horaPreview(fecha: string): string {
    const instante = new Date(fecha);
    const hoy = new Date();
    if (instante.toDateString() === hoy.toDateString()) {
      return instante.toLocaleTimeString("es-SV", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    return instante.toLocaleDateString("es-SV", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // -------------------------------------------------------------------
  // RENDERIZADO CONDICIONAL: CARGANDO CONTACTOS
  // -------------------------------------------------------------------
  // Mientras cargan los contactos se muestra solo un spinner
  if (cargandoContactos) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  // -------------------------------------------------------------------
  // RENDERIZADO PRINCIPAL
  // -------------------------------------------------------------------
  return (
    <div className="mx-auto w-full max-w-6xl space-y-1">
      {/* ---------- Título de la página ---------- */}
      <div className="mb-6">
        <h1 className="text-foreground" style={{ fontSize: "1.3rem" }}>
          {rol === "estudiante"
            ? "Mantente en comunicación con tus tutores asignados"
            : "Mantente en comunicación con tus estudiantes"}
        </h1>
      </div>

      {/* ---------- Mensaje de error (solo si existe) ---------- */}
      {error && (
        <p className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* ---------- Contenedor del chat: 2 columnas en pantallas medianas o mayores ---------- */}
      <div className="grid min-h-[520px] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-[260px_minmax(0,1fr)]">
        {/* ===== Columna izquierda: conversaciones ===== */}
        <aside className="border-b border-border md:border-b-0 md:border-r">
          {/* Encabezado de la lista */}
          <div className="flex min-h-[72px] flex-col items-start justify-center gap-1 border-b border-border bg-secondary/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Conversaciones
            </p>
            <p className="text-sm font-medium leading-5 text-foreground">
              {rol === "estudiante" ? "Tus tutores" : "Tus estudiantes"}
            </p>
          </div>

          {/* Lista con scroll vertical */}
          <div className="max-h-[260px] space-y-1 overflow-y-auto p-2 sm:max-h-[430px]">
            {contactos.length === 0 ? (
              // Mensaje cuando no hay contactos
              <p className="p-4 text-sm text-muted-foreground">
                No hay conversaciones disponibles.
              </p>
            ) : (
              // Un botón por cada contacto
              contactos.map((c) => {
                const historial = conversaciones[c.id] ?? [];
                const ultimo = historial[historial.length - 1];
                const noLeidos = historial.filter(
                  (m) => m.idDestinatario === idUsuario && !m.leido,
                ).length;
                return (
                <button
                  key={c.id}
                  onClick={() => setContactoId(c.id)} // Selecciona el contacto
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  // Resalta el contacto seleccionado
                  style={{
                    background:
                      contactoId === c.id ? "var(--secondary)" : undefined,
                  }}
                >
                  {/* Avatar con iniciales */}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#118AB2] text-xs font-semibold text-white">
                    {iniciales(c.nombreCompleto)}
                  </span>

                  {/* Nombre, último mensaje y estado de lectura */}
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="block truncate text-xs font-semibold text-foreground" title={c.nombreCompleto}>
                      {c.nombreCompleto}
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                        {ultimo?.contenido ?? c.rol}
                      </span>
                      {ultimo && (
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {horaPreview(ultimo.fechaEnvio)}
                        </span>
                      )}
                      {noLeidos > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#118AB2] px-1 text-[10px] font-semibold text-white">
                          {noLeidos > 99 ? "99+" : noLeidos}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ===== Columna derecha: conversación ===== */}
        <section className="flex min-h-[520px] min-w-0 flex-col">
          {/* Encabezado del chat */}
          <div className="flex min-h-[72px] items-center gap-3 border-b border-border bg-card px-4 py-4">
            {contacto && (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#118AB2] text-xs font-semibold text-white">
                {iniciales(contacto.nombreCompleto)}
              </span>
            )}
            <div className="min-w-0 space-y-1">
              <p title={contacto?.nombreCompleto} className="truncate text-sm font-semibold leading-5 text-foreground">
                {contacto?.nombreCompleto ?? "Selecciona un contacto"}
              </p>

              <p className="text-xs leading-4 text-muted-foreground">
                {contacto?.rol ?? ""}
              </p>
            </div>
          </div>

          {/* ---------- Área de mensajes (con scroll) ---------- */}
          <div className="flex-1 overflow-y-auto bg-secondary/30 p-3 sm:p-5">
            {cargandoMensajes ? (
              // Spinner mientras se carga la conversación
              <div className="flex justify-center py-16">
                <Loader2
                  size={22}
                  className="animate-spin text-muted-foreground"
                />
              </div>
            ) : mensajes.length === 0 ? (
              // Estado vacío: aún no hay mensajes
              <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                <MessageCircle
                  size={28}
                  className="mb-2 text-muted-foreground"
                />
                <p className="text-sm text-muted-foreground">
                  Aún no hay mensajes con este contacto.
                </p>
              </div>
            ) : (
              // Lista de mensajes
              mensajes.map((m, indice) => {
                // true si el mensaje lo envió el usuario actual
                const propio = m.idRemitente === idUsuario;
                const anterior = mensajes[indice - 1];
                const siguiente = mensajes[indice + 1];
                const mismoGrupoAnterior = anterior?.idRemitente === m.idRemitente;
                const ultimoDelGrupo = siguiente?.idRemitente !== m.idRemitente;

                return (
                  // Los mensajes propios se alinean a la derecha; los ajenos a la izquierda
                  <div
                    key={m.id}
                    className={`flex ${mismoGrupoAnterior ? "mt-1" : "mt-3"} ${
                      propio ? "justify-end" : "justify-start"
                    }`}
                  >
                    {/* Burbuja del mensaje (color distinto según el remitente) */}
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        propio
                          ? "bg-[#118AB2] text-white"
                          : "border border-border/80 bg-background text-foreground"
                      }`}
                    >
                      {/* Contenido (respeta saltos de línea y corta palabras largas) */}
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {m.contenido}
                      </p>

                      {/* Fecha y hora de envío */}
                      {ultimoDelGrupo && (
                        <div className={`mt-1 flex items-center justify-end gap-1 text-[0.68rem] ${propio ? "text-white" : "text-muted-foreground"}`}>
                          <span>{fechaHora(m.fechaEnvio)}</span>
                          {propio && (
                            m.estadoEnvio === "enviando" ? (
                              <Clock3 size={13} aria-label="Enviando" />
                            ) : m.estadoEnvio === "fallido" ? (
                              <button
                                type="button"
                                onClick={() => enviar(m.contenido, m)}
                                disabled={enviando}
                                className="inline-flex items-center gap-1 font-medium underline underline-offset-2 disabled:opacity-60"
                                title="Reintentar envío"
                              >
                                <RotateCw size={13} /> Reintentar
                              </button>
                            ) : m.leido ? (
                              <CheckCheck size={14} aria-label="Leído" />
                            ) : (
                              <Check size={14} aria-label="Enviado" />
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ---------- Caja de entrada: campo de texto y botón de enviar ---------- */}
          <div className="border-t border-border p-4">
            <div className="flex items-stretch gap-2">
              {/* Campo de texto: máximo 2000 caracteres */}
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value.slice(0, 2000))}
                // Enter envía el mensaje; Shift+Enter inserta un salto de línea
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    enviar();
                  }
                }}
                disabled={contactoId === null || enviando}
                rows={2}
                placeholder="Escribe un mensaje…"
                className="min-h-12 min-w-0 flex-1 resize-none rounded-xl border border-[#118AB2] bg-input-background px-3 py-3 text-sm text-foreground outline-none transition focus:border-[#118AB2] focus:ring-3 focus:ring-[#118AB2]/40 sm:px-4"
              />

              {/* Botón de enviar: se deshabilita sin contacto, sin texto o mientras envía */}
              <button
                onClick={() => enviar()}
                disabled={contactoId === null || !texto.trim() || enviando}
                className="flex shrink-0 items-center justify-center rounded-xl px-4 text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "#118AB2" }}
                aria-label="Enviar mensaje"
              >
                {/* Muestra spinner mientras se envía; si no, el icono de enviar */}
                {enviando ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
