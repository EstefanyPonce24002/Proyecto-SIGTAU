// IMPORTACIONES

import { useState, useEffect, useCallback } from "react";

import {
  Eye,
  ChevronDown,
  X,
  FileText,
  Clock,
  BookOpen,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Funciones y tipos de la capa de datos (API)

import {
  historialTutor,
  cancelarSesion,
  reprogramarSesion,
  type Sesion,
  type EstadoSesion,
} from "../lib/sesiones";

import { ApiError } from "../lib/api";

import {
  listarHorariosDelTutor,
  DIA_LABEL,
  formatHora as formatCatalogoHora,
  type HorarioOption,
} from "../lib/catalogo";

import { VoiceSearchInput } from "./VoiceSearchInput";

// TIPOS Y CONSTANTES

interface Props {
  idTutor: number; // ID del tutor cuyo historial se va a mostrar
}

// Configuración visual de cada estado de sesión (colores y etiquetas)

const ESTADO_CONFIG: Record<
  EstadoSesion,
  { label: string; color: string; bg: string }
> = {
  PENDIENTE: {
    label: "Pendiente",

    color: "#F59E0B",

    bg: "rgba(245,158,11,0.12)",
  },

  APROBADA: {
    label: "Aprobada",

    color: "#3B82F6",

    bg: "rgba(59,130,246,0.12)",
  },

  COMPLETADA: {
    label: "Completada",

    color: "#10B981",

    bg: "rgba(16,185,129,0.12)",
  },

  CANCELADA: {
    label: "Cancelada",

    color: "#6B7280",

    bg: "rgba(122,144,184,0.12)",
  },

  RECHAZADA: {
    label: "Rechazada",

    color: "#EF4444",

    bg: "rgba(239,68,68,0.12)",
  },
};

// FUNCIONES AUXILIARES DE FORMATO

function formatFecha(fechaISO: string): string {
  const [y, m, d] = fechaISO.split("-");

  const meses = [
    "",

    "ene",

    "feb",

    "mar",

    "abr",

    "may",

    "jun",

    "jul",

    "ago",

    "sep",

    "oct",

    "nov",

    "dic",
  ];

  return `${d} ${meses[Number(m)]} ${y}`;
}

function iniciales(nombre: string): string {
  return nombre

    .split(" ")

    .filter(Boolean)

    .slice(0, 2)

    .map((palabra) => palabra[0])

    .join("")

    .toUpperCase();
}

function formatHora(horaISO: string): string {
  return horaISO.slice(0, 5);
}

// SUBCOMPONENTE: Badge de Estado

function EstadoBadge({ estado }: { estado: EstadoSesion }) {
  const cfg = ESTADO_CONFIG[estado];

  return (
    <span
      className="rounded-full px-2.5 py-1 inline-block whitespace-nowrap"
      style={{ fontSize: "0.72rem", color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

// SUBCOMPONENTE: Modal de Detalle

function DetalleModal({
  sesion,
  onClose,
  onReprogramar,
  onCancelar,
  cancelando,
  errorCancelacion,
}: {
  sesion: Sesion;
  onClose: () => void;
  onReprogramar: (sesion: Sesion) => void;
  onCancelar: () => void;
  cancelando: boolean;
  errorCancelacion: string | null;
}) {
  const calificacion = sesion.calificacionProgreso;
  const config = ESTADO_CONFIG[sesion.estado];

  const mensajes: Record<
    EstadoSesion,
    { titulo: string; descripcion: string }
  > = {
    PENDIENTE: {
      titulo: "Solicitud pendiente",
      descripcion:
        "Esta solicitud está pendiente de gestión. Puedes cancelar la solicitud o reprogramar la tutoría si necesitas otro horario.",
    },
    APROBADA: {
      titulo: "Tutoría confirmada",
      descripcion:
        "La tutoría ha sido aprobada y está programada. Si necesitas cambiar el horario, puedes reprogramarla o cancelarla.",
    },
    COMPLETADA: {
      titulo: "Sesión finalizada",
      descripcion:
        "Esta tutoría ha finalizado. Aquí puedes consultar las observaciones académicas y la calificación de progreso, si están disponibles.",
    },
    CANCELADA: {
      titulo: "Tutoría cancelada",
      descripcion:
        "Esta tutoría fue cancelada y ya no requiere acciones adicionales.",
    },
    RECHAZADA: {
      titulo: "Solicitud rechazada",
      descripcion:
        "Esta solicitud fue rechazada y no se realizará en el horario solicitado.",
    },
  };

  const puedeGestionar =
    sesion.estado === "PENDIENTE" || sesion.estado === "APROBADA";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-sesion-titulo"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <FileText size={17} className="text-emerald-500" />
            <h3
              id="detalle-sesion-titulo"
              className="font-semibold text-card-foreground"
            >
              Detalle de Sesión
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle de sesión"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X size={19} />
          </button>
        </header>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="break-words font-medium leading-snug">
                {sesion.asignaturaNombre}
              </h4>
              <p className="mt-1 break-words text-sm text-muted-foreground">
                {sesion.estudianteNombre}
              </p>
            </div>

            <span
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
              style={{ color: config.color, background: config.bg }}
            >
              {config.label}
            </span>
          </div>

          <div
            className="rounded-xl border p-4"
            style={{
              borderColor: `${config.color}35`,
              background: config.bg,
            }}
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 shrink-0 text-base font-bold"
                style={{ color: config.color }}
                aria-hidden="true"
              >
                {sesion.estado === "APROBADA" || sesion.estado === "COMPLETADA"
                  ? "✓"
                  : sesion.estado === "PENDIENTE"
                    ? "!"
                    : "×"}
              </span>
              <div className="min-w-0">
                <p
                  className="text-sm font-semibold"
                  style={{ color: config.color }}
                >
                  {mensajes[sesion.estado].titulo}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-card-foreground">
                  {mensajes[sesion.estado].descripcion}
                </p>
              </div>
            </div>
          </div>

          {sesion.estado === "COMPLETADA" && (
            <div className="space-y-3">
              {calificacion !== null && calificacion !== undefined && (
                <div className="rounded-xl bg-secondary p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      Calificación de progreso
                    </span>
                    <span
                      className="font-semibold"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color:
                          calificacion >= 7
                            ? "#10B981"
                            : calificacion >= 5
                              ? "#F59E0B"
                              : "#EF4444",
                      }}
                    >
                      {calificacion.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(0, Math.min(100, calificacion * 10))}%`,
                        background:
                          calificacion >= 7
                            ? "#10B981"
                            : calificacion >= 5
                              ? "#F59E0B"
                              : "#EF4444",
                      }}
                    />
                  </div>
                </div>
              )}

              {sesion.observacionesTutor && (
                <div className="rounded-xl bg-secondary p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <BookOpen size={15} className="text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Observaciones académicas
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {sesion.observacionesTutor}
                  </p>
                </div>
              )}
            </div>
          )}

          {errorCancelacion && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400"
            >
              {errorCancelacion}
            </div>
          )}
        </div>

        <footer className="flex flex-col gap-3 px-5 pb-5 sm:flex-row sm:px-6">
          {puedeGestionar ? (
            <>
              <button
                type="button"
                onClick={onCancelar}
                disabled={cancelando}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:border-red-500/40 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
              >
                {cancelando && <Loader2 size={16} className="animate-spin" />}
                {cancelando ? "Cancelando..." : "Cancelar"}
              </button>

              

<button
  type="button"
  onClick={() => onReprogramar(sesion)}
  disabled={cancelando}
  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[#118AB2] px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#0F789B] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#118AB2]/40 focus-visible:ring-offset-2"
>
  Reprogramar tutoría
</button>


            </>
          ) : (
            
<button
  type="button"
  onClick={onClose}
  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#118AB2] px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#0F789B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#118AB2]/40 focus-visible:ring-offset-2"
>
  Cerrar
</button>

          )}
        </footer>
      </section>
    </div>
  );
}

function ReprogramarModal({
  sesion,

  onClose,

  onSaved,
}: {
  sesion: Sesion;

  onClose: () => void;

  onSaved: (sesion: Sesion) => void;
}) {
  const [fecha, setFecha] = useState(sesion.fechaSesion);

  const [horarios, setHorarios] = useState<HorarioOption[]>([]);

  const [idHorario, setIdHorario] = useState(String(sesion.idHorario ?? ""));

  const [cargando, setCargando] = useState(true);

  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarHorariosDelTutor(sesion.idTutor)
      .then(setHorarios)

      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar los horarios.",
        ),
      )

      .finally(() => setCargando(false));
  }, [sesion.idTutor]);

  const dia = (() => {
    if (!fecha) return null;

    const day = new Date(`${fecha}T12:00:00`).getDay();

    return [
      "DOMINGO",
      "LUNES",
      "MARTES",
      "MIERCOLES",
      "JUEVES",
      "VIERNES",
      "SABADO",
    ][day];
  })();

  const opciones = horarios.filter(
    (h) => h.diaSemana === dia && (h.disponible || h.id === sesion.idHorario),
  );

  const seleccionado = opciones.find((h) => String(h.id) === idHorario);

  async function guardar() {
    if (!seleccionado) {
      setError("Selecciona un horario disponible para la nueva fecha.");

      return;
    }

    setGuardando(true);

    setError(null);

    try {
      const actualizada = await reprogramarSesion(sesion.id, {
        idHorario: seleccionado.id,

        fecha,

        horaInicio: seleccionado.horaInicio,

        horaFin: seleccionado.horaFin,
      });

      onSaved(actualizada);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo reprogramar la sesión.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-card-foreground font-semibold">
            Reprogramar tutoría #{sesion.id}
          </h3>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">
              Nueva fecha
            </label>

            <input
              type="date"
              value={fecha}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => {
                setFecha(e.target.value);
                setIdHorario("");
              }}
              className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">
              Nuevo horario
            </label>

            <select
              value={idHorario}
              onChange={(e) => setIdHorario(e.target.value)}
              disabled={cargando || opciones.length === 0}
              className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2.5"
            >
              <option value="">
                {cargando
                  ? "Cargando horarios..."
                  : opciones.length
                    ? "Selecciona un horario"
                    : "No hay horarios para ese día"}
              </option>

              {opciones.map((h) => (
                <option key={h.id} value={h.id}>
                  {DIA_LABEL[h.diaSemana]} · {formatCatalogoHora(h.horaInicio)}{" "}
                  - {formatCatalogoHora(h.horaFin)}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-4 text-sm font-medium text-red-600 transition-colors duration-200 hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-700 active:bg-red-500/25 active:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={guardar}
            disabled={guardando || !seleccionado}
            className="inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-medium text-white transition-colors hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{ background: "#118AB2" }}
          >
            {guardando ? "Guardando..." : "Reprogramar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// COMPONENTE PRINCIPAL: HistorialSesiones

export function HistorialSesiones({ idTutor }: Props) {
  // --- SECCIÓN 1: ESTADOS ---

  const [sesiones, setSesiones] = useState<Sesion[]>([]);

  const [cargando, setCargando] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");

  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const [detalle, setDetalle] = useState<Sesion | null>(null);

  const [reprogramar, setReprogramar] = useState<Sesion | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [errorCancelacion, setErrorCancelacion] = useState<string | null>(null);

  // --- SECCIÓN 2: CARGA DE DATOS ---

  const cargar = useCallback(() => {
    setCargando(true);

    setLoadError(null);

    historialTutor(idTutor)
      .then(setSesiones)

      .catch((err) =>
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el historial.",
        ),
      )

      .finally(() => setCargando(false));
  }, [idTutor]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cancelarDetalle = async (sesion: Sesion) => {
    if (cancelando) return;

    setCancelando(true);
    setErrorCancelacion(null);

    try {
      await cancelarSesion(sesion.id);
      setDetalle(null);
      setErrorCancelacion(null);
      cargar();
    } catch (err: unknown) {
      setErrorCancelacion(
        err instanceof ApiError
          ? err.message
          : "No se pudo cancelar la tutoría. Inténtalo nuevamente.",
      );
    } finally {
      setCancelando(false);
    }
  };

  // --- SECCIÓN 3: DATOS DERIVADOS ---

  const filtradas = sesiones.filter((s) => {
    const matchB =
      s.estudianteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.asignaturaNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(s.id).includes(busqueda);

    const matchE = filtroEstado === "Todos" || s.estado === filtroEstado;

    return matchB && matchE;
  });

  // --- SECCIÓN 4: RENDERIZADO CONDICIONAL (LOADING / ERROR) ---

  if (cargando) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full rounded-2xl border border-border bg-card p-8 text-center dark:border-[#2A4158]">
        <AlertCircle size={24} className="mx-auto mb-2 text-destructive" />

        <p className="text-destructive" style={{ fontSize: "0.9rem" }}>
          {loadError}
        </p>
      </div>
    );
  }

  // --- SECCIÓN 5: RENDERIZADO PRINCIPAL ---

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 text-[#F1F5F9]">
      <h2 className="text-2xl font-semibold tracking-tight text-[#F1F5F9]">
        Consulta y gestiona tus sesiones
      </h2>

      <section className="overflow-hidden rounded-2xl border border-[#30465C] bg-[#192B3B]">
        <div className="flex flex-col gap-4 border-b border-[#30465C] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h3 className="text-base font-semibold text-[#F1F5F9]">
              Sesiones registradas
            </h3>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="w-full sm:w-[260px]">
              <VoiceSearchInput
                value={busqueda}
                onChange={setBusqueda}
                placeholder="Buscar..."
                className="min-w-0 flex-1 sm:w-64"
                style={
                  {
                    fontSize: "0.8rem",

                    borderColor: "#118AB2",

                    "--tw-ring-color": "#118AB2",
                  } as React.CSSProperties
                }
              />
            </div>

            <div className="relative w-full sm:w-[170px]">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="h-[42px] w-full appearance-none rounded-2xl border border-[#30465C] bg-[#1D3043] px-4 py-3 pr-9 text-sm text-[#F1F5F9] outline-none transition-colors hover:border-[#118AB2] focus:border-[#118AB2] focus:ring-2 focus:ring-[#118AB2]/20"
                style={{ fontSize: "0.8rem" }}
                aria-label="Filtrar por estado"
              >
                <option value="Todos">Todos los estados</option>

                {(
                  Object.entries(ESTADO_CONFIG) as [
                    EstadoSesion,
                    (typeof ESTADO_CONFIG)[EstadoSesion],
                  ][]
                ).map(([estado, config]) => (
                  <option key={estado} value={estado}>
                    {config.label}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#A8B7C8]"
              />
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#30465C] bg-[#192B3B]">
                {[
                  "Fecha",

                  "Hora",

                  "Asignatura",

                  "Estudiante",

                  "Calificación",

                  "Estado",

                  "Acciones",
                ].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-5 py-4 text-xs font-medium text-[#A8B7C8]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#30465C]">
              {filtradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-sm text-[#A8B7C8]"
                  >
                    No se encontraron sesiones
                  </td>
                </tr>
              ) : (
                filtradas.map((s) => (
                  <tr
                    key={s.id}
                    className="cursor-pointer bg-[#1D3043] transition-colors hover:bg-[#24394D]"
                    onClick={() => setDetalle(s)}
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-[#F1F5F9]">
                      {formatFecha(s.fechaSesion)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-[#D5DEE8]">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} className="text-[#A8B7C8]" />

                        {formatHora(s.horaInicio)}
                      </span>
                    </td>

                    <td className="max-w-[220px] px-5 py-4 text-sm text-[#F1F5F9]">
                      <span
                        className="block truncate"
                        title={s.asignaturaNombre}
                      >
                        {s.asignaturaNombre}
                      </span>
                    </td>

                    <td className="max-w-[240px] px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#118AB2] text-[10px] font-semibold text-white">
                          {iniciales(s.estudianteNombre)}
                        </div>

                        <span
                          className="truncate text-sm text-[#F1F5F9]"
                          title={s.estudianteNombre}
                        >
                          {s.estudianteNombre}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {s.calificacionProgreso !== null &&
                      s.calificacionProgreso !== undefined ? (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",

                            fontSize: "0.9rem",

                            color:
                              s.calificacionProgreso >= 7
                                ? "#10B981"
                                : s.calificacionProgreso >= 5
                                  ? "#F59E0B"
                                  : "#EF4444",
                          }}
                        >
                          {s.calificacionProgreso.toFixed(1)}
                        </span>
                      ) : (
                        <span
                          className="text-[#A8B7C8]"
                          style={{ fontSize: "0.78rem" }}
                        >
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <EstadoBadge estado={s.estado} />
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();

                          setDetalle(s);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#118AB2] bg-[#192B3B] px-3.5 py-2 text-xs font-medium text-[#20C5E8] transition-colors hover:bg-[#118AB2]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C5E8]"
                      >
                        <Eye size={14} />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#30465C] px-5 py-3">
          <p className="text-xs text-[#A8B7C8]">
            Mostrando {filtradas.length} de {sesiones.length} sesiones
          </p>
        </div>
      </section>

      {detalle && (
        <DetalleModal
          sesion={detalle}
          onClose={() => {
            setDetalle(null);
            setErrorCancelacion(null);
          }}
          onReprogramar={(sesion) => {
            setDetalle(null);
            setErrorCancelacion(null);
            setReprogramar(sesion);
          }}
          onCancelar={() => {
            void cancelarDetalle(detalle);
          }}
          cancelando={cancelando}
          errorCancelacion={errorCancelacion}
        />
      )}

      {reprogramar && (
        <ReprogramarModal
          sesion={reprogramar}
          onClose={() => setReprogramar(null)}
          onSaved={(sesionActualizada) => {
            setSesiones((prev) =>
              prev.map((s) =>
                s.id === sesionActualizada.id ? sesionActualizada : s,
              ),
            );

            setReprogramar(null);
          }}
        />
      )}
    </div>
  );
}
