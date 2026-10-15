// =====================================================================
// IMPORTACIONES
// =====================================================================

// Hooks de React que usaremos:
// - useCallback: memoriza una función para que no se recree en cada render
// - useEffect: ejecuta efectos secundarios (como cargar datos al montar)
// - useState: maneja el estado local de los componentes
import { useCallback, useEffect, useState } from "react";

// Iconos de la librería lucide-react
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock3,
  Eye,
  FileText,
  History,
  Loader2,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

// Funciones y tipos de la capa de datos (API)
// - historialEstudiante: obtiene todas las sesiones de un estudiante
// - cancelarSesion: cambia el estado de una sesión a CANCELADA
// - Sesion / EstadoSesion: tipos TypeScript del modelo de datos
import {
  historialEstudiante,
  cancelarSesion,
  type Sesion,
  type EstadoSesion,
} from "../lib/sesiones";
// Clase de error personalizada para distinguir errores que vienen del backend
import { ApiError } from "../lib/api";

// Componentes reutilizables
// - VoiceSearchInput: campo de búsqueda con soporte de voz
// - QuickAccessNav: barra de navegación rápida entre secciones
import { VoiceSearchInput } from "./VoiceSearchInput";
import { QuickAccessNav, type QuickAccessTab } from "./QuickAccessNav";

// =====================================================================
// TIPOS Y CONSTANTES
// =====================================================================

// Propiedades que recibe el componente principal
interface Props {
  idEstudiante: number;
  onNavigate: (tab: QuickAccessTab) => void; // Callback para cambiar de pestaña
}

// Configuración visual de cada estado de sesión
type EstadoConfig = { label: string; color: string; bg: string; dot: string };

// Diccionario que asocia cada estado con su texto y colores:
// - label: texto mostrado al usuario
// - color: color del texto del badge
// - bg: color de fondo del badge (con transparencia)
// - dot: color del punto indicador en el calendario
const ESTADO_CONFIG: Record<EstadoSesion, EstadoConfig> = {
  PENDIENTE: {
    label: "Pendiente",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    dot: "#F59E0B",
  },
  APROBADA: {
    label: "Aprobada",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
    dot: "#3B82F6",
  },
  COMPLETADA: {
    label: "Completada",
    color: "#11CAA0",
    bg: "rgba(17,202,160,0.12)",
    dot: "#11CAA0",
  },
  CANCELADA: {
    label: "Cancelada",
    color: "#71809A",
    bg: "rgba(113,128,154,0.14)",
    dot: "#9AA7B9",
  },
  RECHAZADA: {
    label: "Rechazada",
    color: "#C34B5A",
    bg: "rgba(239,68,68,0.12)",
    dot: "#E26B78",
  },
};

// Encabezados de los días de la semana para el calendario (inicia en lunes)
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// =====================================================================
// FUNCIONES AUXILIARES
// =====================================================================

