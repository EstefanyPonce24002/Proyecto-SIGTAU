import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  UserRound,
  Video,
} from "lucide-react";
import { ApiError } from "../lib/api";
import {
  cancelarSesion,
  historialEstudiante,
  type EstadoSesion,
  type Sesion,
} from "../lib/sesiones";
import { sesionesAgenda } from "../lib/proximos";
import { QuickAccessNav, type QuickAccessTab } from "./QuickAccessNav";

interface Props {
  idEstudiante: number;
  onVerHistorial: () => void;
  onSolicitar: () => void;
  onNavigate: (tab: QuickAccessTab) => void;
}

type EventoExtendido = Sesion & {
  modalidad?: "VIRTUAL" | "PRESENCIAL";
  enlaceVirtual?: string;
};

const ESTADO_CONFIG: Record<
  EstadoSesion,
  { label: string; color: string; bg: string }
> = {
  PENDIENTE: {
    label: "Pendiente",
    color: "#B77908",
    bg: "rgba(245,158,11,0.14)",
  },
  APROBADA: {
    label: "Confirmada",
    color: "#16805F",
    bg: "rgba(34,197,139,0.15)",
  },
  COMPLETADA: {
    label: "Completada",
    color: "#6451B8",
    bg: "rgba(124,92,218,0.14)",
  },
  CANCELADA: {
    label: "Cancelada",
    color: "#C34B5A",
    bg: "rgba(239,68,68,0.12)",
  },
  RECHAZADA: {
    label: "Rechazada",
    color: "#C34B5A",
    bg: "rgba(239,68,68,0.12)",
  },
};

