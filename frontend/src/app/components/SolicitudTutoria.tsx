// ======================================================
// IMPORTACIONES
// ======================================================

// Hooks de React:
// useState: administra los estados del componente.
// useEffect: ejecuta tareas cuando el componente se monta.
// useMemo: memoriza resultados calculados.
// useRef: permite acceder directamente a un elemento del DOM.
import { useEffect, useMemo, useRef, useState } from "react";

// Iconos de Lucide utilizados en los botones, formularios y mensajes.
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

// Componentes reutilizables para mostrar el calendario, los popovers
// y las ventanas de diálogo de confirmación.
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

// Funciones y tipos que permiten consultar el catálogo de asignaturas,
// tutores y horarios disponibles en el backend.
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

// Funciones para registrar la solicitud de tutoría y subir archivos adjuntos.
import { solicitarTutoria, subirAdjunto } from "../lib/sesiones";

// Clase para identificar y manejar errores provenientes de la API.
import { ApiError } from "../lib/api";

// Barra de navegación rápida y tipo de las secciones disponibles.
import { QuickAccessNav, type QuickAccessTab } from "./QuickAccessNav";

// ======================================================
// 1. TIPOS Y CONSTANTES
// ======================================================

// Define las propiedades que el componente recibe desde su componente padre.
interface Props {
  idEstudiante: number; // Identificador del estudiante que solicita la tutoría.
  onSuccess: () => void; // Función que se ejecuta cuando la solicitud se completa.
  onCancel: () => void; // Función prevista para cancelar o salir del formulario.
  onNavigate: (tab: QuickAccessTab) => void; // Permite navegar entre secciones.
}

// Relaciona cada día de atención con el número que utiliza JavaScript.
// getDay(): domingo = 0, lunes = 1, ..., sábado = 6.
const DAY_NUMBER: Record<HorarioOption["diaSemana"], number> = {
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
};

// ======================================================
// 2. FUNCIONES AUXILIARES PARA MANEJAR FECHAS
// ======================================================

// Convierte una fecha local al formato YYYY-MM-DD.
// Se utilizan los valores locales para evitar cambios de día por zona horaria.
function fechaLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Convierte una fecha en formato YYYY-MM-DD a un objeto Date local.
// Si no recibe una fecha válida como cadena, devuelve undefined.
function fechaDesdeISO(value: string): Date | undefined {
  if (!value) return undefined;

  const [year, month, day] = value.split("-").map(Number);

  // El mes se resta en uno porque JavaScript numera los meses de 0 a 11.
  return new Date(year, month - 1, day);
}

// Muestra una fecha completa en español.
// Ejemplo: "lunes, 15 de mayo de 2026".
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

// Muestra una fecha en formato corto según la configuración regional.
// Ejemplo: "15/5/2026".
function fechaCorta(value: string): string {
  const date = fechaDesdeISO(value);

  return date ? date.toLocaleDateString("es-SV") : "";
}

// ======================================================
// 3. COMPONENTES AUXILIARES REUTILIZABLES
// ======================================================

// Muestra el número de cada paso del formulario.
// Si el paso está completo, sustituye el número por un icono de verificación.
function StepIndicator({
  step,
  complete,
  label,
}: {
  step: number;
  complete: boolean;
  label: string;
}) {
  // Identifica el primer paso como actual cuando todavía no está completo.
  const current = !complete && step === 1;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {/* Círculo que representa el estado del paso. */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        style={{
          // Verde para pasos completos, azul para el paso actual
          // y color secundario para los pasos pendientes.
          background: complete
            ? "#10B981"
            : current
              ? "#118AB2"
              : "var(--secondary)",

          // El número o icono es blanco cuando el paso está activo o completo.
          color: complete || current ? "#fff" : "var(--muted-foreground)",
        }}
      >
        {complete ? <Check size={15} /> : step}
      </div>

      {/* Etiqueta visible a partir del tamaño de pantalla sm. */}
      <span className="hidden truncate text-xs text-muted-foreground sm:block">
        {label}
      </span>
    </div>
  );
}