// Convierte un string "YYYY-MM-DD" en un objeto Date en hora LOCAL.
// Se evita `new Date("YYYY-MM-DD")` porque lo interpreta como UTC y
// puede mostrar el día anterior en zonas horarias como la de El Salvador.
function fechaLocal(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Convierte un Date en un string "YYYY-MM-DD".
// Se usa como llave para agrupar sesiones por día en el calendario.
function fechaKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Formatea una fecha para mostrarla al usuario (ej. "14 oct 2026")
function formatFecha(value: string): string {
  return fechaLocal(value).toLocaleDateString("es-SV", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Recorta la hora "HH:MM:SS" a "HH:MM"
function formatHora(value: string): string {
  return value.slice(0, 5);
}

// Normaliza texto para búsquedas: quita tildes y pasa a minúsculas,
// así "Matemática" coincide con "matematica".
function normalizarBusqueda(value: string): string {
  return value
    .normalize("NFD") // Separa letras de sus acentos
    .replace(/[\u0300-\u036f]/g, "") // Elimina los acentos
    .toLowerCase();
}

// =====================================================================
// SUBCOMPONENTES AUXILIARES
// =====================================================================

// ---------------------------------------------------------------------
// EstadoBadge: etiqueta de color que muestra el estado de una sesión
// ---------------------------------------------------------------------
function EstadoBadge({ estado }: { estado: EstadoSesion }) {
  // Obtiene los colores y el texto según el estado
  const config = ESTADO_CONFIG[estado];
  return (
    <span
      className="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ color: config.color, background: config.bg }}
    >
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------
// SummaryCard: tarjeta de resumen (Pendientes, Aprobadas, Completadas).
// Muestra un contador y funciona como botón para filtrar la tabla.
// ---------------------------------------------------------------------
function SummaryCard({
  label,
  count,
  icon: Icon,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm dark:border-[#2A4158]"
      // Si el filtro está activo, el borde toma el color de la tarjeta
      style={{ borderColor: active ? color : undefined }}
    >
      {/* Contenedor del icono */}
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}1F`, color }}
      >
        <Icon size={19} />
      </span>
      {/* Contador y etiqueta */}
      <span className="min-w-0">
        <strong
          className="block text-xl text-foreground"
          style={{ lineHeight: 1.1 }}
        >
          {count}
        </strong>
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {label}
        </span>
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------
// DetalleModal: ventana modal con la información completa de una sesión
// ---------------------------------------------------------------------
function DetalleModal({
  sesion,
  onClose,
}: {
  sesion: Sesion;
  onClose: () => void;
}) {
  return (
    // Capa que cubre toda la pantalla y centra el modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detalle-tutoria"
    >
      {/* Fondo oscuro con desenfoque; al hacer clic se cierra el modal */}
      <button
        type="button"
        aria-label="Cerrar detalle"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Contenedor principal del modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl dark:border-[#2A4158]">
        {/* ---------- Encabezado del modal ---------- */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 dark:border-[#2A4158]">
          <div className="flex items-center gap-2.5">
            <FileText size={16} className="text-brand-teal" />
            <h2
              id="detalle-tutoria"
              className="text-card-foreground"
              style={{ fontSize: "0.95rem" }}
            >
              Detalle de Tutoría
            </h2>
          </div>
          {/* Botón X para cerrar */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-[#118AB2] hover:text-[#0E7490] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ---------- Cuerpo del modal ---------- */}
        <div className="space-y-4 px-6 py-5">
          {/* Asignatura, tutor y badge de estado */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-card-foreground">{sesion.asignaturaNombre}</p>
              <p
                className="text-muted-foreground"
                style={{ fontSize: "0.82rem" }}
              >
                {sesion.tutorNombre}
              </p>
            </div>
            <EstadoBadge estado={sesion.estado} />
          </div>

          {/* Observaciones del tutor (si no hay, se muestra un mensaje por defecto) */}
          <div className="rounded-xl bg-secondary p-3">
            <p
              className="mb-1 text-muted-foreground"
              style={{ fontSize: "0.82rem", textTransform: "uppercase" }}
            >
              Observaciones del tutor
            </p>
            <p
              className="text-card-foreground"
              style={{ fontSize: "0.78rem", lineHeight: 1.6 }}
            >
              {sesion.observacionesTutor ??
                "Aún no hay observaciones registradas para esta sesión."}
            </p>
          </div>
        </div>

        {/* ---------- Pie del modal: botón de cerrar ---------- */}
        <div className="px-6 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            style={{ background: "#118AB2" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// ConfirmarCancelModal: modal de confirmación antes de cancelar una sesión
// ---------------------------------------------------------------------
function ConfirmarCancelModal({
  sesion,
  onConfirm,
  onClose,
  enviando,
}: {
  sesion: Sesion; // Sesión que se va a cancelar
  onConfirm: () => void; // Acción al confirmar la cancelación
  onClose: () => void; // Acción al cerrar sin cancelar
  enviando: boolean; // true mientras se procesa la petición al servidor
}) {
  return (
    // Capa que cubre toda la pantalla y centra el modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancelar-tutoria"
    >
      {/* Fondo oscuro; al hacer clic se cierra el modal */}
      <button
        type="button"
        aria-label="Cerrar confirmación"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Contenedor principal del modal */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-xl dark:border-[#2A4158]">
        {/* ---------- Mensaje de advertencia ---------- */}
        <div className="space-y-4 px-6 pb-4 pt-6 text-center">
          {/* Icono de alerta */}
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(239,68,68,0.1)" }}
          >
            <AlertTriangle size={26} className="text-destructive" />
          </div>
          {/* Título y descripción de lo que ocurrirá */}
          <div>
            <h2
              id="cancelar-tutoria"
              className="mb-1 text-card-foreground"
              style={{ fontSize: "1rem" }}
            >
              ¿Cancelar sesión?
            </h2>
            <p
              className="text-muted-foreground"
              style={{ fontSize: "0.85rem", lineHeight: 1.6 }}
            >
              La sesión{" "}
              <strong className="text-foreground">#{sesion.id}</strong> de{" "}
              <strong className="text-foreground">
                {sesion.asignaturaNombre}
              </strong>{" "}
              cambiará a estado CANCELADA.
            </p>
          </div>

          {/* Aviso informativo: el tutor será notificado */}
          <div
            className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left"
            style={{ background: "rgba(245,158,11,0.08)" }}
          >
            <Bell size={13} className="mt-0.5 shrink-0 text-amber-500" />
            <p
              className="text-amber-500"
              style={{ fontSize: "0.78rem", lineHeight: 1.5 }}
            >
              El tutor recibirá una notificación de cancelación.
            </p>
          </div>
        </div>

        {/* ---------- Botones de acción ---------- */}
        <div className="flex gap-3 px-6 pb-6">
          {/* Volver: cierra el modal sin cancelar */}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm text-foreground hover:bg-secondary dark:border-[#2A4158]"
          >
            Volver
          </button>
          {/* Confirmar: se deshabilita y muestra spinner mientras se envía */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={enviando}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm text-white disabled:opacity-70"
            style={{ background: "#EF4444" }}
          >
            {enviando && <Loader2 size={14} className="animate-spin" />}Sí,
            cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// CalendarPanel: calendario mensual que marca con puntos de color
// los días que tienen tutorías, según su estado.
// ---------------------------------------------------------------------
function CalendarPanel({ tutorias }: { tutorias: Sesion[] }) {
  // ---------- Estado del calendario ----------
  // Mes que se está visualizando (siempre el día 1 del mes)
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  // Día seleccionado por el usuario (formato "YYYY-MM-DD") o null
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // ---------- Cálculos del mes ----------
  // Cantidad de días del mes (el día 0 del mes siguiente es el último del actual)
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  // Posición del primer día del mes en la semana.
  // getDay() devuelve 0 para domingo; se ajusta para que la semana inicie en lunes.
  const firstDay =
    (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  // Nombre del mes y año para el encabezado (ej. "octubre de 2026")
  const monthName = month.toLocaleDateString("es-SV", {
    month: "long",
    year: "numeric",
  });

  // ---------- Agrupación de sesiones por fecha ----------
  // Mapa donde la llave es la fecha y el valor es la lista de sesiones de ese día
  const sessionsByDate = new Map<string, Sesion[]>();
  tutorias.forEach((sesion) => {
    const sessions = sessionsByDate.get(sesion.fechaSesion) ?? [];
    sessions.push(sesion);
    sessionsByDate.set(sesion.fechaSesion, sessions);
  });

  // ---------- Celdas de la cuadrícula ----------
  // Primero las celdas vacías (null) previas al día 1 y luego los días 1..N
  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <section className="rounded-2xl border border-[#D5E1EC] bg-[#F8FAFC] p-3 dark:border-[#2A4158] dark:bg-[#182A3A] sm:p-4">
      {/* ---------- Encabezado: título y navegación de meses ---------- */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "rgba(59,130,246,0.12)", color: "#3578CE" }}
          >
            <CalendarDays size={17} />
          </span>
          <h2 className="text-foreground" style={{ fontSize: "1rem" }}>
            Calendario
          </h2>
        </div>
        <div className="flex items-center gap-0.5">
          {/* Botón: ir al mes anterior */}
          <button
            type="button"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
            aria-label="Mes anterior"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft size={15} />
          </button>
          {/* Nombre del mes actual */}
          <span className="min-w-24 text-center text-xs capitalize text-foreground">
            {monthName}
          </span>
          {/* Botón: ir al mes siguiente */}
          <button
            type="button"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
            aria-label="Mes siguiente"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ---------- Cuadrícula del calendario (7 columnas) ---------- */}
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {/* Fila de encabezados con los días de la semana */}
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            className="py-1 text-[0.7rem] font-semibold text-[#526579] dark:text-slate-300"
          >
            {day}
          </span>
        ))}
        {/* Celdas de los días */}
        {cells.map((day, index) => {
          // Celda vacía (días previos al inicio del mes)
          if (!day)
            return <span key={`empty-${index}`} className="h-8 sm:h-9" />;
          // Datos del día actual de la iteración
          const date = new Date(month.getFullYear(), month.getMonth(), day);
          const key = fechaKey(date);
          const sessions = sessionsByDate.get(key) ?? [];
          const isToday = key === fechaKey(new Date()); // ¿Es el día de hoy?
          const isSelected = selectedDate === key; // ¿Está seleccionado?
          return (
            <button
              type="button"
              key={key}
              onClick={() => setSelectedDate(isSelected ? null : key)}
              className={`
              relative flex h-8 flex-col items-center justify-center
              rounded-lg border text-xs transition-colors
              sm:h-9
         ${
           isSelected
             ? "border-[#118AB2] bg-[#118AB2] text-white shadow-sm"
             : isToday
               ? "border-[#118AB2] bg-[#E0F2FE] text-[#075985] font-bold dark:bg-[#1E3A50] dark:text-sky-300"
               : "border-[#E2E8F0] bg-white text-[#334155] hover:border-[#8CCBDD] hover:bg-[#F0F9FC] dark:border-[#2A4158] dark:bg-[#1E2F42] dark:text-slate-200 dark:hover:bg-[#2A4158]"
         }
  `}
            >
              <span
                className={isSelected ? "font-semibold text-white" : undefined}
              >
                {day}
              </span>

              {sessions.length > 0 && (
                <span className="mt-0.5 flex gap-0.5">
                  {Array.from(
                    new Set(sessions.map((s) => ESTADO_CONFIG[s.estado].dot)),
                  )
                    .slice(0, 3)
                    .map((color) => (
                      <i
                        key={color}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: isSelected ? "#FFFFFF" : color,
                        }}
                      />
                    ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ---------- Leyenda de colores ---------- */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground dark:border-[#2A4158]">
        <span className="flex items-center gap-1.5">
          <i
            className="h-2 w-2 rounded-full"
            style={{ background: "#F59E0B" }}
          />
          Pendiente
        </span>
        <span className="flex items-center gap-1.5">
          <i
            className="h-2 w-2 rounded-full"
            style={{ background: "#3B82F6" }}
          />
          Aprobada
        </span>
        <span className="flex items-center gap-1.5">
          <i
            className="h-2 w-2 rounded-full"
            style={{ background: "#11CAA0" }}
          />
          Completada
        </span>
      </div>
    </section>
  );
}

// =====================================================================
// COMPONENTE PRINCIPAL: HistorialTutorias
// Muestra el historial de tutorías del estudiante con búsqueda, filtros,
// detalle, cancelación y un calendario lateral.
// =====================================================================
export function HistorialTutorias({ idEstudiante, onNavigate }: Props) {
  // -------------------------------------------------------------------
  // ESTADOS
  // -------------------------------------------------------------------
  const [tutorias, setTutorias] = useState<Sesion[]>([]); // Lista completa de sesiones
  const [cargando, setCargando] = useState(true); // true mientras se cargan los datos
  const [loadError, setLoadError] = useState<string | null>(null); // Error al cargar el historial
  const [busqueda, setBusqueda] = useState(""); // Texto del buscador
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos"); // Filtro por estado
  const [detalle, setDetalle] = useState<Sesion | null>(null); // Sesión abierta en el modal de detalle
  const [pendingCancel, setPendingCancel] = useState<Sesion | null>(null); // Sesión pendiente de confirmar cancelación
  const [cancelando, setCancelando] = useState(false); // true mientras se envía la cancelación
  const [canceledId, setCanceledId] = useState<number | null>(null); // ID de la última sesión cancelada (para el aviso de éxito)
  const [actionError, setActionError] = useState<string | null>(null); // Error al intentar cancelar

  // -------------------------------------------------------------------
  // CARGA DE DATOS
  // -------------------------------------------------------------------
  // Pide el historial al backend. Se memoriza con useCallback para poder
  // reutilizarla (al montar y después de cancelar) sin recrearla en cada render.
  const cargar = useCallback(() => {
    setCargando(true);
    setLoadError(null);
    historialEstudiante(idEstudiante)
      .then(setTutorias) // Guarda las sesiones recibidas
      .catch((error) =>
        // Si es un ApiError se muestra su mensaje; si no, uno genérico
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "No se pudo cargar el historial.",
        ),
      )
      .finally(() => setCargando(false)); // Siempre se quita el estado de carga
  }, [idEstudiante]);

  // Carga el historial al montar el componente (o si cambia el estudiante)
  useEffect(() => {
    cargar();
  }, [cargar]);

  // -------------------------------------------------------------------
  // ACCIONES: CANCELAR SESIONES
  // -------------------------------------------------------------------
  // Ejecuta la cancelación una vez que el usuario confirmó en el modal
  const confirmarCancelacion = async () => {
    if (!pendingCancel) return; // Seguridad: no hay sesión seleccionada
    setCancelando(true);
    setActionError(null);
    try {
      await cancelarSesion(pendingCancel.id); // Llamada al backend
      setCanceledId(pendingCancel.id); // Activa el aviso de éxito
      setPendingCancel(null); // Cierra el modal de confirmación
      setTimeout(() => setCanceledId(null), 4000); // Oculta el aviso a los 4 segundos
      cargar(); // Recarga la lista para reflejar el nuevo estado
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "No se pudo cancelar la sesión.",
      );
    } finally {
      setCancelando(false);
    }
  };

  // Valida si una sesión puede cancelarse antes de abrir el modal.
  // Solo se permiten las sesiones PENDIENTE o APROBADA.
  const solicitarCancelacion = (session: Sesion) => {
    if (session.estado === "PENDIENTE" || session.estado === "APROBADA") {
      setPendingCancel(session); // Abre el modal de confirmación
      return;
    }
    // Estado no cancelable: muestra un aviso que desaparece a los 4 segundos
    setActionError(
      "Solo puedes cancelar sesiones en estado Pendiente o Aprobada.",
    );
    window.setTimeout(() => setActionError(null), 4000);
  };

  // -------------------------------------------------------------------
  // DATOS DERIVADOS
  // -------------------------------------------------------------------
  // Cuenta cuántas sesiones hay en un estado (para las tarjetas de resumen)
  const countBy = (estado: EstadoSesion) =>
    tutorias.filter((session) => session.estado === estado).length;

  // Aplica el buscador y el filtro de estado sobre la lista completa
  const filtradas = tutorias.filter((session) => {
    const search = normalizarBusqueda(busqueda.trim());
    // Se concatenan todos los campos buscables de la sesión en un solo texto,
    // de modo que el usuario pueda buscar por fecha, hora, materia, ID, tutor o estado
    const searchableText = [
      formatFecha(session.fechaSesion),
      session.fechaSesion,
      formatHora(session.horaInicio),
      session.horaInicio,
      session.asignaturaNombre,
      String(session.id),
      session.tutorNombre,
      ESTADO_CONFIG[session.estado].label,
      session.estado,
    ]
      .map(normalizarBusqueda)
      .join(" ");
    // La sesión se muestra si coincide con la búsqueda Y con el filtro de estado
    return (
      searchableText.includes(search) &&
      (filtroEstado === "Todos" || session.estado === filtroEstado)
    );
  });

  // -------------------------------------------------------------------
  // RENDERIZADO CONDICIONAL: CARGANDO Y ERROR
  // -------------------------------------------------------------------
  // Mientras carga, se muestra solo un spinner
  if (cargando)
    return (
      <div className="flex w-full items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );

  // Si falló la carga, se muestra el mensaje de error
  if (loadError)
    return (
      <div className="w-full rounded-2xl border border-border bg-card p-8 text-center dark:border-[#2A4158]">
        <AlertTriangle size={24} className="mx-auto mb-2 text-destructive" />
        <p className="text-destructive" style={{ fontSize: "0.9rem" }}>
          {loadError}
        </p>
      </div>
    );

  // -------------------------------------------------------------------
  // RENDERIZADO PRINCIPAL
  // -------------------------------------------------------------------
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      {/* ---------- Navegación rápida entre secciones ---------- */}
      <QuickAccessNav activeTab="historial" onNavigate={onNavigate} />

      {/* ---------- Título de la página ---------- */}
      <div className="my-5">
        <h1 className="text-foreground" style={{ fontSize: "1.3rem" }}>
          Consulta tu historial y prepárate para tus próximas tutorías
        </h1>
      </div>

      {/* ---------- Layout de dos columnas (tabla a la izquierda, calendario a la derecha) ---------- */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)] xl:items-start">
        {/* ===== Columna izquierda: resumen + tabla ===== */}
        <div className="space-y-5">
          {/* ---------- Tarjetas de resumen (también actúan como filtros) ---------- */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Al hacer clic se activa el filtro; si ya estaba activo, se quita */}
            <SummaryCard
              label="Pendientes"
              count={countBy("PENDIENTE")}
              icon={Clock}
              color="#F59E0B"
              active={filtroEstado === "PENDIENTE"}
              onClick={() =>
                setFiltroEstado(
                  filtroEstado === "PENDIENTE" ? "Todos" : "PENDIENTE",
                )
              }
            />
            <SummaryCard
              label="Aprobadas"
              count={countBy("APROBADA")}
              icon={CalendarCheck}
              color="#3B82F6"
              active={filtroEstado === "APROBADA"}
              onClick={() =>
                setFiltroEstado(
                  filtroEstado === "APROBADA" ? "Todos" : "APROBADA",
                )
              }
            />
            <SummaryCard
              label="Completadas"
              count={countBy("COMPLETADA")}
              icon={CheckCheck}
              color="#11CAA0"
              active={filtroEstado === "COMPLETADA"}
              onClick={() =>
                setFiltroEstado(
                  filtroEstado === "COMPLETADA" ? "Todos" : "COMPLETADA",
                )
              }
            />
          </div>

          {/* ---------- Sección del historial (tabla) ---------- */}
          <section className="overflow-hidden rounded-2xl border border-[#C9D8E6] bg-[#F8FBFD] dark:border-[#2A4158] dark:bg-[#1E2F42]">
            {/* Encabezado de la sección: título, buscador y filtro */}
            <div className="flex flex-col gap-3 border-b border-[#C9D8E6] bg-[#E5EEF6] p-4 dark:border-[#2A4158] dark:bg-[#182A3A] sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-center gap-2.5">
                <History size={20} className="text-brand-teal" />
                <h2
                  className="text-[#17365D] dark:text-[#E2E8F0]"
                  style={{ fontSize: "1.05rem" }}
                >
                  Mi historial
                </h2>
              </div>
              <div className="flex gap-2">
                {/* Campo de búsqueda (con soporte de voz) */}
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
                {/* Selector para filtrar por estado */}
                <div className="relative">
                  <select
                    value={filtroEstado}
                    onChange={(event) => setFiltroEstado(event.target.value)}
                    aria-label="Filtrar por estado"
                    className="h-full appearance-none rounded-xl border border-[#C9D8E6] bg-[#F8FBFD] px-3 py-2 pr-8 text-sm text-[#17365D] outline-none focus:ring-2 dark:border-[#2A4158] dark:bg-[#1E2F42] dark:text-[#E2E8F0]"
                    style={
                      { "--tw-ring-color": "#118AB2" } as React.CSSProperties
                    }
                  >
                    <option value="Todos">Filtrar</option>
                    {/* Las opciones se generan a partir de ESTADO_CONFIG */}
                    {Object.keys(ESTADO_CONFIG).map((estado) => (
                      <option key={estado} value={estado}>
                        {ESTADO_CONFIG[estado as EstadoSesion].label}
                      </option>
                    ))}
                  </select>
                  {/* Flecha decorativa del selector (no recibe clics) */}
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Contenedor con scroll horizontal para pantallas pequeñas */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                {/* ----- Encabezados de la tabla ----- */}
                <thead>
                  <tr className="border-b border-[#C9D8E6] bg-[#E5EEF6] dark:border-[#2A4158] dark:bg-[#182A3A]">
                    {[
                      "Fecha",
                      "Hora",
                      "Asignatura",
                      "Tutor",
                      "Estado",
                      "Acciones",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-left text-xs font-semibold text-[#526B84] dark:text-[#94A3B8]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                {/* ----- Cuerpo de la tabla ----- */}
                <tbody className="divide-y divide-border dark:divide-[#2A4158]">
                  {/* Si no hay resultados, se muestra una fila con el mensaje */}
                  {filtradas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        No se encontraron tutorías
                      </td>
                    </tr>
                  ) : (
                    // Una fila por cada sesión que pasó los filtros
                    filtradas.map((session) => (
                      <tr
                        key={session.id}
                        className="text-xs transition-colors hover:bg-[#EAF3F8] dark:hover:bg-[#2A4158]/40 [&>td]:text-xs [&_p]:text-xs"
                      >
                        {/* Columna: Fecha */}
                        <td className="px-5 py-3.5">
                          <p className="text-foreground">
                            {formatFecha(session.fechaSesion)}
                          </p>
                        </td>
                        {/* Columna: Hora */}
                        <td className="px-5 py-3.5">
                          <p className="flex items-center gap-1 text-foreground">
                            <Clock3
                              size={12}
                              className="text-muted-foreground"
                            />
                            {formatHora(session.horaInicio)}
                          </p>
                        </td>
                        {/* Columna: Asignatura y código de sesión */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-foreground">
                              {session.asignaturaNombre}
                            </span>
                            <span className="text-muted-foreground">
                              #{session.id}
                            </span>
                          </div>
                        </td>
                        {/* Columna: Tutor */}
                        <td className="px-5 py-3.5 text-foreground">
                          {session.tutorNombre}
                        </td>
                        {/* Columna: Estado (badge de color) */}
                        <td className="px-5 py-3.5">
                          <EstadoBadge estado={session.estado} />
                        </td>
                        {/* Columna: Acciones (ver detalle y cancelar) */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            {/* Ver detalle: abre el modal de detalle */}
                            <button
                              type="button"
                              onClick={() => setDetalle(session)}
                              aria-label={`Ver detalle de ${session.asignaturaNombre}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              <Eye size={15} />
                            </button>
                            {/* Cancelar: valida el estado y abre la confirmación */}
                            <button
                              type="button"
                              onClick={() => solicitarCancelacion(session)}
                              aria-label={`Cancelar ${session.asignaturaNombre}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pie de la tabla: contador de registros mostrados */}
            <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground dark:border-[#2A4158]">
              Mostrando {filtradas.length} de {tutorias.length} registros
            </div>
          </section>
        </div>

        {/* ===== Columna derecha: calendario ===== */}
        <div className="space-y-5">
          <CalendarPanel tutorias={tutorias} />
        </div>
      </div>

      {/* ---------- Modal de detalle (solo si hay una sesión seleccionada) ---------- */}
      {detalle && (
        <DetalleModal sesion={detalle} onClose={() => setDetalle(null)} />
      )}

      {/* ---------- Modal de confirmación de cancelación ---------- */}
      {pendingCancel && (
        <ConfirmarCancelModal
          sesion={pendingCancel}
          enviando={cancelando}
          onConfirm={confirmarCancelacion}
          onClose={() => setPendingCancel(null)}
        />
      )}

      {/* ---------- Notificación flotante de éxito (sesión cancelada) ---------- */}
      {canceledId !== null && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-lg dark:border-[#2A4158]">
          <CheckCircle2 size={18} className="shrink-0 text-brand-teal" />
          <div>
            <p className="text-sm text-foreground">Sesión cancelada</p>
            <p className="text-xs text-muted-foreground">
              #{canceledId} — estado actualizado
            </p>
          </div>
          {/* Botón para cerrar el aviso manualmente */}
          <button
            type="button"
            onClick={() => setCanceledId(null)}
            aria-label="Cerrar notificación"
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ---------- Notificación flotante de error (acciones fallidas) ---------- */}
      {actionError && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-amber-200 bg-card px-5 py-4 text-amber-700 shadow-lg dark:border-amber-900/50 dark:text-amber-300"
          style={{ fontSize: "0.85rem" }}
        >
          <AlertTriangle size={18} className="shrink-0 text-amber-500" />
          <span>{actionError}</span>
          {/* Botón para cerrar el aviso manualmente */}
          <button
            type="button"
            onClick={() => setActionError(null)}
            aria-label="Cerrar aviso"
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
