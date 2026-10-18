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
  historialTutor,
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
          <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"><CheckCircle2 size={14} className="text-brand-blue" /> Cierre de sesiones</div><h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-2xl">Documenta la asistencia y el progreso académico de cada estudiante</h2></div>
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
                        <p className="truncate text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                          {sesion.asignaturaNombre}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-muted-foreground" style={{ fontSize: "0.72rem" }}>
                            <Clock size={12} /> {formatFecha(sesion.fechaSesion)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-muted-foreground" style={{ fontSize: "0.72rem" }}>
                            <Clock size={12} /> {formatHora(sesion.horaInicio)}
                          </span>
                          <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground" style={{ fontSize: "0.72rem" }}>
                            #{sesion.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 sm:min-w-[220px]">
                      <p className="mb-1.5 flex items-center gap-1.5 text-card-foreground" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                        <User size={13} /> Asistencia <span className="text-destructive">*</span>
                        <span className="font-normal text-muted-foreground">· Campo obligatorio</span>
                      </p>
                      <div className="grid grid-cols-2 rounded-xl border border-border bg-input-background p-1">
                        <button
                          type="button"
                          onClick={() => setAsistio(true)}
                          aria-pressed={asistio}
                          className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition-colors"
                          style={{
                            background: asistio ? "rgba(16,185,129,0.14)" : "transparent",
                            color: asistio ? "#10B981" : "var(--muted-foreground)",
                            fontSize: "0.78rem",
                            fontWeight: asistio ? 600 : 400,
                          }}
                        >
                          <CheckCircle2 size={14} /> Asistió
                        </button>
                        <button
                          type="button"
                          onClick={() => setAsistio(false)}
                          aria-pressed={!asistio}
                          className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition-colors"
                          style={{
                            background: !asistio ? "var(--secondary)" : "transparent",
                            color: !asistio ? "var(--foreground)" : "var(--muted-foreground)",
                            fontSize: "0.78rem",
                            fontWeight: !asistio ? 600 : 400,
                          }}
                        >
                          <Circle size={14} /> No asistió
                        </button>
                      </div>
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

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-[0.85fr_1.25fr]">
                    {/* Calificación */}
                    <section className="min-w-0 space-y-4">
                      <label className="flex items-center gap-2 text-card-foreground" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                        <TrendingUp size={14} className="text-brand-blue" />
                        Calificación de progreso <span className="text-destructive">*</span>
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
                            onChange={(e) => handleCalificacionChange(e.target.value)}
                            aria-label="Calificación de progreso de 0 a 10"
                            className="w-32 min-w-0 border-0 bg-transparent p-0 font-semibold leading-none text-emerald-500 outline-none focus:ring-0"
                            style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontFamily: "var(--font-mono)" }}
                          />
                          <div className="pb-1 text-right">
                            <p className="font-semibold" style={{ fontSize: "0.8rem", color: calificacion >= 9 ? "#3B82F6" : calificacion >= 7 ? "#10B981" : calificacion >= 5 ? "#F59E0B" : "#EF4444" }}>
                              {calificacion >= 9 ? "Excelente" : calificacion >= 7 ? "Bueno" : calificacion >= 5 ? "Regular" : "Bajo"}
                            </p>
                            <p className="text-muted-foreground" style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)" }}>0.0 – 10.0</p>
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
                        className="h-2 w-full cursor-pointer accent-emerald-500"
                        style={{ accentColor: calificacion >= 7 ? "#10B981" : calificacion >= 5 ? "#F59E0B" : "#EF4444" }}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Bajo", range: "0 – 4.9", color: "#EF4444", min: 0, max: 4.9 },
                          { label: "Regular", range: "5 – 6.9", color: "#F59E0B", min: 5, max: 6.9 },
                          { label: "Bueno", range: "7 – 8.9", color: "#10B981", min: 7, max: 8.9 },
                          { label: "Excelente", range: "9 – 10", color: "#3B82F6", min: 9, max: 10 },
                        ].map((t) => {
                          const activo = calificacion >= t.min && calificacion <= t.max;
                          return (
                            <div
                              key={t.label}
                              className="rounded-xl border p-2.5 transition-colors"
                              style={{
                                borderColor: activo ? t.color : "var(--border)",
                                background: activo ? `${t.color}18` : "var(--input-background)",
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: t.color }} />
                                <span className="text-card-foreground" style={{ fontSize: "0.78rem", fontWeight: 600 }}>{t.label}</span>
                              </div>
                              <p className="mt-1 pl-4 text-muted-foreground" style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)" }}>{t.range}</p>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Observaciones académicas */}
                    <section className="flex min-w-0 flex-col space-y-2">
                      <label htmlFor="observaciones-seguimiento" className="flex items-center gap-2 text-card-foreground" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                        <BookOpen size={14} className="text-brand-blue" />
                        Observaciones académicas
                      </label>
                      <textarea
                        id="observaciones-seguimiento"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value.slice(0, 1000))}
                        maxLength={1000}
                        rows={10}
                        placeholder="Describe el desempeño del estudiante, temas abordados, avances y áreas de mejora..."
                        className="min-h-[220px] w-full flex-1 resize-none rounded-xl border border-border-strong bg-input-background px-4 py-3 text-card-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
                      />
                      <p className="text-right text-muted-foreground" style={{ fontSize: "0.73rem" }}>
                        {observaciones.length}/1000
                      </p>
                    </section>
                  </div>

                  <div className="border-t border-border pt-4">
                    <button
                      type="submit"
                      disabled={saving || !calInput.trim() || Number(calInput) < 0 || Number(calInput) > 10 || !Number.isFinite(Number(calInput))}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      style={{ fontSize: "0.9rem" }}
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      {saving ? "Guardando seguimiento..." : "Guardar seguimiento"}
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