// Encabezado reutilizable para identificar cada sección del formulario.
// Recibe el número del paso, un icono, un título y un subtítulo.
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
    <div className="mb-4 flex items-start gap-2.5">
      {/* Contenedor del icono con el color principal de la aplicación. */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ background: "#118AB2" }}
      >
        <Icon size={18} />
      </div>

      {/* Textos descriptivos de la sección. */}
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

// ======================================================
// 4. COMPONENTE PRINCIPAL: SOLICITUD DE TUTORÍA
// ======================================================

// Gestiona el formulario, las consultas al backend, la selección de horarios,
// la carga de documentos, las validaciones y el envío de la solicitud.
export function SolicitudTutoria({
  idEstudiante,
  onSuccess,
  onCancel,
  onNavigate,
}: Props) {
  // La propiedad onCancel se recibe, pero actualmente no se utiliza.
  void onCancel;

  // ----------------------------------------------------
  // 4.1. ESTADOS DEL COMPONENTE
  // ----------------------------------------------------

  // Listas de datos obtenidos desde el backend.
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [tutoresDisponibles, setTutoresDisponibles] = useState<TutorOption[]>(
    [],
  );
  const [horariosDisponibles, setHorariosDisponibles] = useState<
    HorarioOption[]
  >([]);

  // Estados de carga para informar al usuario mientras llegan los datos.
  const [cargandoAsignaturas, setCargandoAsignaturas] = useState(true);
  const [cargandoTutores, setCargandoTutores] = useState(false);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);

  // Valores seleccionados en los campos del formulario.
  // El tipo number | "" permite representar tanto una selección como un campo vacío.
  const [idAsignatura, setIdAsignatura] = useState<number | "">("");
  const [idTutor, setIdTutor] = useState<number | "">("");
  const [idHorario, setIdHorario] = useState<number | "">("");

  // Información escrita por el estudiante y fecha seleccionada.
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");

  // Archivos adjuntos seleccionados y estado visual del área de arrastre.
  const [archivos, setArchivos] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

  // Controla la apertura del calendario y del diálogo de confirmación.
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  // Indica si la solicitud se envió correctamente.
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  // Almacena los errores asociados a campos individuales.
  // Cada propiedad corresponde al nombre de un campo del formulario.
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Almacena mensajes de error generales provenientes del backend
  // o de las operaciones de carga.
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Indica si el envío está en curso para evitar acciones repetidas.
  const [submitting, setSubmitting] = useState(false);

  // Referencia al input de archivos para abrirlo desde el área de carga.
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------
  // 4.2. CARGA INICIAL DE ASIGNATURAS
  // ----------------------------------------------------

  // Se ejecuta una sola vez al montar el componente.
  useEffect(() => {
    listarAsignaturas()
      // Si la consulta funciona, guarda las asignaturas recibidas.
      .then(setAsignaturas)

      // Si falla, muestra un mensaje de error.
      .catch(() => setSubmitError("No se pudieron cargar las asignaturas."))

      // Independientemente del resultado, finaliza el estado de carga.
      .finally(() => setCargandoAsignaturas(false));
  }, []);

  // ----------------------------------------------------
  // 4.3. MANEJADORES DE SELECCIÓN
  // ----------------------------------------------------

  // Se ejecuta cuando el estudiante selecciona una asignatura.
  const handleAsignaturaChange = (value: string) => {
    // Convierte el identificador recibido del select a número.
    const id = value ? Number(value) : "";

    setIdAsignatura(id);

    // Limpia las selecciones dependientes de la asignatura anterior.
    setIdTutor("");
    setIdHorario("");
    setFecha("");

    // Elimina los datos que ya no corresponden a la selección actual.
    setTutoresDisponibles([]);
    setHorariosDisponibles([]);

    // Si el campo queda vacío, no es necesario consultar tutores.
    if (id === "") return;

    setCargandoTutores(true);

    // Solicita los tutores que pueden impartir la asignatura seleccionada.
    listarTutoresPorAsignatura(id)
      .then(setTutoresDisponibles)
      .catch(() => setSubmitError("No se pudieron cargar los tutores."))
      .finally(() => setCargandoTutores(false));
  };

  // Se ejecuta cuando el estudiante selecciona un tutor.
  const handleTutorChange = (value: string) => {
    const id = value ? Number(value) : "";

    setIdTutor(id);

    // Los horarios y la fecha anterior dejan de ser válidos
    // cuando cambia el tutor.
    setIdHorario("");
    setFecha("");
    setHorariosDisponibles([]);

    if (id === "") return;

    setCargandoHorarios(true);

    // Consulta los bloques horarios configurados para el tutor seleccionado.
    listarHorariosDisponibles(id)
      .then(setHorariosDisponibles)
      .catch(() => setSubmitError("No se pudieron cargar los horarios."))
      .finally(() => setCargandoHorarios(false));
  };

  // Se ejecuta al seleccionar o limpiar una fecha en el calendario.
  const handleFechaChange = (date: Date | undefined) => {
    // Convierte la fecha seleccionada a YYYY-MM-DD.
    setFecha(date ? fechaLocal(date) : "");

    // Reinicia el horario porque puede no corresponder a la nueva fecha.
    setIdHorario("");

    // Limpia los errores relacionados con fecha y horario.
    setErrors((current) => ({ ...current, fecha: "", horario: "" }));

    // Cierra el calendario después de seleccionar una fecha.
    setCalendarOpen(false);
  };

  // ----------------------------------------------------
  // 4.4. CARGA Y ADMINISTRACIÓN DE ARCHIVOS
  // ----------------------------------------------------

  // Maneja los archivos que el usuario arrastra hasta el área de carga.
  const handleDrop = (event: React.DragEvent) => {
    // Evita que el navegador abra el archivo por defecto.
    event.preventDefault();

    // Desactiva el estilo visual de arrastre.
    setDragging(false);

    // Convierte los archivos recibidos a un arreglo y acepta
    // únicamente archivos de hasta 25 MB.
    const nuevos = Array.from(event.dataTransfer.files).filter(
      (file) => file.size <= 25 * 1024 * 1024,
    );

    // Agrega los archivos válidos y limita la lista a cinco elementos.
    setArchivos((prev) => [...prev, ...nuevos].slice(0, 5));
  };

  // Maneja los archivos seleccionados desde el explorador del sistema.
  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Finaliza si no se seleccionaron archivos.
    if (!event.target.files) return;

    // Filtra los archivos que no superan los 25 MB.
    const nuevos = Array.from(event.target.files).filter(
      (file) => file.size <= 25 * 1024 * 1024,
    );

    // Agrega los archivos válidos y mantiene un máximo de cinco.
    setArchivos((prev) => [...prev, ...nuevos].slice(0, 5));
  };

  // Elimina un archivo de la lista utilizando su posición.
  const removeFile = (index: number) =>
    setArchivos((prev) => prev.filter((_, current) => current !== index));

  // ----------------------------------------------------
  // 4.5. CÁLCULOS Y DATOS DERIVADOS
  // ----------------------------------------------------

  // Obtiene los días de la semana en los que el tutor tiene disponibilidad.
  // useMemo evita recalcular el resultado mientras no cambien los horarios.
  const diasTutor = useMemo(
    () =>
      Array.from(
        new Set(
          horariosDisponibles
            // Solo considera los bloques disponibles.
            .filter((h) => h.disponible)

            // Extrae los días de la semana.
            .map((h) => h.diaSemana),
        ),
      )
        // Convierte los códigos de los días a nombres legibles.
        .map((day) => DIA_LABEL[day].toLowerCase())

        // Une los nombres y reemplaza la última coma por "y".
        .join(", ")
        .replace(/, ([^,]*)$/, " y $1"),

    // El cálculo se actualiza cuando cambian los horarios.
    [horariosDisponibles],
  );

  // Filtra los horarios disponibles que coinciden con la fecha elegida.
  const horariosFecha = useMemo(() => {
    const selectedDate = fechaDesdeISO(fecha);

    return selectedDate
      ? horariosDisponibles.filter(
          (h) =>
            // El bloque debe estar disponible y corresponder al día seleccionado.
            h.disponible && DAY_NUMBER[h.diaSemana] === selectedDate.getDay(),
        )
      : [];
  }, [fecha, horariosDisponibles]);

  // Recupera los objetos completos correspondientes a las selecciones.
  // Se utilizan para mostrar información legible en el diálogo de confirmación.
  const horarioSeleccionado = horariosDisponibles.find(
    (h) => h.id === idHorario,
  );

  const asignaturaSeleccionada = asignaturas.find((a) => a.id === idAsignatura);

  const tutorSeleccionado = tutoresDisponibles.find((t) => t.id === idTutor);

  // Obtiene la fecha actual en formato local para impedir fechas pasadas.
  const hoy = fechaLocal(new Date());

  // Construye un conjunto con los días de la semana en los que existen
  // bloques disponibles para el tutor.
  const diasDisponibles = new Set(
    horariosDisponibles
      .filter((h) => h.disponible)
      .map((h) => DAY_NUMBER[h.diaSemana]),
  );

  // Calcula el estado de cada paso para actualizar el indicador de progreso.
  const paso1Completo = Boolean(idAsignatura && idTutor);
  const paso2Completo = Boolean(fecha && idHorario);

  // El tercer paso se marca como completo al abrir la confirmación
  // o después de registrar el envío.
  const paso3Completo = confirmationOpen || solicitudEnviada;

  // ----------------------------------------------------
  // 4.6. VALIDACIÓN DEL FORMULARIO
  // ----------------------------------------------------

  // Comprueba que todos los campos obligatorios tengan información.
  const validate = () => {
    const nextErrors: Record<string, string> = {};

    // Valida que se haya seleccionado una asignatura.
    if (!idAsignatura) nextErrors.asignatura = "Selecciona una asignatura";

    // Valida que se haya seleccionado un tutor.
    if (!idTutor) nextErrors.tutor = "Selecciona un tutor";

    // Valida que se haya seleccionado una fecha.
    if (!fecha) nextErrors.fecha = "Selecciona una fecha";

    // Valida que se haya seleccionado un horario.
    if (!idHorario) nextErrors.horario = "Selecciona un horario";

    // Rechaza descripciones vacías o compuestas únicamente por espacios.
    if (!descripcion.trim())
      nextErrors.descripcion = "Describe tus dificultades";

    return nextErrors;
  };

  // Maneja el envío inicial del formulario.
  // En esta etapa todavía no se registra la solicitud en el backend.
  const handleSubmit = (event: React.FormEvent) => {
    // Evita la recarga de la página al enviar el formulario.
    event.preventDefault();

    // Ejecuta las validaciones.
    const nextErrors = validate();

    // Si hay errores, los muestra y detiene el proceso.
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    // Limpia los errores anteriores.
    setErrors({});
    setSubmitError(null);

    // Abre el diálogo para que el estudiante revise sus datos.
    setConfirmationOpen(true);
  };

  // ----------------------------------------------------
  // 4.7. CONFIRMACIÓN Y ENVÍO AL BACKEND
  // ----------------------------------------------------

  // Registra la solicitud y después sube los archivos adjuntos.
  const confirmSolicitud = async () => {
    // Evita continuar si faltan datos esenciales.
    if (!horarioSeleccionado || !idTutor || !idAsignatura) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Envía al backend la información de la tutoría.
      const sesionCreada = await solicitarTutoria({
        idEstudiante,
        idTutor,
        idAsignatura,
        idHorario: horarioSeleccionado.id,
        fecha,
        horaInicio: horarioSeleccionado.horaInicio,
        horaFin: horarioSeleccionado.horaFin,
        descripcionDificultades: descripcion,
      });

      // Sube los documentos uno por uno después de crear la sesión.
      // Se necesita el ID de la sesión para asociar cada archivo.
      for (const archivo of archivos) {
        await subirAdjunto(sesionCreada.id, archivo);
      }

      // Indica que la operación terminó correctamente.
      setSolicitudEnviada(true);

      // Cierra el diálogo de confirmación.
      setConfirmationOpen(false);

      // Notifica al componente padre para actualizar la interfaz.
      onSuccess();
    } catch (error) {
      // Si el error procede de la API, muestra su mensaje.
      // En caso contrario, utiliza un mensaje genérico.
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "No se pudo enviar la solicitud.",
      );
    } finally {
      // Restablece el estado de envío tanto si funciona como si falla.
      setSubmitting(false);
    }
  };

  // ======================================================
  // 5. RENDERIZADO DE LA INTERFAZ (JSX)
  // ======================================================

  return (
    <div className="w-full max-w-none">
      {/* Barra de navegación para acceder a otras secciones. */}
      <QuickAccessNav activeTab="solicitud" onNavigate={onNavigate} />

      {/* Contenedor principal con ancho limitado y espaciado adaptable. */}
      <div className="mx-auto w-full max-w-[720px] px-3 sm:px-0">
        {/* Título introductorio de la página. */}
        <div className="mb-4 text-left">
          <h1 className="text-foreground" style={{ fontSize: "1.4rem" }}>
            Registra tu solicitud de tutoría en este espacio
          </h1>
        </div>

        {/* Tarjeta principal del formulario. */}
        <div className="mx-auto w-full max-w-[720px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* -------------------------------------------- */}
          {/* CABECERA E INDICADOR DE PROGRESO */}
          {/* -------------------------------------------- */}

          <header
            className="border-b border-border px-4 pb-4 pt-5 text-white sm:px-5"
            style={{ backgroundColor: "#79cae55a" }}
          >
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

            {/* Indicador visual de los tres pasos del proceso. */}
            <div
              className="mt-5 flex items-center gap-2 sm:gap-3"
              aria-label="Progreso de la solicitud"
            >
              <StepIndicator
                step={1}
                complete={paso1Completo}
                label="Materia y tutor"
              />

              {/* Línea de separación entre los pasos. */}
              <div className="h-0.5 flex-1 bg-slate-300" />

              <StepIndicator
                step={2}
                complete={paso2Completo}
                label="Fecha y hora"
              />

              <div className="h-0.5 flex-1 bg-slate-300" />

              <StepIndicator
                step={3}
                complete={paso3Completo}
                label="Confirmar y enviar"
              />
            </div>
          </header>

          {/* Formulario principal: organiza los campos verticalmente. */}
          <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-5">
            {/* Muestra errores generales fuera del diálogo de confirmación. */}
            {submitError && !confirmationOpen && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive"
                style={{ fontSize: "0.85rem" }}
              >
                {submitError}
              </div>
            )}

            {/* ========================================== */}
            {/* PASO 1: ASIGNATURA Y TUTOR */}
            {/* ========================================== */}

            <section className="rounded-2xl border border-border p-4">
              <CardHeader
                step={1}
                icon={UserRound}
                title="Asignatura y tutor"
                subtitle="Selecciona la asignatura y el tutor"
              />

              {/* En pantallas medianas, los campos aparecen en dos columnas. */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Selector de asignatura. */}
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
                      {/* Opción inicial que también informa si hay una carga activa. */}
                      <option value="">
                        {cargandoAsignaturas
                          ? "Cargando..."
                          : "Selecciona una asignatura"}
                      </option>

                      {/* Genera una opción por cada asignatura recibida. */}
                      {asignaturas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre}
                        </option>
                      ))}
                    </select>

                    {/* Icono decorativo que indica que el campo es desplegable. */}
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                  </div>

                  {/* Mensaje de validación de la asignatura. */}
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

                {/* Selector de tutor filtrado por asignatura. */}
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
                      // No permite elegir un tutor sin asignatura
                      // ni mientras se cargan los resultados.
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

                      {/* Cada opción muestra el nombre y la especialidad del tutor. */}
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

                  {/* Mensaje de validación del tutor. */}
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

            {/* ========================================== */}
            {/* PASO 2: FECHA Y HORA */}
            {/* ========================================== */}

            <section className="rounded-2xl border border-border p-5">
              <CardHeader
                step={2}
                icon={CalendarDays}
                title="Fecha y hora"
                subtitle="Selecciona el horario de tu conveniencia"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Selector de fecha mediante un calendario emergente. */}
                <div className="space-y-1.5">
                  <label
                    className="text-card-foreground"
                    style={{ fontSize: "0.875rem" }}
                  >
                    Fecha <span className="text-brand-teal">*</span>
                  </label>

                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    {/* El botón abre o cierra el calendario. */}
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        disabled={!idTutor || cargandoHorarios}
                        aria-label="Selecciona una fecha"
                        className="flex w-full items-center justify-between rounded-xl border border-[#118ab2] bg-input-background px-4 py-2.5 text-left text-card-foreground outline-none transition-all hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ fontSize: "0.88rem" }}
                      >
                        {/* Muestra la fecha elegida o un texto de ayuda. */}
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

                    {/* Contenido del calendario emergente. */}
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        // Marca visualmente la fecha seleccionada.
                        selected={fechaDesdeISO(fecha)}
                        onSelect={handleFechaChange}
                        // Deshabilita las fechas pasadas y los días
                        // en los que el tutor no tiene disponibilidad.
                        disabled={(date) =>
                          fechaLocal(date) < hoy ||
                          !diasDisponibles.has(date.getDay())
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Error asociado al campo fecha. */}
                  {errors.fecha && (
                    <p
                      role="alert"
                      className="text-destructive"
                      style={{ fontSize: "0.78rem" }}
                    >
                      {errors.fecha}
                    </p>
                  )}

                  {/* Informa qué días atiende el tutor seleccionado. */}
                  {idTutor && !cargandoHorarios && (
                    <p
                      className="text-muted-foreground"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Días que atiende este tutor: {diasTutor || "ninguno"}
                    </p>
                  )}
                </div>

                {/* Selector de bloques horarios correspondientes a la fecha. */}
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
                        // Convierte el valor seleccionado a número
                        // o conserva el campo vacío.
                        setIdHorario(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      // Requiere una fecha válida y horarios cargados.
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
                      {/* Texto que cambia según el estado del selector. */}
                      <option value="">
                        {!fecha
                          ? "Primero selecciona una fecha"
                          : cargandoHorarios
                            ? "Cargando..."
                            : horariosFecha.length === 0
                              ? "No hay bloques disponibles"
                              : "Selecciona un horario"}
                      </option>

                      {/* Genera los horarios disponibles para ese día. */}
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

                  {/* Mensaje de validación del horario. */}
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

            {/* ========================================== */}
            {/* PASO 3: DESCRIPCIÓN Y DOCUMENTOS */}
            {/* ========================================== */}

            <section className="rounded-2xl border border-border p-5">
              <CardHeader
                step={3}
                icon={FileText}
                title="Detalle de la solicitud"
                subtitle="Cuéntanos cómo podemos ayudarte"
              />

              <div className="space-y-5">
                {/* Campo de descripción de las dificultades académicas. */}
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
                    // Limita la longitud de la descripción a 500 caracteres.
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
                      {/* Muestra el error si la descripción está vacía. */}
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

                    {/* Contador de caracteres escritos. */}
                    <span
                      className="text-muted-foreground"
                      style={{ fontSize: "0.75rem" }}
                    >
                      {descripcion.length}/500
                    </span>
                  </div>
                </div>

                {/* Área de carga de documentos mediante clic o arrastre. */}
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
                    // Permite abrir el explorador de archivos con Enter o Espacio.
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        fileInputRef.current?.click();
                    }}
                    // Activa el estado visual cuando un archivo entra en el área.
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    // Desactiva el estado visual cuando termina el arrastre.
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    // Abre el explorador de archivos al hacer clic.
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-4 transition-all"
                    style={{
                      // Cambia el borde y el fondo mientras se arrastran archivos.
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
                      <span className="text-brand-teal">
                        haz clic para subir
                      </span>
                    </p>

                    <p
                      className="text-muted-foreground"
                      style={{ fontSize: "0.73rem" }}
                    >
                      PDF, DOCX, XLSX · Máx. 25 MB por archivo
                    </p>

                    {/* Input oculto que permite seleccionar varios archivos. */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </div>

                  {/* Lista los documentos seleccionados antes de enviarlos. */}
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

                          {/* Nombre del archivo con truncamiento si es muy largo. */}
                          <span
                            className="min-w-0 flex-1 truncate text-card-foreground"
                            style={{ fontSize: "0.82rem" }}
                          >
                            {file.name}
                          </span>

                          {/* Tamaño aproximado expresado en KB. */}
                          <span
                            className="shrink-0 text-muted-foreground"
                            style={{ fontSize: "0.73rem" }}
                          >
                            {(file.size / 1024).toFixed(0)} KB
                          </span>

                          {/* Botón para quitar el archivo de la lista. */}
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

            {/* Botón que valida el formulario y abre la confirmación. */}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#118AB2] py-2.5 text-sm text-white transition-all hover:opacity-90 active:scale-[0.99]"
              style={{ background: "#118AB2" }}
            >
              Enviar
            </button>
          </form>
        </div>
      </div>

      {/* ================================================= */}
      {/* 6. DIÁLOGO DE CONFIRMACIÓN DE LA SOLICITUD */}
      {/* ================================================= */}

      {/* Solicita al estudiante revisar sus datos antes de registrar la tutoría. */}
      <Dialog
        open={confirmationOpen}
        onOpenChange={(open) => {
          // Impide cerrar o modificar el diálogo durante el envío.
          if (!submitting) {
            setConfirmationOpen(open);

            // Limpia el error cuando se cierra el diálogo.
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

          {/* Resumen de los datos seleccionados por el estudiante. */}
          <div className="space-y-3 text-sm">
            {/* Asignatura elegida. */}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Asignatura</span>
              <strong className="text-right text-foreground">
                {asignaturaSeleccionada?.nombre}
              </strong>
            </div>

            {/* Tutor elegido. */}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Tutor</span>
              <strong className="text-right text-foreground">
                {tutorSeleccionado?.nombreCompleto}
              </strong>
            </div>

            {/* Fecha elegida en formato corto. */}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Fecha</span>
              <strong className="text-right capitalize text-foreground">
                {fechaCorta(fecha)}
              </strong>
            </div>

            {/* Horario seleccionado, con sus horas de inicio y finalización. */}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Horario</span>
              <strong className="text-right text-foreground">
                {horarioSeleccionado &&
                  `${DIA_LABEL[horarioSeleccionado.diaSemana]} ${formatHora(horarioSeleccionado.horaInicio)} – ${formatHora(horarioSeleccionado.horaFin)}`}
              </strong>
            </div>
          </div>

          {/* Barra visual decorativa que representa el progreso completado. */}
          <div className="space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full w-full rounded-full"
                style={{ background: "#118ab2" }}
              />
            </div>
          </div>

          {/* Informa al estudiante del estado inicial de la solicitud. */}
          <p className="rounded-xl bg-secondary px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
            Tu solicitud quedará en estado <strong>Pendiente</strong> hasta que
            el tutor la acepte.
          </p>

          {/* Muestra los errores que ocurran al registrar la solicitud. */}
          {submitError && (
            <p role="alert" className="text-sm text-destructive">
              {submitError}
            </p>
          )}

          {/* Botones para volver al formulario o confirmar el envío. */}
          <DialogFooter>
            {/* Cierra la confirmación para permitir editar los datos. */}
            <button
              type="button"
              onClick={() => setConfirmationOpen(false)}
              disabled={submitting}
              className="rounded-xl border border-[#CB0404] px-4 py-2.5 text-sm text-red-800 transition-colors hover:bg-red-50 hover:border-red-400 disabled:opacity-50 dark:border-red-800/50 dark:hover:bg-red-950/20"
            >
              Editar
            </button>

            {/* Registra la solicitud y muestra un indicador mientras se procesa. */}
            <button
              type="button"
              onClick={confirmSolicitud}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#118ab2] px-4 py-2.5 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-70"
              style={{
                background: "#118AB2",
              }}
            >
              {/* Icono animado que indica que el envío está en curso. */}
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Confirmar solicitud
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
