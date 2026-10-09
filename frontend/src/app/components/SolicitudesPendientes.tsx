import { useState, useEffect, useCallback } from "react";
import {
  User,
  BookOpen,
  Calendar,
  Clock,
  MessageSquare,
  Check,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lock,
  Loader2,
} from "lucide-react";
import {
  pendientesTutor,
  resolverSolicitud,
  type Sesion,
} from "../lib/sesiones";
import { ApiError } from "../lib/api";
import { VoiceSearchInput } from "./VoiceSearchInput";

interface Props {
  idTutor: number;
}

function iniciales(nombreCompleto: string): string {
  return nombreCompleto
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatFecha(fechaISO: string): string {
  const [y, m, d] = fechaISO.split("-");
  return `${d}/${m}/${y}`;
}

function formatHora(horaISO: string): string {
  return horaISO.slice(0, 5);
}

/* ── Reject modal ─────────────────────────────────────────────────── */
function RechazarModal({
  sesion,
  onConfirm,
  onClose,
  enviando,
}: {
  sesion: Sesion;
  onConfirm: (justificacion: string) => void;
  onClose: () => void;
  enviando: boolean;
}) {
  const [texto, setTexto] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-card-foreground" style={{ fontSize: "0.95rem" }}>
            Rechazar solicitud
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            Solicitud de{" "}
            <strong className="text-foreground">
              {sesion.estudianteNombre}
            </strong>{" "}
            — {sesion.asignaturaNombre}
          </p>
          <div className="space-y-1.5">
            <label
              className="text-card-foreground"
              style={{ fontSize: "0.82rem" }}
            >
              Justificación{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={3}
              placeholder="Ej: No tengo disponibilidad en ese horario..."
              className="w-full rounded-xl border border-border-strong bg-input-background text-card-foreground px-4 py-3 outline-none focus focus resize-none placeholder transition-all"
              style={{ fontSize: "0.875rem" }}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-2.5 text-foreground hover:bg-secondary transition-all"
              style={{ fontSize: "0.875rem" }}
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(texto)}
              disabled={enviando}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
              style={{ background: "#EF4444", fontSize: "0.875rem" }}
            >
              {enviando && <Loader2 size={14} className="animate-spin" />}
              Confirmar rechazo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════ */
export function SolicitudesPendientes({ idTutor }: Props) {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [expandida, setExpandida] = useState<number | null>(null);
  const [rechazando, setRechazando] = useState<Sesion | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [justificaciones, setJustificaciones] = useState<
    Record<number, string>
  >({});
  const [recienActuado, setRecienActuado] = useState<{
    id: number;
    accion: "APROBADA" | "RECHAZADA";
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setLoadError(null);
    pendientesTutor(idTutor)
      .then(setSesiones)
      .catch((err) =>
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar las solicitudes.",
        ),
      )
      .finally(() => setCargando(false));
  }, [idTutor]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const aprobar = async (id: number) => {
    setProcesando(id);
    setActionError(null);
    try {
      await resolverSolicitud(id, true);
      setExpandida(null);
      setRecienActuado({ id, accion: "APROBADA" });
      setTimeout(() => setRecienActuado(null), 3000);
      cargar();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "No se pudo aprobar la solicitud.",
      );
    } finally {
      setProcesando(null);
    }
  };

  const rechazar = async (id: number, justificacion: string) => {
    setProcesando(id);
    setActionError(null);
    try {
      await resolverSolicitud(id, false, justificacion || undefined);
      if (justificacion)
        setJustificaciones((prev) => ({ ...prev, [id]: justificacion }));
      setRechazando(null);
      setExpandida(null);
      setRecienActuado({ id, accion: "RECHAZADA" });
      setTimeout(() => setRecienActuado(null), 3000);
      cargar();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "No se pudo rechazar la solicitud.",
      );
    } finally {
      setProcesando(null);
    }
  };

  const pendientes = sesiones
    .filter(
      (s) =>
        s.estado === "PENDIENTE" &&
        (s.estudianteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          s.asignaturaNombre.toLowerCase().includes(busqueda.toLowerCase())),
    )
    .sort((a, b) => a.fechaSesion.localeCompare(b.fechaSesion));

  const gestionadas = sesiones.filter(
    (s) => s.estado === "APROBADA" || s.estado === "RECHAZADA",
  );

  if (cargando) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full rounded-2xl border border-border bg-card p-8 text-center">
        <AlertCircle size={24} className="mx-auto mb-2 text-destructive" />
        <p className="text-destructive" style={{ fontSize: "0.9rem" }}>
          {loadError}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-foreground">Solicitudes Pendientes</h2>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            {pendientes.length} solicitud{pendientes.length !== 1 ? "es" : ""} ·
            ordenadas por fecha
          </p>
        </div>
        <VoiceSearchInput
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar por estudiante o asignatura..."
          className="w-full sm:w-[280px] rounded-xl border border-border-strong bg-input-background text-foreground transition-colors hover:border-brand-blue focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
        />
      </div>
      {actionError && (
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <p className="text-destructive" style={{ fontSize: "0.85rem" }}>
            {actionError}
          </p>
        </div>
      )}
      {/* Toast notification */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: recienActuado ? "60px" : "0px",
          opacity: recienActuado ? 1 : 0,
        }}
      >
        {recienActuado && (
          <div
            className="flex items-center gap-2.5 rounded-xl px-4 py-3"
            style={{
              background:
                recienActuado.accion === "APROBADA"
                  ? "rgba(16,185,129,0.1)"
                  : "rgba(239,68,68,0.08)",
              border: `1px solid ${recienActuado.accion === "APROBADA" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.25)"}`,
            }}
          >
            <CheckCircle2
              size={14}
              style={{
                color:
                  recienActuado.accion === "APROBADA" ? "#10B981" : "#EF4444",
              }}
            />
            <p
              style={{
                fontSize: "0.85rem",
                color:
                  recienActuado.accion === "APROBADA" ? "#10B981" : "#EF4444",
              }}
            >
              {recienActuado.accion === "APROBADA"
                ? `Solicitud #${recienActuado.id} aprobada — el bloque de horario ha sido bloqueado automáticamente.`
                : `Solicitud #${recienActuado.id} rechazada — el estudiante recibirá una notificación.`}
            </p>
          </div>
        )}
      </div>
      {/* Approve note */}{" "}
      <div className="flex items-start gap-2.5 rounded-xl border border-brand-blue/25 bg-brand-blue/5 px-4 py-3">
        {" "}
        <Lock size={13} className="mt-0.5 shrink-0 text-brand-blue" />
        <p
          className="text-text-secondary"
          style={{ fontSize: "0.88rem", lineHeight: 1.5 }}
        >
          Al <strong className="text-brand-blue-text">aprobar</strong> una
          solicitud, el bloque de horario correspondiente se bloquea
          automáticamente para evitar duplicados. Al{" "}
          <strong className="text-destructive">rechazar</strong>, puedes
          ingresar una justificación opcional que será enviada al
          estudiante.{" "}
        </p>{" "}
      </div>
      {/* Empty state */}
      {pendientes.length === 0 && !busqueda && (
        <div className="bg-card rounded-2xl border border-border py-16 text-center">
          <CheckCircle2 size={32} className="mx-auto mb-3 text-brand-blue" />
          <p className="text-foreground" style={{ fontSize: "0.95rem" }}>
            Sin solicitudes pendientes
          </p>
          <p
            className="text-muted-foreground mt-1"
            style={{ fontSize: "0.82rem" }}
          >
            Todas las solicitudes han sido gestionadas
          </p>
        </div>
      )}
      {/* Cards */}
      <div className="space-y-3">
        {pendientes.map((s) => {
          const isOpen = expandida === s.id;
          const isProcesando = procesando === s.id;
          return (
            <div
              key={s.id}
              className="bg-card rounded-2xl border border-border overflow-hidden transition-all"
            >
              <button
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors text-left"
                onClick={() => setExpandida(isOpen ? null : s.id)}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--brand-blue-dark), var(--brand-blue))",
                    fontSize: "0.68rem",
                  }}
                >
                  {iniciales(s.estudianteNombre)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground" style={{ fontSize: "0.9rem" }}>
                    {s.estudianteNombre}
                  </p>
                  <p
                    className="text-muted-foreground"
                    style={{ fontSize: "0.78rem" }}
                  >
                    {s.asignaturaNombre} · {formatFecha(s.fechaSesion)} ·{" "}
                    {formatHora(s.horaInicio)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="rounded-full px-2 py-0.5"
                    style={{
                      fontSize: "0.68rem",
                      color: "#F59E0B",
                      background: "rgba(245,158,11,0.12)",
                    }}
                  >
                    Pendiente
                  </span>
                  {isOpen ? (
                    <ChevronUp size={15} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={15} className="text-muted-foreground" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
                  {/* Meta grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon: User, label: "Código", val: `#${s.id}` },
                      {
                        icon: BookOpen,
                        label: "Asignatura",
                        val: s.asignaturaNombre,
                      },
                      {
                        icon: Calendar,
                        label: "Fecha",
                        val: formatFecha(s.fechaSesion),
                      },
                      {
                        icon: Clock,
                        label: "Hora",
                        val: formatHora(s.horaInicio),
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="rounded-xl bg-secondary p-3"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <row.icon size={11} className="text-brand-blue" />
                          <span
                            className="text-muted-foreground"
                            style={{
                              fontSize: "0.68rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {row.label}
                          </span>
                        </div>
                        <p
                          className="text-foreground"
                          style={{
                            fontSize: "0.82rem",
                            fontFamily:
                              row.label === "Código"
                                ? "var(--font-mono)"
                                : undefined,
                          }}
                        >
                          {row.val}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-secondary p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <MessageSquare size={12} className="text-brand-blue" />
                      <span
                        className="text-muted-foreground"
                        style={{
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Estudiante
                      </span>
                    </div>
                    <p
                      className="text-foreground"
                      style={{ fontSize: "0.875rem", lineHeight: 1.6 }}
                    >
                      {s.estudianteNombre}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <MessageSquare size={12} className="text-brand-blue" />
                      <span
                        className="text-muted-foreground"
                        style={{
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Dificultades declaradas
                      </span>
                    </div>
                    <p
                      className="text-foreground"
                      style={{ fontSize: "0.875rem", lineHeight: 1.6 }}
                    >
                      {s.descripcionDificultades?.trim() ||
                        "El estudiante no indicó dificultades específicas."}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => aprobar(s.id)}
                      disabled={isProcesando}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-white transition-all hover active disabled focus-visible focus-visible focus-visible focus-visible"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {isProcesando ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Check size={15} />
                      )}
                      Aprobar
                    </button>
                    <button
                      onClick={() => setRechazando(s)}
                      disabled={isProcesando}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-destructive py-2.5 text-destructive transition-all hover:bg-destructive/5 active:scale-95 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      style={{
                        fontSize: "0.875rem",
                        background: "transparent",
                      }}
                    >
                      <X size={15} />
                      Rechazar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Gestionadas */}
      {gestionadas.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p
              className="text-muted-foreground"
              style={{
                fontSize: "0.78rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Solicitudes gestionadas
            </p>
          </div>
          <div className="divide-y divide-border">
            {gestionadas.map((s) => (
              <div key={s.id} className="px-5 py-3 space-y-1">
                <div className="flex items-center gap-4">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white"
                    style={{
                      background: "var(--muted)",
                      color: "var(--muted-foreground)",
                      fontSize: "0.6rem",
                    }}
                  >
                    {iniciales(s.estudianteNombre)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-foreground truncate"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {s.estudianteNombre}
                    </p>
                    <p
                      className="text-muted-foreground"
                      style={{ fontSize: "0.75rem" }}
                    >
                      {s.asignaturaNombre} · {formatFecha(s.fechaSesion)}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 shrink-0"
                    style={{
                      fontSize: "0.72rem",
                      color: s.estado === "APROBADA" ? "#10B981" : "#EF4444",
                      background:
                        s.estado === "APROBADA"
                          ? "rgba(16,185,129,0.12)"
                          : "rgba(239,68,68,0.1)",
                    }}
                  >
                    {s.estado === "APROBADA" ? "Aprobada" : "Rechazada"}
                  </span>
                </div>
                {s.estado === "RECHAZADA" && justificaciones[s.id] && (
                  <div className="ml-11 flex items-start gap-2">
                    <AlertCircle
                      size={11}
                      style={{ color: "#6B7280", marginTop: "2px" }}
                    />
                    <p
                      className="text-muted-foreground"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Justificación: {justificaciones[s.id]}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {rechazando && (
        <RechazarModal
          sesion={rechazando}
          enviando={procesando === rechazando.id}
          onConfirm={(j) => rechazar(rechazando.id, j)}
          onClose={() => setRechazando(null)}
        />
      )}
    </div>
  );
}
