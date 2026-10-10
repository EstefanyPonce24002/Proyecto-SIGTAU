import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  Circle,
  User,
  BookOpen,
  TrendingUp,
  Clock,
  Info,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  pendientesTutor,
  registrarSeguimiento,
  type Sesion,
} from "../lib/sesiones";
import { ApiError } from "../lib/api";

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

export function SeguimientoAcademico({ idTutor }: Props) {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [asistio, setAsistio] = useState(true);
  const [observaciones, setObservaciones] = useState("");
  const [calificacion, setCalificacion] = useState(7.0);
  const [calInput, setCalInput] = useState("7.0");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setLoadError(null);
    pendientesTutor(idTutor)
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
      cargar(); // refresca; la sesión guardada pasa a COMPLETADA y sale de "elegibles"
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
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"><CheckCircle2 size={14} className="text-brand-blue" /> Cierre de sesiones</div><h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Registrar seguimiento</h2><p className="mt-1 text-sm text-muted-foreground">Documenta la asistencia y el progreso académico de cada estudiante.</p></div>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
          <Clock size={14} className="text-muted-foreground" />
          <span
            className="text-muted-foreground"
            style={{ fontSize: "0.82rem" }}
          >
            {new Date().toLocaleDateString("es-SV")}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-brand-blue/25 bg-brand-blue/5 px-4 py-3">
        <Info size={14} className="mt-0.5 shrink-0 text-brand-blue" />
        <p
          className="text-text-secondary"
          style={{ fontSize: "0.78rem", lineHeight: 1.5 }}
        >
          Solo puedes registrar seguimiento en sesiones{" "}
          <strong className="text-brand-blue-text">APROBADAS</strong>. Al
          guardar, el estado cambia a{" "}
          <strong className="text-emerald-600 dark:text-emerald-400">
            COMPLETADA
          </strong>{" "}
          y las observaciones se envían al estudiante.
        </p>
      </div>

      {elegibles.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-5 py-16 text-center shadow-sm">
          <CheckCircle2 size={32} className="mx-auto mb-3 text-brand-blue" />
          <p className="text-foreground" style={{ fontSize: "0.95rem" }}>
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
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Lista de sesiones */}
          <div className="lg:col-span-2 space-y-2">
            <p
              className="text-muted-foreground px-1"
              style={{
                fontSize: "0.72rem",
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
                  onClick={() => setSelectedId(s.id)}
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
                      <div className="flex items-center gap-2 mt-1.5">
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
                          {formatFecha(s.fechaSesion)} ·{" "}
                          {formatHora(s.horaInicio)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Panel del formulario */}
          <div className="lg:col-span-3">
            {sesion && (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div
                  className="border-b border-border px-5 py-5 sm:px-6"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--brand-blue) 8%, transparent), color-mix(in srgb, var(--brand-blue) 2%, transparent))",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--brand-blue-dark), var(--brand-blue))",
                        fontSize: "0.85rem",
                      }}
                    >
                      {iniciales(sesion.estudianteNombre)}
                    </div>
                    <div>
                      <p className="text-card-foreground">
                        {sesion.estudianteNombre}
                      </p>
                      <p
                        className="text-muted-foreground"
                        style={{ fontSize: "0.8rem" }}
                      >
                        {sesion.asignaturaNombre}
                      </p>
                      <p
                        className="text-muted-foreground"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {formatFecha(sesion.fechaSesion)} ·{" "}
                        {formatHora(sesion.horaInicio)} · #{sesion.id}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-5 px-5 py-5 sm:px-6">
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

                  {/* Asistencia */}
                  <div className="flex flex-col gap-3 rounded-xl border border-border bg-input-background p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <User size={16} className="text-muted-foreground" />
                      <div>
                        <p
                          className="text-card-foreground"
                          style={{ fontSize: "0.875rem" }}
                        >
                          Asistencia <span style={{ color: "#EF4444" }}>*</span>
                        </p>
                        <p
                          className="text-muted-foreground"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Campo obligatorio
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAsistio(!asistio)}
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all"
                      style={{
                        background: asistio
                          ? "rgba(16,185,129,0.12)"
                          : "var(--secondary)",
                        color: asistio ? "#10B981" : "var(--muted-foreground)",
                      }}
                    >
                      {asistio ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Circle size={16} />
                      )}
                      <span style={{ fontSize: "0.82rem" }}>
                        {asistio ? "Asistió" : "No asistió"}
                      </span>
                    </button>
                  </div>

                  {/* Observaciones */}
                  <div className="space-y-1.5">
                    <label
                      className="flex items-center gap-2 text-card-foreground"
                      style={{ fontSize: "0.875rem" }}
                    >
                      <BookOpen size={14} className="text-brand-blue" />{" "}
                      Observaciones académicas
                    </label>
                    <textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      rows={4}
                      placeholder="Describe el desempeño del estudiante, temas abordados, avances y áreas de mejora..."
                      className="w-full rounded-xl border border-border-strong bg-input-background text-card-foreground px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-ring resize-none placeholder:text-muted-foreground transition-all"
                    />
                    <p
                      className="text-right text-muted-foreground"
                      style={{ fontSize: "0.73rem" }}
                    >
                      {observaciones.length}/1000
                    </p>
                  </div>

                  {/* Calificación */}
                  <div className="space-y-3">
                    <label
                      className="flex items-center gap-2 text-card-foreground"
                      style={{ fontSize: "0.875rem" }}
                    >
                      <TrendingUp size={14} className="text-brand-blue" />
                      Calificación de progreso{" "}
                      <span style={{ color: "#EF4444" }}>*</span>
                      <span
                        className="text-muted-foreground"
                        style={{ fontSize: "0.75rem" }}
                      >
                        (0.0 – 10.0)
                      </span>
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${progressPct}%`,
                            background:
                              calificacion >= 7
                                ? "#10B981"
                                : calificacion >= 5
                                  ? "#F59E0B"
                                  : "#EF4444",
                          }}
                        />
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={calInput}
                        onChange={(e) =>
                          handleCalificacionChange(e.target.value)
                        }
                        className="w-20 rounded-xl border border-border-strong bg-input-background text-center text-card-foreground px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                        style={{
                          fontSize: "0.95rem",
                          fontFamily: "var(--font-mono)",
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      {[
                        { label: "Bajo", range: "0–4.9", color: "#EF4444" },
                        { label: "Regular", range: "5–6.9", color: "#F59E0B" },
                        { label: "Bueno", range: "7–8.9", color: "#10B981" },
                        { label: "Excelente", range: "9–10", color: "#1E3A8A" },
                      ].map((t) => (
                        <div
                          key={t.label}
                          className="flex-1 rounded-lg p-2 text-center border border-border bg-input-background"
                        >
                          <div
                            className="w-2 h-2 rounded-full mx-auto mb-1"
                            style={{ background: t.color }}
                          />
                          <p
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--muted-foreground)",
                            }}
                          >
                            {t.label}
                          </p>
                          <p
                            style={{
                              fontSize: "0.65rem",
                              color: "var(--muted-foreground)",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {t.range}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-primary-foreground transition-all hover active disabled focus-visible focus-visible focus-visible focus-visible"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {saving && <Loader2 size={16} className="animate-spin" />}
                      {saving ? "Guardando..." : "Guardar seguimiento"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