// Convierte una fecha "YYYY-MM-DD" a una fecha local.
function fechaLocal(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Formatea la hora como "HH:MM".
function formatHora(value: string): string {
  return value.slice(0, 5);
}

// Obtiene la modalidad del evento.
function getModalidad(evento: Sesion): "VIRTUAL" | "PRESENCIAL" {
  return (evento as EventoExtendido).modalidad ?? "PRESENCIAL";
}

// Calcula los minutos que faltan para iniciar una sesión.
function minutosHasta(evento: Sesion): number {
  const inicio = fechaLocal(evento.fechaSesion);
  const [hours, minutes] = evento.horaInicio.split(":").map(Number);

  inicio.setHours(hours, minutes, 0, 0);

  return (inicio.getTime() - Date.now()) / 60000;
}

// Componente de fecha para cada evento.
function FechaEvento({ fecha }: { fecha: string }) {
  const date = fechaLocal(fecha);

  return (
    <div
      className="flex w-full shrink-0 items-center gap-3 rounded-xl px-3 py-2 sm:w-16 sm:flex-col sm:gap-0 sm:px-2 sm:py-2.5"
      style={{
        background: "rgba(59,130,246,0.1)",
        color: "#2563EB",
      }}
    >
      <span className="text-xs font-semibold uppercase">
        {date
          .toLocaleDateString("es-SV", { month: "short" })
          .replace(".", "")}
      </span>

      <strong
        className="text-2xl leading-none sm:mt-1"
        style={{ color: "#d6dee5" }}
      >
        {date.getDate()}
      </strong>

      <span className="text-xs capitalize sm:mt-1">
        {date
          .toLocaleDateString("es-SV", { weekday: "short" })
          .replace(".", "")}
      </span>
    </div>
  );
}

// Tarjeta individual de una sesión de tutoría.
function TarjetaEvento({
  evento,
  onCancel,
  cancelando,
}: {
  evento: Sesion;
  onCancel: () => void;
  cancelando: boolean;
}) {
  const config = ESTADO_CONFIG[evento.estado];
  const modalidad = getModalidad(evento);

  const puedeUnirse =
    modalidad === "VIRTUAL" &&
    minutosHasta(evento) >= 0 &&
    minutosHasta(evento) < 10;

  const enlace = (evento as EventoExtendido).enlaceVirtual;

  const puedeCancelar =
    evento.estado === "PENDIENTE" || evento.estado === "APROBADA";

  return (
    <article className="rounded-2xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <FechaEvento fecha={evento.fechaSesion} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3
              className="min-w-0 truncate font-semibold text-foreground"
              title={evento.asignaturaNombre}
            >
              {evento.asignaturaNombre}
            </h3>

            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                color: config.color,
                background: config.bg,
              }}
            >
              {config.label}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1.5">
              <UserRound size={14} className="shrink-0" />
              <span className="truncate">{evento.tutorNombre}</span>
            </span>

            <span className="flex items-center gap-1.5">
              <Clock3 size={14} className="shrink-0" />
              {formatHora(evento.horaInicio)} –{" "}
              {formatHora(evento.horaFin)}
            </span>

            <span className="flex items-center gap-1.5">
              {modalidad === "VIRTUAL" ? (
                <Video size={14} />
              ) : (
                <MapPin size={14} />
              )}

              {modalidad === "VIRTUAL" ? "Virtual" : "Presencial"}
            </span>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
          {puedeUnirse ? (
            <a
              href={enlace ?? "#"}
              target={enlace ? "_blank" : undefined}
              rel={enlace ? "noreferrer" : undefined}
              onClick={(event) => {
                if (!enlace) {
                  event.preventDefault();
                }
              }}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98] sm:flex-none"
              style={{
                background:
                  "linear-gradient(135deg, #1E3A8A, #3B82F6)",
              }}
            >
              <ExternalLink size={15} />
              Unirse
            </a>
          ) : puedeCancelar ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelando}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-500 transition-all hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:hover:bg-red-950/20 sm:flex-none"
            >
              {cancelando && (
                <Loader2 size={15} className="animate-spin" />
              )}
              Cancelar
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ProximosEventos({
  idEstudiante,
  onVerHistorial,
  onSolicitar,
  onNavigate,
}: Props) {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<number | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);

    historialEstudiante(idEstudiante)
      .then(setSesiones)
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar la agenda.",
        ),
      )
      .finally(() => setCargando(false));
  }, [idEstudiante]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const { proximas, vencidas } = sesionesAgenda(sesiones);
  const eventos = [...proximas, ...vencidas];
  const vacia = eventos.length === 0;

  const cancelar = async (evento: Sesion) => {
    setCancelando(evento.id);

    try {
      await cancelarSesion(evento.id);
      cargar();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo cancelar la sesión.",
      );
    } finally {
      setCancelando(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <QuickAccessNav
        activeTab="eventos"
        onNavigate={onNavigate}
      />

      <div className="mb-6">
        <div className="min-w-0">
          <h1
            className="text-foreground"
            style={{
              fontSize: "1.4rem",
              fontWeight: 500,
              lineHeight: 1.3,
            }}
          >
            Revisa las tutorías pendientes y confirmadas en un solo lugar.
          </h1>
        </div>
      </div>

      {cargando && (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-16">
          <Loader2
            size={25}
            className="animate-spin text-muted-foreground"
          />
        </div>
      )}

      {!cargando && error && (
        <div
          role="alert"
          className="rounded-2xl border border-border bg-card p-7 text-center"
        >
          <AlertTriangle
            size={24}
            className="mx-auto mb-2 text-destructive"
          />

          <p
            className="text-destructive"
            style={{ fontSize: "0.9rem" }}
          >
            {error}
          </p>

          <button
            type="button"
            onClick={cargar}
            className="mt-4 min-h-11 rounded-xl border border-[#118AB2] px-4 py-2.5 text-sm font-medium text-[#118AB2] transition-all hover:bg-[#118AB2] hover:text-white"
          >
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && vacia && (
        <div className="rounded-2xl border border-border bg-card p-7 text-center sm:p-10">
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              background: "rgba(17,138,178,0.10)",
              color: "#118AB2",
            }}
          >
            <CalendarDays size={38} />
          </div>

          <h2
            className="mt-5 text-foreground"
            style={{ fontSize: "1.15rem" }}
          >
            ¡Todo al día!
          </h2>

          <p
            className="mx-auto mt-2 max-w-md text-muted-foreground"
            style={{
              fontSize: "0.86rem",
              lineHeight: 1.6,
            }}
          >
            No tienes sesiones próximas. Cuando una tutoría sea aprobada,
            aparecerá aquí con su fecha y horario.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onSolicitar}
              className="min-h-11 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, #1E3A8A, #3B82F6)",
              }}
            >
              + Solicitar tutoría
            </button>

            <button
              type="button"
              onClick={onSolicitar}
              className="min-h-11 rounded-xl border border-[#118AB2] px-5 py-2.5 text-sm font-medium text-[#118AB2] transition-all hover:bg-[#118AB2] hover:text-white"
            >
              Ver tutores
            </button>
          </div>
        </div>
      )}

      {!cargando && !error && !vacia && (
        <div className="space-y-3">
          {proximas.length > 0 &&
            proximas.map((evento) => (
              <TarjetaEvento
                key={evento.id}
                evento={evento}
                onCancel={() => cancelar(evento)}
                cancelando={cancelando === evento.id}
              />
            ))}

          {vencidas.length > 0 && (
            <>
              <p className="pt-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Pendientes de realizar
              </p>

              {vencidas.map((evento) => (
                <TarjetaEvento
                  key={evento.id}
                  evento={evento}
                  onCancel={() => cancelar(evento)}
                  cancelando={cancelando === evento.id}
                />
              ))}
            </>
          )}
        </div>
      )}

      {!cargando && !error && !vacia && (
        <button
          type="button"
          onClick={onVerHistorial}
          className="mt-5 min-h-11 rounded-xl border border-[#118AB2] px-4 py-2.5 text-sm font-medium text-[#118AB2] transition-all hover:bg-[#118AB2] hover:text-white"
        >
          Ver todas mis tutorías
        </button>
      )}
    </div>
  );
}