// IMPORTACIONES
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  GraduationCap,
  Loader2,
  Upload,
  UserRound,
  X,
} from "lucide-react";

// Componentes de UI reutilizables (Calendario, Popover, Diálogo)
import { Calendar } from "../../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

// Funciones y tipos de la capa de datos (API)
import {
  listarAsignaturas,
  listarTutoresPorAsignatura,
  listarHorariosDisponibles,
  DIA_LABEL,
  formatHora,
  type Asignatura,
  type TutorOption,
  type HorarioOption,
} from "../lib/catalogo";
import { solicitarTutoria } from "../lib/sesiones";
import { ApiError } from "../lib/api";
import { QuickAccessNav, type QuickAccessTab } from "./QuickAccessNav";

// ==========================================
// TIPOS Y CONSTANTES
// ==========================================
interface Props {
  idEstudiante: number;
  onSuccess: () => void;
  onCancel: () => void;
  onNavigate: (tab: QuickAccessTab) => void;
}

// Mapeo de los días de la semana a números (para el calendario de JS)
const DAY_NUMBER: Record<HorarioOption["diaSemana"], number> = {
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
};

// FUNCIONES AUXILIARES DE FECHAS
// Convierte un objeto Date a string "YYYY-MM-DD"
function fechaLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Convierte un string "YYYY-MM-DD" a un objeto Date
function fechaDesdeISO(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Formatea una fecha larga (ej: "lunes, 15 de mayo de 2026")
function fechaLarga(value: string): string {
  const date = fechaDesdeISO(value);
  return date
    ? date.toLocaleDateString("es-SV", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
}

// Formatea una fecha corta (ej: "15/05/2026")
function fechaCorta(value: string): string {
  const date = fechaDesdeISO(value);
  return date ? date.toLocaleDateString("es-SV") : "";
}

// ==========================================
// COMPONENTES AUXILIARES (SUBCOMPONENTES)
// ==========================================// Indicador visual de los pasos del formulario (1, 2, 3)
function StepIndicator({
  step,
  complete,
  label,
}: {
  step: number;
  complete: boolean;
  label: string;
}) {
  const current = !complete && step === 1;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        style={{
          background: complete
            ? "#10B981"
            : current
              ? "#118AB2"
              : "var(--secondary)",
          color: complete || current ? "#fff" : "var(--muted-foreground)",
        }}
      >
        {complete ? <Check size={15} /> : step}
      </div>
      <span className="hidden truncate text-xs text-muted-foreground sm:block">
        {label}
      </span>
    </div>
  );
}

// Cabecera de cada sección del formulario (icono + título + subtítulo)
function CardHeader({
  step,
  icon: Icon,
  title,
  subtitle,
}: {
  step: number;
  icon: typeof GraduationCap;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ background: "#118AB2" }}
      >
        <Icon size={18} />
      </div>
      <div>
        <h3 className="text-foreground" style={{ fontSize: "0.98rem" }}>
          {step}. {title}
        </h3>
        <p
          className="mt-1 text-muted-foreground"
          style={{ fontSize: "0.8rem" }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL: SolicitudTutoria
// ==========================================
export function SolicitudTutoria({
  idEstudiante,
  onSuccess,
  onCancel,
  onNavigate,
}: Props) {
  void onCancel; // Se ignora temporalmente esta prop

  // --- SECCIÓN 1: ESTADOS DEL COMPONENTE ---
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [tutoresDisponibles, setTutoresDisponibles] = useState<TutorOption[]>(
    [],
  );
  const [horariosDisponibles, setHorariosDisponibles] = useState<
    HorarioOption[]
  >([]);
  const [cargandoAsignaturas, setCargandoAsignaturas] = useState(true);
  const [cargandoTutores, setCargandoTutores] = useState(false);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [idAsignatura, setIdAsignatura] = useState<number | "">("");
  const [idTutor, setIdTutor] = useState<number | "">("");
  const [idHorario, setIdHorario] = useState<number | "">("");
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- SECCIÓN 2: EFECTOS ---
  // Carga inicial de asignaturas al montar el componente
  useEffect(() => {
    listarAsignaturas()
      .then(setAsignaturas)
      .catch(() => setSubmitError("No se pudieron cargar las asignaturas."))
      .finally(() => setCargandoAsignaturas(false));
  }, []);

  // --- SECCIÓN 3: MANEJADORES DE EVENTOS (FORMULARIO) ---
  // Al cambiar la asignatura, se resetean los campos dependientes y se cargan los tutores
  const handleAsignaturaChange = (value: string) => {
    const id = value ? Number(value) : "";
    setIdAsignatura(id);
    setIdTutor("");
    setIdHorario("");
    setFecha("");
    setTutoresDisponibles([]);
    setHorariosDisponibles([]);
    if (id === "") return;
    setCargandoTutores(true);
    listarTutoresPorAsignatura(id)
      .then(setTutoresDisponibles)
      .catch(() => setSubmitError("No se pudieron cargar los tutores."))
      .finally(() => setCargandoTutores(false));
  };

  // Al cambiar el tutor, se resetean los horarios y se cargan los disponibles
  const handleTutorChange = (value: string) => {
    const id = value ? Number(value) : "";
    setIdTutor(id);
    setIdHorario("");
    setFecha("");
    setHorariosDisponibles([]);
    if (id === "") return;
    setCargandoHorarios(true);
    listarHorariosDisponibles(id)
      .then(setHorariosDisponibles)
      .catch(() => setSubmitError("No se pudieron cargar los horarios."))
      .finally(() => setCargandoHorarios(false));
  };

  // Al cambiar la fecha, se resetea el horario seleccionado
  const handleFechaChange = (date: Date | undefined) => {
    setFecha(date ? fechaLocal(date) : "");
    setIdHorario("");
    setErrors((current) => ({ ...current, fecha: "", horario: "" }));
    setCalendarOpen(false);
  };

  // --- SECCIÓN 4: MANEJO DE ARCHIVOS (DRAG & DROP) ---
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const nuevos = Array.from(event.dataTransfer.files).filter(
      (file) => file.size <= 25 * 1024 * 1024,
    );
    setArchivos((prev) => [...prev, ...nuevos].slice(0, 5));
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const nuevos = Array.from(event.target.files).filter(
      (file) => file.size <= 25 * 1024 * 1024,
    );
    setArchivos((prev) => [...prev, ...nuevos].slice(0, 5));
  };

  const removeFile = (index: number) =>
    setArchivos((prev) => prev.filter((_, current) => current !== index));

  // --- SECCIÓN 5: MEMORIZACIÓN DE DATOS CALCULADOS ---
  // Días que atiende el tutor (ej: "lunes, miércoles y viernes")
  const diasTutor = useMemo(
    () =>
      Array.from(
        new Set(
          horariosDisponibles
            .filter((h) => h.disponible)
            .map((h) => h.diaSemana),
        ),
      )
        .map((day) => DIA_LABEL[day].toLowerCase())
        .join(", ")
        .replace(/, ([^,]*)$/, " y $1"),
    [horariosDisponibles],
  );

  // Horarios que coinciden con la fecha seleccionada
  const horariosFecha = useMemo(() => {
    const selectedDate = fechaDesdeISO(fecha);
    return selectedDate
      ? horariosDisponibles.filter(
          (h) =>
            h.disponible && DAY_NUMBER[h.diaSemana] === selectedDate.getDay(),
        )
      : [];
  }, [fecha, horariosDisponibles]);

  // Objetos seleccionados (para mostrar en la confirmación)
  const horarioSeleccionado = horariosDisponibles.find(
    (h) => h.id === idHorario,
  );
  const asignaturaSeleccionada = asignaturas.find((a) => a.id === idAsignatura);
  const tutorSeleccionado = tutoresDisponibles.find((t) => t.id === idTutor);

  // Fecha de hoy y días disponibles para el calendario
  const hoy = fechaLocal(new Date());
  const diasDisponibles = new Set(
    horariosDisponibles
      .filter((h) => h.disponible)
      .map((h) => DAY_NUMBER[h.diaSemana]),
  );

  // Estado de completitud de cada paso (para el StepIndicator)
  const paso1Completo = Boolean(idAsignatura && idTutor);
  const paso2Completo = Boolean(fecha && idHorario);
  const paso3Completo = confirmationOpen || solicitudEnviada;

  // --- SECCIÓN 6: VALIDACIÓN Y ENVÍO ---
  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!idAsignatura) nextErrors.asignatura = "Selecciona una asignatura";
    if (!idTutor) nextErrors.tutor = "Selecciona un tutor";
    if (!fecha) nextErrors.fecha = "Selecciona una fecha";
    if (!idHorario) nextErrors.horario = "Selecciona un horario";
    if (!descripcion.trim())
      nextErrors.descripcion = "Describe tus dificultades";
    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSubmitError(null);
    setConfirmationOpen(true); // Abre el diálogo de confirmación
  };

  const confirmSolicitud = async () => {
    if (!horarioSeleccionado || !idTutor || !idAsignatura) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await solicitarTutoria({
        idEstudiante,
        idTutor,
        idAsignatura,
        idHorario: horarioSeleccionado.id,
        fecha,
        horaInicio: horarioSeleccionado.horaInicio,
        horaFin: horarioSeleccionado.horaFin,
      });
      setSolicitudEnviada(true);
      setConfirmationOpen(false);
      onSuccess();
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "No se pudo enviar la solicitud.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --- SECCIÓN 7: RENDERIZADO (JSX) ---
  return (
    <div className="w-full max-w-none">
      {/* Barra de navegación rápida */}
      <QuickAccessNav activeTab="solicitud" onNavigate={onNavigate} />

      <div className="mr-auto w-full max-w-[850px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* ── CABECERA DEL FORMULARIO (con indicador de pasos) ── */}
        <header className="border-b border-[rgba(31, 41, 55)] bg-rgba(24, 42, 58) px-5 pb-6 pt-7 text-foreground sm:px-7">
          <div>
            <h1 className="text-foreground" style={{ fontSize: "1.2rem" }}>
              Nueva solicitud
            </h1>
            <p
              className="mt-1 text-muted-foreground"
              style={{ fontSize: "0.82rem" }}
            >
              Completa los pasos para agendar tu próxima tutoría
            </p>
          </div>
          <div
            className="mt-7 flex items-center gap-2 sm:gap-3"
            aria-label="Progreso de la solicitud"
          >
            <StepIndicator
              step={1}
              complete={paso1Completo}
              label="Materia y tutor"
            />
            {/* Línea más gruesa (2px) y color gris oscuro */}
            <div className="h-0.5 flex-1 bg-slate-300" />
            <StepIndicator
              step={2}
              complete={paso2Completo}
              label="Fecha y hora"
            />
            {/* Línea más gruesa (2px) y color gris oscuro */}
            <div className="h-0.5 flex-1 bg-slate-300" />
            <StepIndicator
              step={3}
              complete={paso3Completo}
              label="Confirmar y enviar"
            />
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
          {/* Alerta de error general */}
          {submitError && !confirmationOpen && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive"
              style={{ fontSize: "0.85rem" }}
            >
              {submitError}
            </div>
          )}

          {/* ── PASO 1: ASIGNATURA Y TUTOR ── */}
          <section className="rounded-2xl border border-border p-5">
            <CardHeader
              step={1}
              icon={UserRound}
              title="Asignatura y tutor"
              subtitle="Selecciona la asignatura y el tutor"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Selector de Asignatura */}
              <div className="space-y-1.5">
                <label
                  htmlFor="asignatura"
                  className="text-card-foreground"
                  style={{ fontSize: "0.875rem" }}
                >
                  Asignatura <span className="text-brand-teal">*</span>
                </label>
                <div className="relative">
                  <select
                    id="asignatura"
                    aria-label="Selecciona una asignatura"
                    value={idAsignatura}
                    onChange={(e) => handleAsignaturaChange(e.target.value)}
                    disabled={cargandoAsignaturas}
                    className="w-full appearance-none rounded-xl border border-[#118ab2] bg-input-background px-4 py-2.5 pr-10 text-card-foreground outline-none transition-all focus:ring-2 disabled:opacity-50"
                    style={
                      {
                        fontSize: "0.88rem",
                        "--tw-ring-color": "#118ab2",
                      } as React.CSSProperties
                    }
                  >
                    <option value="">
                      {cargandoAsignaturas
                        ? "Cargando..."
                        : "Selecciona una asignatura"}
                    </option>
                    {asignaturas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
                {errors.asignatura && (
                  <p
                    role="alert"
                    className="text-destructive"
                    style={{ fontSize: "0.78rem" }}
                  >
                    {errors.asignatura}
                  </p>
                )}
              </div>

              {/* Selector de Tutor */}
              <div className="space-y-1.5">
                <label
                  htmlFor="tutor"
                  className="text-card-foreground"
                  style={{ fontSize: "0.875rem" }}
                >
                  Tutor <span className="text-brand-teal">*</span>
                </label>
                <div className="relative">
                  <select
                    id="tutor"
                    aria-label="Selecciona un tutor"
                    value={idTutor}
                    onChange={(e) => handleTutorChange(e.target.value)}
                    disabled={!idAsignatura || cargandoTutores}
                    className="w-full appearance-none rounded-xl border border-[#118ab2] bg-input-background px-4 py-2.5 pr-10 text-card-foreground outline-none transition-all focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                    style={
                      {
                        fontSize: "0.88rem",
                        "--tw-ring-color": "#118ab2",
                      } as React.CSSProperties
                    }
                  >
                    <option value="">
                      {!idAsignatura
                        ? "Primero selecciona una asignatura"
                        : cargandoTutores
                          ? "Cargando..."
                          : "Selecciona un tutor"}
                    </option>
                    {tutoresDisponibles.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombreCompleto} ·{" "}
                        {t.especialidad ?? "Tutor académico"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
                {errors.tutor && (
                  <p
                    role="alert"
                    className="text-destructive"
                    style={{ fontSize: "0.78rem" }}
                  >
                    {errors.tutor}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ── PASO 2: FECHA Y HORA ── */}
          <section className="rounded-2xl border border-border p-5">
            <CardHeader
              step={2}
              icon={CalendarDays}
              title="Fecha y hora"
              subtitle="Selecciona el horario de tu conveniencia"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              
              {/* Selector de Fecha (Calendario) */}
              <div className="space-y-1.5">
                <label
                  className="text-card-foreground"
                  style={{ fontSize: "0.875rem" }}
                >
                  Fecha <span className="text-brand-teal">*</span>
                </label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={!idTutor || cargandoHorarios}
                      aria-label="Selecciona una fecha"
                      className="flex w-full items-center justify-between rounded-xl border border-[#118ab2] bg-input-background px-4 py-2.5 text-left text-card-foreground outline-none transition-all hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                      style={
                        { fontSize: "0.88rem" }}
                    >
                      <span
                        className={
                          fecha ? "text-foreground" : "text-muted-foreground"
                        }
                      >
                        {fecha ? fechaLarga(fecha) : "Selecciona una fecha"}
                      </span>
                      <CalendarDays
                        size={16}
                        className="text-muted-foreground"
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaDesdeISO(fecha)}
                      onSelect={handleFechaChange}
                      disabled={(date) =>
                        fechaLocal(date) < hoy ||
                        !diasDisponibles.has(date.getDay())
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.fecha && (
                  <p
                    role="alert"
                    className="text-destructive"
                    style={{ fontSize: "0.78rem" }}
                  >
                    {errors.fecha}
                  </p>
                )}
                {idTutor && !cargandoHorarios && (
                  <p
                    className="text-muted-foreground"
                    style={{ fontSize: "0.75rem" }}
                  >
                    Días que atiende este tutor: {diasTutor || "ninguno"}
                  </p>
                )}
              </div>

              {/* Selector de Horario */}
              <div className="space-y-1.5">
                <label
                  htmlFor="horario"
                  className="text-card-foreground"
                  style={{ fontSize: "0.875rem" }}
                >
                  Horario <span className="text-brand-teal">*</span>
                </label>
                <div className="relative">
                  <select
                    id="horario"
                    aria-label="Selecciona un horario"
                    value={idHorario}
                    onChange={(e) =>
                      setIdHorario(e.target.value ? Number(e.target.value) : "")
                    }
                    disabled={
                      !fecha || cargandoHorarios || horariosFecha.length === 0
                    }
                    className="w-full appearance-none rounded-xl border border-[#118ab2] bg-input-background px-4 py-2.5 pr-10 text-card-foreground outline-none transition-all focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                    style={
                      {
                        fontSize: "0.88rem",
                        "--tw-ring-color": "#118ab2",
                      } as React.CSSProperties
                    }
                  >
                    <option value="">
                      {!fecha
                        ? "Primero selecciona una fecha"
                        : cargandoHorarios
                          ? "Cargando..."
                          : horariosFecha.length === 0
                            ? "No hay bloques disponibles"
                            : "Selecciona un horario"}
                    </option>
                    {horariosFecha.map((h) => (
                      <option key={h.id} value={h.id}>
                        {DIA_LABEL[h.diaSemana]} {formatHora(h.horaInicio)} –{" "}
                        {formatHora(h.horaFin)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
                {errors.horario && (
                  <p
                    role="alert"
                    className="text-destructive"
                    style={{ fontSize: "0.78rem" }}
                  >
                    {errors.horario}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ── PASO 3: DETALLE Y ARCHIVOS ── */}
          <section className="rounded-2xl border border-border p-5">
            <CardHeader
              step={3}
              icon={FileText}
              title="Detalle de la solicitud"
              subtitle="Cuéntanos cómo podemos ayudarte"
            />
            <div className="space-y-5">
              {/* Descripción */}
              <div className="space-y-1.5">
                <label
                  htmlFor="descripcion"
                  className="text-card-foreground"
                  style={{ fontSize: "0.875rem" }}
                >
                  Descripción de dificultades{" "}
                  <span className="text-brand-teal">*</span>
                </label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  maxLength={500}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={4}
                  placeholder="Describe con detalle los temas o conceptos con los que necesitas apoyo..."
                  className="w-full resize-none rounded-xl border border-[#118ab2] bg-input-background px-4 py-3 text-card-foreground outline-none transition-all placeholder:text-muted-foreground focus:ring-2"
                  style={
                    {
                      fontSize: "0.88rem",
                      "--tw-ring-color": "#118ab2",
                    } as React.CSSProperties
                  }
                />
                <div className="flex justify-between gap-3">
                  <span>
                    {errors.descripcion && (
                      <span
                        role="alert"
                        className="text-destructive"
                        style={{ fontSize: "0.78rem" }}
                      >
                        {errors.descripcion}
                      </span>
                    )}
                  </span>
                  <span
                    className="text-muted-foreground"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {descripcion.length}/500
                  </span>
                </div>
              </div>

              {/* Zona de carga de archivos (Drag & Drop) */}
              <div className="space-y-1.5">
                <label
                  className="text-card-foreground"
                  style={{ fontSize: "0.875rem" }}
                >
                  Documentos de apoyo{" "}
                  <span
                    className="text-muted-foreground"
                    style={{ fontSize: "0.78rem" }}
                  >
                    (opcional)
                  </span>
                </label>
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      fileInputRef.current?.click();
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 transition-all"
                  style={{
                    borderColor: dragging ? "#118ab2" : "var(--border)",
                    background: dragging
                      ? "rgba(17,138,178,0.06)"
                      : "var(--input-background)",
                  }}
                >
                  <Upload size={20} className="text-muted-foreground" />
                  <p
                    className="text-center text-muted-foreground"
                    style={{ fontSize: "0.82rem" }}
                  >
                    Arrastra archivos aquí o{" "}
                    <span className="text-brand-teal">haz clic para subir</span>
                  </p>
                  <p
                    className="text-muted-foreground"
                    style={{ fontSize: "0.73rem" }}
                  >
                    PDF, DOCX, XLSX · Máx. 25 MB por archivo
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
                {/* Lista de archivos subidos */}
                {archivos.length > 0 && (
                  <div className="space-y-1.5">
                    {archivos.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2"
                      >
                        <FileText
                          size={14}
                          className="shrink-0 text-muted-foreground"
                        />
                        <span
                          className="min-w-0 flex-1 truncate text-card-foreground"
                          style={{ fontSize: "0.82rem" }}
                        >
                          {file.name}
                        </span>
                        <span
                          className="shrink-0 text-muted-foreground"
                          style={{ fontSize: "0.73rem" }}
                        >
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          type="button"
                          aria-label={`Eliminar ${file.name}`}
                          onClick={() => removeFile(index)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Botón de envío del formulario */}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#118AB2] py-3 text-white transition-all hover:opacity-90 active:scale-[0.99]"
            style={{ background: "#118AB2" }}
          >
            Enviar
          </button>
        </form>
      </div>

      {/* ── DIÁLOGO DE CONFIRMACIÓN ── */}
      <Dialog
        open={confirmationOpen}
        onOpenChange={(open) => {
          if (!submitting) {
            setConfirmationOpen(open);
            if (!open) setSubmitError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de tu solicitud</DialogTitle>
            <DialogDescription>
              Revisa los datos antes de enviarlos.
            </DialogDescription>
          </DialogHeader>
          {/* Resumen de los datos seleccionados */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Asignatura</span>
              <strong className="text-right text-foreground">
                {asignaturaSeleccionada?.nombre}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Tutor</span>
              <strong className="text-right text-foreground">
                {tutorSeleccionado?.nombreCompleto}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Fecha</span>
              <strong className="text-right capitalize text-foreground">
                {fechaCorta(fecha)}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Horario</span>
              <strong className="text-right text-foreground">
                {horarioSeleccionado &&
                  `${DIA_LABEL[horarioSeleccionado.diaSemana]} ${formatHora(horarioSeleccionado.horaInicio)} – ${formatHora(horarioSeleccionado.horaFin)}`}
              </strong>
            </div>
          </div>

          {/* Barra de progreso decorativa */}
          <div className="space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full w-full rounded-full"
                style={{ background: "#118ab2" }}
              />
            </div>
          </div>
          <p className="rounded-xl bg-secondary px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
            Tu solicitud quedará en estado <strong>Pendiente</strong> hasta que
            el tutor la acepte.
          </p>
          {submitError && (
            <p role="alert" className="text-sm text-destructive">
              {submitError}
            </p>
          )}
          {/* Botones del diálogo */}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setConfirmationOpen(false)}
              disabled={submitting}
              className="rounded-xl border border-[#CB0404] px-4 py-2.5 text-sm text-red-800 transition-colors hover:bg-red-50 hover:border-red-400 disabled:opacity-50 dark:border-red-800/50 dark:hover:bg-red-950/20"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={confirmSolicitud}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#118ab2] px-4 py-2.5 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-70"
              style={{
                background: "#118AB2",
              }}
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Confirmar solicitud
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
