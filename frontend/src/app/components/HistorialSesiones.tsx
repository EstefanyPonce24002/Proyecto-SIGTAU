// IMPORTACIONES
import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  ChevronDown,
  X,
  FileText,
  Calendar,
  Clock,
  User,
  BookOpen,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Funciones y tipos de la capa de datos (API)
import {
  historialTutor,
  reprogramarSesion,
  type Sesion,
  type EstadoSesion,
} from "../lib/sesiones";
import { ApiError } from "../lib/api";
import { listarHorariosDelTutor, DIA_LABEL, formatHora as formatCatalogoHora, type HorarioOption } from "../lib/catalogo";
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
  return `${d}/${m}/${y}`;
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
}: {
  sesion: Sesion;
  onClose: () => void;
  onReprogramar: (sesion: Sesion) => void;
}) {
  const calificacion = sesion.calificacionProgreso;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fondo oscuro semitransparente */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Contenedor del modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-[#2A4158]">
          <div className="flex items-center gap-2.5">
            <FileText size={15} style={{ color: "#10B981" }} />
            <h3
              className="text-card-foreground"
              style={{ fontSize: "0.95rem" }}
            >
              Detalle de Sesión
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="px-6 py-5 space-y-4">
          {/* Info principal */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-card-foreground">{sesion.asignaturaNombre}</p>
              <p
                className="text-muted-foreground"
                style={{ fontSize: "0.82rem" }}
              >
                {sesion.estudianteNombre}
              </p>
            </div>
            <EstadoBadge estado={sesion.estado} />
          </div>

          {/* Grid con 4 datos clave */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: Calendar,
                label: "Fecha",
                val: formatFecha(sesion.fechaSesion),
              },
              {
                icon: Clock,
                label: "Hora",
                val: formatHora(sesion.horaInicio),
              },
              { icon: FileText, label: "Código", val: `#${sesion.id}` },
              { icon: User, label: "Estudiante", val: sesion.estudianteNombre },
            ].map((row) => (
              <div key={row.label} className="rounded-xl bg-secondary p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <row.icon size={12} className="text-muted-foreground" />
                  <span
                    className="text-muted-foreground"
                    style={{
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {row.label}
                  </span>
                </div>
                <p
                  className="text-card-foreground"
                  style={{
                    fontSize: "0.82rem",
                    fontFamily:
                      row.label === "Código" ? "var(--font-mono)" : undefined,
                  }}
                >
                  {row.val}
                </p>
              </div>
            ))}
          </div>

          {/* Calificación de progreso */}
          {calificacion !== null && calificacion !== undefined && (
            <div className="rounded-xl bg-secondary p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={12} style={{ color: "#10B981" }} />
                <span
                  className="text-muted-foreground"
                  style={{
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Calificación de progreso
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${calificacion * 10}%`,
                      background:
                        calificacion >= 7
                          ? "#10B981"
                          : calificacion >= 5
                            ? "#F59E0B"
                            : "#EF4444",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "1rem",
                    color: "var(--card-foreground)",
                  }}
                >
                  {calificacion.toFixed(1)}
                </span>
              </div>
            </div>
          )}

          {/* Observaciones del tutor */}
          {sesion.observacionesTutor && (
            <div className="rounded-xl bg-secondary p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen size={12} className="text-muted-foreground" />
                <span
                  className="text-muted-foreground"
                  style={{
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Observaciones académicas
                </span>
              </div>
              <p
                className="text-card-foreground"
                style={{ fontSize: "0.875rem", lineHeight: 1.6 }}
              >
                {sesion.observacionesTutor}
              </p>
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="px-6 pb-5">
          {(sesion.estado === "PENDIENTE" || sesion.estado === "APROBADA") && (
            <button
              onClick={() => onReprogramar(sesion)}
              className="w-full rounded-xl py-2.5 mb-2 text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #0F766E, #14B8A6)" }}
            >
              Reprogramar tutoría
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #1E3A8A, #3B82F6)",
              fontSize: "0.875rem",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
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
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudieron cargar los horarios."))
      .finally(() => setCargando(false));
  }, [sesion.idTutor]);

  const dia = (() => {
    if (!fecha) return null;
    const day = new Date(`${fecha}T12:00:00`).getDay();
    return ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"][day];
  })();

  const opciones = horarios.filter((h) =>
    h.diaSemana === dia && (h.disponible || h.id === sesion.idHorario)
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
      setError(err instanceof ApiError ? err.message : "No se pudo reprogramar la sesión.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-card-foreground font-semibold">Reprogramar tutoría #{sesion.id}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Nueva fecha</label>
            <input
              type="date"
              value={fecha}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => { setFecha(e.target.value); setIdHorario(""); }}
              className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Nuevo horario</label>
            <select
              value={idHorario}
              onChange={(e) => setIdHorario(e.target.value)}
              disabled={cargando || opciones.length === 0}
              className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2.5"
            >
              <option value="">
                {cargando ? "Cargando horarios..." : opciones.length ? "Selecciona un horario" : "No hay horarios para ese día"}
              </option>
              {opciones.map((h) => (
                <option key={h.id} value={h.id}>
                  {DIA_LABEL[h.diaSemana]} · {formatCatalogoHora(h.horaInicio)} - {formatCatalogoHora(h.horaFin)}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm">Cancelar</button>
          <button
            onClick={guardar}
            disabled={guardando || !seleccionado}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #1E3A8A, #3B82F6)" }}
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
  const [filtroAsig, setFiltroAsig] = useState("Todas");
  const [detalle, setDetalle] = useState<Sesion | null>(null);
  const [reprogramar, setReprogramar] = useState<Sesion | null>(null);

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

  // --- SECCIÓN 3: DATOS DERIVADOS ---
  const asignaturas = [...new Set(sesiones.map((s) => s.asignaturaNombre))];

  const filtradas = sesiones.filter((s) => {
    const matchB =
      s.estudianteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.asignaturaNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(s.id).includes(busqueda);
    const matchE = filtroEstado === "Todos" || s.estado === filtroEstado;
    const matchA = filtroAsig === "Todas" || s.asignaturaNombre === filtroAsig;
    return matchB && matchE && matchA;
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
    <div className="w-full space-y-6">
      {/* ── Encabezado ── */}
      <div>
        <h2 className="text-foreground" style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Historial de Sesiones
        </h2>
        <p className="text-muted-foreground mt-1" style={{ fontSize: "0.85rem" }}>
          {sesiones.length} sesiones registradas
        </p>
      </div>

      {/* ── Tarjetas de Resumen ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          ["COMPLETADA", "APROBADA", "CANCELADA", "RECHAZADA"] as EstadoSesion[]
        ).map((e) => {
          const count = sesiones.filter((s) => s.estado === e).length;
          const cfg = ESTADO_CONFIG[e];
          const activo = filtroEstado === e;
          return (
            <button
              key={e}
              onClick={() => setFiltroEstado(activo ? "Todos" : e)}
              className={`bg-card rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
                activo ? "" : "border-border dark:border-[#2A4158]"
              }`}
              style={{ borderColor: activo ? cfg.color : undefined }}
            >
              <p
                style={{
                  fontSize: "1.4rem",
                  fontFamily: "var(--font-mono)",
                  color: cfg.color,
                  lineHeight: 1,
                }}
              >
                {count}
              </p>
              <p
                className="text-muted-foreground mt-1"
                style={{ fontSize: "0.73rem" }}
              >
                {cfg.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Buscador con voz */}
        <VoiceSearchInput
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar..."
          className="flex-1 border-[#118AB2] dark:border-[#118AB2]"
          style={{
            fontSize: "0.875rem",
            borderColor: "#118AB2",
          } as React.CSSProperties}
        />

        {/* Selectores de Estado y Asignatura */}
        {[
          {
            val: filtroEstado,
            set: setFiltroEstado,
            opts: ["Todos", ...Object.keys(ESTADO_CONFIG)],
            label: "Estado",
          },
          {
            val: filtroAsig,
            set: setFiltroAsig,
            opts: ["Todas", ...asignaturas],
            label: "Asignatura",
          },
        ].map((f) => (
          <div key={f.label} className="relative">
            <select
              value={f.val}
              onChange={(e) => f.set(e.target.value)}
              className="appearance-none rounded-xl border border-[#C9D8E6] bg-card text-foreground px-4 py-2.5 pr-9 outline-none focus:ring-2 transition-all dark:border-[#2A4158] dark:bg-[#1E2F42]"
              style={
                {
                  fontSize: "0.875rem",
                  "--tw-ring-color": "#118AB2",
                } as React.CSSProperties
              }
            >
              {f.opts.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        ))}
      </div>

      {/* ── Tabla de Sesiones ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden dark:border-[#2A4158]">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "640px" }}>
            {/* Cabecera de la tabla */}
            <thead>
              <tr className="border-b border-border bg-amber-50 dark:border-[#2A4158] dark:bg-amber-950/20">
                {[
                  "Fecha",
                  "Asignatura",
                  "Estudiante",
                  "Calificación",
                  "Estado",
                  "Ver",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-muted-foreground"
                    style={{
                      fontSize: "0.72rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Cuerpo de la tabla */}
            <tbody className="divide-y divide-border dark:divide-[#2A4158]">
              {filtradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                    style={{ fontSize: "0.875rem" }}
                  >
                    No se encontraron sesiones
                  </td>
                </tr>
              ) : (
                filtradas.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-secondary/40 transition-colors cursor-pointer"
                    onClick={() => setDetalle(s)}
                  >
                    <td className="px-5 py-3.5">
                      <p
                        className="text-foreground"
                        style={{ fontSize: "0.875rem" }}
                      >
                        {formatFecha(s.fechaSesion)}
                      </p>
                      <p
                        className="text-muted-foreground"
                        style={{
                          fontSize: "0.73rem",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {formatHora(s.horaInicio)}
                      </p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p
                        className="text-foreground"
                        style={{ fontSize: "0.875rem" }}
                      >
                        {s.asignaturaNombre}
                      </p>
                      <p
                        className="text-muted-foreground"
                        style={{
                          fontSize: "0.73rem",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        #{s.id}
                      </p>
                    </td>

                    <td
                      className="px-5 py-3.5 text-foreground"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {s.estudianteNombre}
                    </td>

                    <td className="px-5 py-3.5">
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
                          className="text-muted-foreground"
                          style={{ fontSize: "0.78rem" }}
                        >
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <EstadoBadge estado={s.estado} />
                    </td>

                    <td className="px-5 py-3.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetalle(s);
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de la tabla */}
        <div className="px-5 py-3 border-t border-border dark:border-[#2A4158]">
          <p className="text-muted-foreground" style={{ fontSize: "0.78rem" }}>
            Mostrando {filtradas.length} de {sesiones.length} sesiones
          </p>
        </div>
      </div>

      {/* ── Modal de Detalle ── */}
      {detalle && (
        <DetalleModal
          sesion={detalle}
          onClose={() => setDetalle(null)}
          onReprogramar={(sesion) => { setDetalle(null); setReprogramar(sesion); }}
        />
      )}
      {reprogramar && (
        <ReprogramarModal
          sesion={reprogramar}
          onClose={() => setReprogramar(null)}
          onSaved={(sesionActualizada) => {
            setSesiones((prev) => prev.map((s) => s.id === sesionActualizada.id ? sesionActualizada : s));
            setReprogramar(null);
          }}
        />
      )}
    </div>
  );
}