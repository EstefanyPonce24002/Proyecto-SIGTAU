import { useState, useEffect, useCallback } from "react";

// Importación de iconos SVG desde la librería lucide-react
import {
  CheckCircle2,
  Circle,
  Clock,
  Info,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Importación de funciones de la API de sesiones
import {
  historialTutor,
  registrarSeguimiento,
  type Sesion,
} from "../lib/sesiones";

// Clase de error personalizada para distinguir errores de API
import { ApiError } from "../lib/api";

// Props que recibe el componente
interface Props {
  idTutor: number; // ID del tutor para consultar sus sesiones
}

// Función que extrae las iniciales de un nombre completo
function iniciales(nombreCompleto: string): string {
  return nombreCompleto
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Función que formatea una fecha ISO a formato DD/MM/YYYY
function formatFecha(fechaISO: string): string {
  const [y, m, d] = fechaISO.split("-");
  return `${d}/${m}/${y}`;
}

// 👇 CORRECCIÓN: Función mejorada para agregar a.m. / p.m.
function formatHora(horaISO: string): string {
  if (!horaISO) return "";

  try {
    // Separamos horas y minutos (ej. "14:30:00" -> ["14", "30", "00"])
    const [horas, minutos] = horaISO.split(":");

    // Creamos un objeto Date temporal para aprovechar el formateador nativo
    const fecha = new Date();
    fecha.setHours(Number(horas), Number(minutos), 0, 0);

    // Formateamos usando Intl con hour12: true para obtener a.m. / p.m.
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(fecha);
  } catch (error) {
    // Si falla, devolvemos el string original recortado
    return horaISO.slice(0, 5);
  }
}

// Componente principal de Seguimiento Académico
export function SeguimientoAcademico({ idTutor }: Props) {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showRulesNotice, setShowRulesNotice] = useState(false);
  const [asistio, setAsistio] = useState(true);
  const [observaciones, setObservaciones] = useState("");
  const [calificacion, setCalificacion] = useState(7.0);
  const [calInput, setCalInput] = useState("7.0");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setLoadError(null);

    historialTutor(idTutor)
      .then((data) => {
        setSesiones(data);
        const elegibles = data.filter((s) => s.estado === "APROBADA");
        setSelectedId((prev) => prev ?? elegibles[0]?.id ?? null);
      })
      .catch((err) =>
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el listado.",
        ),
      )
      .finally(() => setCargando(false));
  }, [idTutor]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const elegibles = sesiones.filter((s) => s.estado === "APROBADA");
  const sesion = elegibles.find((s) => s.id === selectedId);
  const progressPct = (calificacion / 10) * 100;

  const handleCalificacionChange = (val: string) => {
    setCalInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 10) setCalificacion(num);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sesion) return;

    setSaving(true);
    setSaveError(null);

    try {
      await registrarSeguimiento(
        sesion.id,
        asistio,
        observaciones,
        calificacion,
      );

      setObservaciones("");
      setCalificacion(7.0);
      setCalInput("7.0");
      setAsistio(true);

      cargar();
      setSelectedId(null);
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar el seguimiento.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (saving) return;
    setObservaciones("");
    setCalificacion(7.0);
    setCalInput("7.0");
    setAsistio(true);
    setSaveError(null);
    setSelectedId(null);
  };

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
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Cabecera con título y fecha actual */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Documenta la asistencia y el progreso académico de cada estudiante
            </h2>
          </div>
        </div>
      </div>

      {/* Condicional: sin sesiones elegibles o grid con lista + formulario */}
      {elegibles.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-5 py-16 text-center shadow-sm">
          <CheckCircle2 size={32} className="mx-auto mb-3 text-brand-blue" />
          <p className="text-foreground" style={{ fontSize: "1rem" }}>
            Sin sesiones pendientes de cierre
          </p>
          <p
            className="text-muted-foreground mt-1"
            style={{ fontSize: "0.82rem" }}
          >
            Todas las sesiones aprobadas han sido completadas
          </p>
        </div>
      ) : (
        // 👇 AJUSTE OPCIONAL: Cambié lg:grid-cols-6 a proporciones [1fr_2fr] para darle
        // un poco más de ancho a la lista de la izquierda si lo necesitas.
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
          {/* Columna izquierda: Lista de sesiones pendientes */}
          <div className="space-y-2">
            <p
              className="text-muted-foreground px-1"
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Sesiones pendientes de cierre
            </p>

            {elegibles.map((s) => {
              const isSelected = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedId(s.id);
                    setShowRulesNotice(true);
                  }}
                  className="w-full rounded-xl border p-4 text-left transition-all hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{
                    background: isSelected ? "var(--card)" : "transparent",
                    borderColor: isSelected
                      ? "var(--brand-blue)"
                      : "var(--border)",
                    boxShadow: isSelected
                      ? "0 0 0 1px var(--brand-blue)"
                      : "none",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
                      style={{
                        background: isSelected
                          ? "var(--brand-blue-dark)"
                          : "var(--muted)",
                        color: isSelected ? "#fff" : "var(--muted-foreground)",
                        fontSize: "0.7rem",
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
                        className="text-muted-foreground truncate"
                        style={{ fontSize: "0.78rem" }}
                      >
                        {s.asignaturaNombre}
                      </p>

                      {/* 👇 AJUSTE: Añadido pb-1 para que el texto no quede tan pegado al fondo de la tarjeta */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 pb-1">
                        <span
                          className="rounded-full px-2 py-0.5"
                          style={{
                            fontSize: "0.68rem",
                            color: "#3B82F6",
                            background: "rgba(59,130,246,0.12)",
                          }}
                        >
                          Aprobada
                        </span>
                        <span
                          className="text-muted-foreground"
                          style={{ fontSize: "0.72rem" }}
                        >
                          {/* Aquí ya se imprimirá automáticamente el a.m. o p.m. */}
                          {formatFecha(s.fechaSesion)} -{" "}
                          {formatHora(s.horaInicio)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Columna derecha: Panel del formulario */}
          <div className="min-w-0">
            {sesion && (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div
                  className="border-b border-border px-5 py-5 sm:px-6"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--brand-blue) 10%, transparent), color-mix(in srgb, var(--brand-blue) 2%, transparent))",
                  }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--brand-blue-dark), var(--brand-blue))",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                        }}
                      >
                        {iniciales(sesion.estudianteNombre)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-card-foreground">
                          {sesion.estudianteNombre}
                        </p>
                        <p
                          className="truncate text-muted-foreground"
                          style={{ fontSize: "0.8rem" }}
                        >
                          {sesion.asignaturaNombre}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-muted-foreground"
                            style={{ fontSize: "0.72rem" }}
                          >
                            {formatFecha(sesion.fechaSesion)}
                          </span>
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-muted-foreground"
                            style={{ fontSize: "0.72rem" }}
                          >
                            {/* Aquí también se imprimirá el a.m./p.m. automáticamente */}
                            <Clock size={12} /> {formatHora(sesion.horaInicio)}
                          </span>
                          <span
                            className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground"
                            style={{ fontSize: "0.72rem" }}
                          >
                            #{sesion.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formulario de seguimiento */}
                <form
                  onSubmit={handleSave}
                  className="space-y-5 px-5 py-5 sm:px-6"
                >
                  {saveError && (
                    <div
                      className="rounded-xl px-4 py-3"
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      <p
                        className="text-destructive"
                        style={{ fontSize: "0.85rem" }}
                      >
                        {saveError}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-[0.85fr_1.25fr]">
                    <section className="min-w-0 space-y-4">
                      <label
                        className="flex items-center gap-2 text-card-foreground"
                        style={{ fontSize: "0.9rem", fontWeight: 600 }}
                      >
                        Calificación de progreso{" "}
                        <span className="text-destructive">*</span>
                      </label>

                      <div className="rounded-2xl border border-border bg-input-background px-4 py-3">
                        <div className="flex items-end justify-between gap-3">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            required
                            value={calInput}
                            onChange={(e) =>
                              handleCalificacionChange(e.target.value)
                            }
                            aria-label="Calificación de progreso de 0 a 10"
                            className="w-32 min-w-0 border-0 bg-transparent p-0 font-semibold leading-none text-emerald-500 outline-none focus:ring-0"
                            style={{
                              fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                              fontFamily: "var(--font-mono)",
                            }}
                          />
                          <div className="pb-1 text-right">
                            <p
                              className="font-semibold"
                              style={{
                                fontSize: "0.8rem",
                                color:
                                  calificacion >= 9
                                    ? "#3B82F6"
                                    : calificacion >= 7
                                      ? "#10B981"
                                      : calificacion >= 5
                                        ? "#F59E0B"
                                        : "#EF4444",
                              }}
                            >
                              {calificacion >= 9
                                ? "Excelente"
                                : calificacion >= 7
                                  ? "Bueno"
                                  : calificacion >= 5
                                    ? "Regular"
                                    : "Bajo"}
                            </p>
                            <p
                              className="text-muted-foreground"
                              style={{
                                fontSize: "0.7rem",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              0.0 – 10.0
                            </p>
                          </div>
                        </div>
                      </div>

                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={0.1}
                        value={calificacion}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setCalificacion(value);
                          setCalInput(value.toFixed(1));
                        }}
                        aria-label="Ajustar calificación de progreso"
                        className="h-2 w-full cursor-pointer"
                        style={{
                          accentColor:
                            calificacion >= 9
                              ? "#3B82F6"
                              : calificacion >= 7
                                ? "#10B981"
                                : calificacion >= 5
                                  ? "#F59E0B"
                                  : "#EF4444",
                        }}
                      />

                      <div className="mt-5 space-y-2">
                        <p
                          className="flex flex-wrap items-center gap-1.5 text-card-foreground"
                          style={{ fontSize: "0.8rem", fontWeight: 600 }}
                        >
                          Asistencia <span className="text-destructive">*</span>
                        </p>

                        <div className="grid grid-cols-2 rounded-xl border border-border bg-input-background p-1">
                          <button
                            type="button"
                            onClick={() => setAsistio(true)}
                            aria-pressed={asistio}
                            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition-colors"
                            style={{
                              background: asistio
                                ? "rgba(16,185,129,0.14)"
                                : "transparent",
                              color: asistio
                                ? "#10B981"
                                : "var(--muted-foreground)",
                              fontSize: "0.78rem",
                              fontWeight: asistio ? 600 : 400,
                            }}
                          >
                            <CheckCircle2 size={14} />
                            Asistió
                          </button>

                          <button
                            type="button"
                            onClick={() => setAsistio(false)}
                            aria-pressed={!asistio}
                            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition-colors"
                            style={{
                              background: !asistio
                                ? "rgba(239,68,68,0.12)"
                                : "transparent",
                              color: !asistio
                                ? "#EF4444"
                                : "var(--muted-foreground)",
                              fontSize: "0.78rem",
                              fontWeight: !asistio ? 600 : 400,
                            }}
                          >
                            <Circle size={14} />
                            No asistió
                          </button>
                        </div>
                      </div>
                    </section>

                    <section className="flex min-w-0 flex-col space-y-2">
                      <label
                        htmlFor="observaciones-seguimiento"
                        className="flex items-center gap-2 text-card-foreground"
                        style={{ fontSize: "0.9rem", fontWeight: 600 }}
                      >
                        Observaciones académicas
                      </label>
                      <textarea
                        id="observaciones-seguimiento"
                        value={observaciones}
                        onChange={(e) =>
                          setObservaciones(e.target.value.slice(0, 1000))
                        }
                        maxLength={1000}
                        rows={10}
                        placeholder="Describe el desempeño del estudiante, temas abordados, avances y áreas de mejora..."
                        className="min-h-[220px] w-full flex-1 resize-none rounded-xl border border-border-strong bg-input-background px-4 py-3 text-card-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-[#118ab2] focus:ring-2 focus:ring-[#118ab2]/30"
                      />
                      <p
                        className="text-right text-muted-foreground"
                        style={{ fontSize: "0.73rem" }}
                      >
                        {observaciones.length}/1000
                      </p>
                    </section>
                  </div>

                  <div className="flex justify-end items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/15 active:bg-red-500/25"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-white transition-colors"
                      style={{
                        fontSize: "0.875rem",
                        background: "#118ab2",
                      }}
                    >
                      Guardar información
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ventana emergente con las reglas de seguimiento */}
      {showRulesNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
          onClick={() => setShowRulesNotice(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reglas-seguimiento-titulo"
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 pr-14 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Cerrar aviso informativo"
              onClick={() => setShowRulesNotice(false)}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X size={18} />
            </button>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                <Info size={18} />
              </div>
              <div>
                <h3
                  id="reglas-seguimiento-titulo"
                  className="text-base font-semibold text-card-foreground"
                >
                  Reglas de seguimiento
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Solo puedes registrar seguimiento en sesiones{" "}
                  <strong className="text-brand-blue-text">APROBADAS</strong>.
                  Al guardar, el estado cambia a{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    COMPLETADA
                  </strong>{" "}
                  y las observaciones se envían al estudiante.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
