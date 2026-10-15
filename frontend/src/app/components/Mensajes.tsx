// =====================================================================
// IMPORTACIONES
// =====================================================================

// Hooks de React:
// - useCallback: memoriza una función para no recrearla en cada render
// - useEffect: ejecuta efectos secundarios (cargar datos)
// - useState: maneja el estado local del componente
import { useCallback, useEffect, useState } from "react";

// Iconos de la librería lucide-react
import { Loader2, MessageCircle, Send, UserRound } from "lucide-react";

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
}

// =====================================================================
// COMPONENTE PRINCIPAL: Mensajes
// Chat con lista de contactos a la izquierda y conversación a la derecha.
// =====================================================================
export function Mensajes({ idUsuario }: Props) {
  // -------------------------------------------------------------------
  // ESTADOS
  // -------------------------------------------------------------------
  const [contactos, setContactos] = useState<ContactoMensaje[]>([]);
  const [contactoId, setContactoId] = useState<number | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
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
      .then((data) => {
        // Filtra por rol (normalizando espacios y mayúsculas)
        const contactosPermitidos = data.filter((contacto) => {
          const rol = contacto.rol.trim().toUpperCase();
          return rol === "TUTOR" || rol === "ESTUDIANTE";
        });

        setContactos(contactosPermitidos);

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
        setMensajes(data);

        // Marca como leídos los mensajes recibidos que aún no lo están
        // (los que tienen como destinatario al usuario actual)
        await Promise.all(
          data
            .filter((m) => m.idDestinatario === idUsuario && !m.leido)
            .map((m) => marcarMensajeLeido(m.id)),
        );
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
  async function enviar() {
    const contenido = texto.trim();

    // No envía si no hay contacto o el mensaje está vacío
    if (contactoId === null || !contenido) return;

    setEnviando(true);
    setError(null);

    try {
      const nuevo = await enviarMensaje(contactoId, contenido);
      setMensajes((prev) => [...prev, nuevo]); // Agrega el mensaje a la conversación
      setTexto(""); // Limpia el campo de texto
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo enviar el mensaje.",
      );
    } finally {
      setEnviando(false);
    }
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
          Mantente en comunicación con tus tutores asignados
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
        {/* ===== Columna izquierda: lista de contactos ===== */}
        <aside className="border-b border-border md:border-b-0 md:border-r">
          {/* Encabezado de la lista */}
          <div className="border-b border-border bg-secondary/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contactos
            </p>
          </div>

          {/* Lista con scroll vertical */}
          <div className="max-h-[260px] overflow-y-auto p-2 sm:max-h-[430px]">
            {contactos.length === 0 ? (
              // Mensaje cuando no hay contactos
              <p className="p-4 text-sm text-muted-foreground">
                No hay contactos disponibles.
              </p>
            ) : (
              // Un botón por cada contacto
              contactos.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setContactoId(c.id)} // Selecciona el contacto
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  // Resalta el contacto seleccionado
                  style={{
                    background:
                      contactoId === c.id ? "var(--secondary)" : undefined,
                  }}
                >
                  {/* Avatar con icono */}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <UserRound size={16} className="text-muted-foreground" />
                  </span>

                  {/* Nombre y rol del contacto */}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {c.nombreCompleto}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {c.rol}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ===== Columna derecha: conversación ===== */}
        <section className="flex min-h-[520px] min-w-0 flex-col">
          {/* Encabezado del chat */}
          <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4 sm:px-3">
            <div className="min-w-0 space-y-1">
              <p className="break-words text-sm font-semibold leading-5 text-foreground">
                {contacto?.nombreCompleto ?? "Selecciona un contacto"}
              </p>

              <p className="text-xs leading-4 text-muted-foreground">
                {contacto?.rol ?? ""}
              </p>
            </div>
          </div>

          {/* ---------- Área de mensajes (con scroll) ---------- */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-secondary/30 p-3 sm:p-5">
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
              mensajes.map((m) => {
                // true si el mensaje lo envió el usuario actual
                const propio = m.idRemitente === idUsuario;

                return (
                  // Los mensajes propios se alinean a la derecha; los ajenos a la izquierda
                  <div
                    key={m.id}
                    className={`flex ${
                      propio ? "justify-end" : "justify-start"
                    }`}
                  >
                    {/* Burbuja del mensaje (color distinto según el remitente) */}
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                        propio
                          ? "bg-[#118AB2] text-white"
                          : "bg-card text-foreground border border-border"
                      }`}
                    >
                      {/* Contenido (respeta saltos de línea y corta palabras largas) */}
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {m.contenido}
                      </p>

                      {/* Fecha y hora de envío */}
                      <p
                        className={`mt-1 text-[0.68rem] ${
                          propio ? "text-white/75" : "text-muted-foreground"
                        }`}
                      >
                        {new Date(m.fechaEnvio).toLocaleDateString("es-SV")}
                        {", "}
                        {new Date(m.fechaEnvio).toLocaleTimeString("es-SV", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ---------- Caja de entrada: campo de texto y botón de enviar ---------- */}
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
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
                onClick={enviar}
                disabled={contactoId === null || !texto.trim() || enviando}
                className="self-end rounded-xl px-4 py-3 text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
