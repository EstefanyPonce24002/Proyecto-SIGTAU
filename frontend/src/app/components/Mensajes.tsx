import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageCircle, Send, UserRound } from "lucide-react";
import { ApiError } from "../lib/api";
import {
  enviarMensaje,
  listarContactosMensaje,
  listarMensajes,
  marcarMensajeLeido,
  type ContactoMensaje,
  type Mensaje,
} from "../lib/mensajes";

interface Props {
  idUsuario: number;
}
// Componente de Mensajes que permite a los usuarios comunicarse con sus contactos.
export function Mensajes({ idUsuario }: Props) {
  const [contactos, setContactos] = useState<ContactoMensaje[]>([]);
  const [contactoId, setContactoId] = useState<number | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [cargandoContactos, setCargandoContactos] = useState(true);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Efecto que se ejecuta al montar el componente para listar los contactos de mensajes.
  useEffect(() => {
    listarContactosMensaje()
      .then((data) => {
        setContactos(data);
        if (data.length) setContactoId(data[0].id);
      })
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar los contactos.",
        ),
      )
      .finally(() => setCargandoContactos(false));
  }, []);

  const cargarMensajes = useCallback(() => {
    if (contactoId === null) {
      setMensajes([]);
      return;
    }
    setCargandoMensajes(true);
    setError(null);
    listarMensajes(contactoId)
      .then(async (data) => {
        setMensajes(data);
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

  // Efecto que se ejecuta cada vez que cambia el contacto seleccionado para cargar los mensajes correspondientes.
  useEffect(() => {
    cargarMensajes();
  }, [cargarMensajes]);

  const contacto = contactos.find((c) => c.id === contactoId);

  // Función para enviar un mensaje al contacto seleccionado.
  async function enviar() {
    const contenido = texto.trim();
    if (!contactoId || !contenido) return;
    setEnviando(true);
    setError(null);
    try {
      const nuevo = await enviarMensaje(contactoId, contenido);
      setMensajes((prev) => [...prev, nuevo]);
      setTexto("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo enviar el mensaje.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (cargandoContactos) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Renderizado del componente de Mensajes, mostrando la lista de contactos y los mensajes correspondientes al contacto seleccionado.
  return (
    // Contenedor principal del componente de Mensajes.
    <div className="mx-auto w-full max-w-6xl space-y-1">
        <h1 className="text-foreground" style={{ fontSize: "1.3rem" }}>
          Mantente en comunicación con tus tutores asignados
        </h1>
      </div>
      {error && (
        <p className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid min-h-[520px] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-border md:border-b-0 md:border-r">
          <div className="border-b border-border bg-secondary/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contactos
            </p>
          </div>

          <div className="max-h-[260px] overflow-y-auto p-2 sm:max-h-[430px]">
            {contactos.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No hay contactos disponibles.
              </p>
            ) : (
              contactos.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setContactoId(c.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  style={{
                    background:
                      contactoId === c.id ? "var(--secondary)" : undefined,
                  }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <UserRound size={16} className="text-muted-foreground" />
                  </span>
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

        <section className="flex min-h-[520px] min-w-0 flex-col">
          <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4 sm:px-5">
            <MessageCircle size={19} className="text-brand-teal" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {contacto?.nombreCompleto ?? "Selecciona un contacto"}
              </p>
              <p className="text-xs text-muted-foreground">
                {contacto?.rol ?? ""}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-secondary/30 p-3 sm:p-5">
            {cargandoMensajes ? (
              <div className="flex justify-center py-16">
                <Loader2
                  size={22}
                  className="animate-spin text-muted-foreground"
                />
              </div>
            ) : mensajes.length === 0 ? (
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
              mensajes.map((m) => {
                const propio = m.idRemitente === idUsuario;
                return (
                  <div
                    key={m.id}
                    className={`flex ${propio ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-3 ${propio ? "bg-[#118AB2] text-white" : "bg-card text-foreground border border-border"}`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {m.contenido}
                      </p>
                      <p
                        className={`mt-1 text-[0.68rem] ${propio ? "text-white/75" : "text-muted-foreground"}`}
                      >
                        {new Date(m.fechaEnvio).toLocaleString("es-SV")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value.slice(0, 2000))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    enviar();
                  }
                }}
                disabled={!contactoId || enviando}
                rows={2}
                placeholder="Escribe un mensaje…"
                className="min-h-12 min-w-0 flex-1 resize-none rounded-xl border border-border bg-input-background px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring sm:px-4"
              />

              <button
                onClick={enviar}
                disabled={!contactoId || !texto.trim() || enviando}
                className="self-end rounded-xl px-4 py-3 text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "#118AB2" }}
                aria-label="Enviar mensaje"
              >
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
