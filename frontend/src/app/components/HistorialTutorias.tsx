// =====================================================================
// IMPORTACIONES
// =====================================================================
import { useCallback, useEffect, useState } from "react";
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
  X,
} from "lucide-react";

import {
  historialEstudiante,
  cancelarSesion,
  type Sesion,
  type EstadoSesion,
} from "../lib/sesiones";
import { ApiError } from "../lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

// Componentes reutilizables
// - VoiceSearchInput: campo de búsqueda con soporte de voz
// - QuickAccessNav: barra de navegación rápida entre secciones
import { VoiceSearchInput } from "./VoiceSearchInput";
import { QuickAccessNav, type QuickAccessTab } from "./QuickAccessNav";

// =====================================================================
// TIPOS Y CONSTANTES
// =====================================================================

interface Props {
  idEstudiante: number;
  onNavigate: (tab: QuickAccessTab) => void;
}

type EstadoConfig = { label: string; color: string; bg: string; dot: string };

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

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// =====================================================================
// FUNCIONES AUXILIARES
// =====================================================================

function fechaLocal(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function fechaKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatFecha(value: string): string {
  return fechaLocal(value).toLocaleDateString("es-SV", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatHora(value: string): string {
  return value.slice(0, 5);
}

function normalizarBusqueda(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// =====================================================================
// SUBCOMPONENTES AUXILIARES
// =====================================================================

function EstadoBadge({ estado }: { estado: EstadoSesion }) {
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
      className={`flex min-w-0 items-center gap-3 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
        active
          ? "border-[#118AB2] bg-[#118AB2]/5 dark:bg-[#118AB2]/10 shadow-sm"
          : "border-border bg-card dark:border-[#2A4158]"
      }`}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}15`, color }}
      >
        <Icon size={19} />
      </span>
      <span className="min-w-0">
        <strong className="block text-xl text-foreground" style={{ lineHeight: 1.1 }}>
          {count}
        </strong>
        <span className="mt-1 block truncate text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </span>
    </button>
  );
}

function DetalleModal({ sesion, onClose }: { sesion: Sesion; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Cerrar detalle"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl dark:border-[#2A4158] dark:bg-[#192B3B]">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 dark:border-[#2A4158]">
          <div className="flex items-center gap-2.5">
            <FileText size={16} className="text-[#118AB2]" />
            <h2 className="text-card-foreground font-semibold" style={{ fontSize: "0.95rem" }}>
              Detalle de Tutoría
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-muted-foreground hover:text-[#118AB2] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-card-foreground font-medium">{sesion.asignaturaNombre}</p>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.82rem" }}>
                {sesion.tutorNombre}
              </p>
            </div>
            <EstadoBadge estado={sesion.estado} />
          </div>

          <div className="rounded-xl border border-border/50 bg-secondary/50 p-3 dark:border-[#2A4158] dark:bg-[#1F2937]">
            <p className="mb-1 text-muted-foreground font-medium" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
              Observaciones del tutor
            </p>
            <p className="text-card-foreground" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
              {sesion.observacionesTutor ?? "Aún no hay observaciones registradas para esta sesión."}
            </p>
          </div>

          {sesion.estado === "COMPLETADA" && (
            <div className="rounded-xl border border-border/50 bg-secondary/50 p-3 dark:border-[#2A4158] dark:bg-[#1F2937]">
              <p className="mb-1 text-muted-foreground font-medium" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                Nota obtenida
              </p>
              <p className="text-card-foreground" style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                {sesion.calificacionProgreso !== null && sesion.calificacionProgreso !== undefined
                  ? sesion.calificacionProgreso.toFixed(1)
                  : "Aún no registrada"}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-white transition-all hover:bg-[#0E7490] active:scale-[0.98]"
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
// Modal de confirmación con los colores ajustados
// ---------------------------------------------------------------------
function ConfirmarCancelModal({
  sesion,
  onConfirm,
  onClose,
  enviando,
}: {
  sesion: Sesion;
  onConfirm: () => void;
  onClose: () => void;
  enviando: boolean;
}) {
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !enviando) onClose();
      }}
    >
      <AlertDialogContent className="max-w-md rounded-2xl border-border bg-card shadow-2xl">
        <AlertDialogHeader>
          <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={22} aria-hidden="true" />
          </div>
          <AlertDialogTitle>¿Cancelar esta tutoría?</AlertDialogTitle>
          <AlertDialogDescription>
            La tutoría de {sesion.asignaturaNombre} se cancelará y se notificará
            al tutor. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={enviando}
            className="border-[#118AB2]/40 bg-[#118AB2]/5 text-[#0B6685] transition-colors hover:border-[#118AB2] hover:bg-[#118AB2]/15 hover:text-[#084C63] focus-visible:ring-[#118AB2]/40 dark:text-[#67D3EA] dark:hover:text-[#9BE5F4]"
          >
            Volver
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={enviando}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {enviando ? (
              <>
                <Loader2 size={15} className="mr-2 animate-spin" />
                Cancelando...
              </>
            ) : (
              "Sí, cancelar tutoría"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CalendarPanel({ tutorias }: { tutorias: Sesion[] }) {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDay = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const monthName = month.toLocaleDateString("es-SV", { month: "long", year: "numeric" });

  const sessionsByDate = new Map<string, Sesion[]>();
  tutorias.forEach((sesion) => {
    const sessions = sessionsByDate.get(sesion.fechaSesion) ?? [];
    sessions.push(sesion);
    sessionsByDate.set(sesion.fechaSesion, sessions);
  });

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-4 dark:border-[#2A4158] dark:bg-[#192B3B]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#118AB2]/10 text-[#118AB2]">
            <CalendarDays size={17} />
          </span>
          <h2 className="text-foreground font-semibold" style={{ fontSize: "1rem" }}>
            Calendario
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-24 text-center text-sm font-medium capitalize text-foreground">
            {monthName}
          </span>
          <button
            type="button"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-1 text-[0.7rem] font-semibold text-muted-foreground">
            {day}
          </span>
        ))}
        {cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} className="h-9" />;
          const date = new Date(month.getFullYear(), month.getMonth(), day);
          const key = fechaKey(date);
          const sessions = sessionsByDate.get(key) ?? [];
          const isToday = key === fechaKey(new Date());
          const isSelected = selectedDate === key;

          return (
            <button
              type="button"
              key={key}
              onClick={() => setSelectedDate(isSelected ? null : key)}
              className={`
                relative flex h-9 flex-col items-center justify-center rounded-lg border text-xs transition-colors
                ${
                  isSelected
                    ? "border-[#118AB2] bg-[#118AB2] text-white shadow-sm"
                    : isToday
                      ? "border-[#118AB2] bg-[#118AB2]/10 text-[#118AB2] font-bold dark:bg-[#118AB2]/20"
                      : "border-transparent hover:border-[#118AB2]/30 hover:bg-secondary dark:hover:bg-[#2A4158]"
                }
              `}
            >
              <span className={isSelected ? "font-semibold text-white" : undefined}>
                {day}
              </span>
              {sessions.length > 0 && (
                <span className="mt-0.5 flex gap-0.5">
                  {Array.from(new Set(sessions.map((s) => ESTADO_CONFIG[s.estado].dot)))
                    .slice(0, 3)
                    .map((color) => (
                      <i
                        key={color}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: isSelected ? "#FFFFFF" : color }}
                      />
                    ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground dark:border-[#2A4158]">
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full" style={{ background: "#F59E0B" }} />
          Pendiente
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full" style={{ background: "#3B82F6" }} />
          Aprobada
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full" style={{ background: "#11CAA0" }} />
          Completada
        </span>
      </div>
    </section>
  );
}

// =====================================================================
// COMPONENTE PRINCIPAL
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
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null); // Error al intentar cancelar

  const cargar = useCallback(() => {
    setCargando(true);
    setLoadError(null);
    historialEstudiante(idEstudiante)
      .then(setTutorias)
      .catch((error) =>
        setLoadError(error instanceof ApiError ? error.message : "No se pudo cargar el historial.")
      )
      .finally(() => setCargando(false));
  }, [idEstudiante]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const confirmarCancelacion = async () => {
    if (!pendingCancel) return;
    setCancelando(true);
    setActionError(null);
    try {
      await cancelarSesion(pendingCancel.id); // Llamada al backend
      setMensajeExito(
        `La tutoría de ${pendingCancel.asignaturaNombre} se canceló correctamente.`,
      );
      setPendingCancel(null); // Cierra el modal de confirmación
      setTimeout(() => setMensajeExito(null), 3500);
      cargar(); // Recarga la lista para reflejar el nuevo estado
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "No se pudo cancelar la sesión.");
    } finally {
      setCancelando(false);
    }
  };

  const solicitarCancelacion = (session: Sesion) => {
    if (session.estado === "PENDIENTE" || session.estado === "APROBADA") {
      setPendingCancel(session);
      return;
    }
    setActionError("Solo puedes cancelar sesiones en estado Pendiente o Aprobada.");
    window.setTimeout(() => setActionError(null), 4000);
  };

  const countBy = (estado: EstadoSesion) => tutorias.filter((session) => session.estado === estado).length;

  const filtradas = tutorias.filter((session) => {
    const search = normalizarBusqueda(busqueda.trim());
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
    return (
      searchableText.includes(search) &&
      (filtroEstado === "Todos" || session.estado === filtroEstado)
    );
  });

  if (cargando) {
    return (
      <div className="flex w-full items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#118AB2]" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full rounded-2xl border border-border bg-card p-8 text-center dark:border-[#2A4158]">
        <AlertTriangle size={24} className="mx-auto mb-2 text-destructive" />
        <p className="text-destructive" style={{ fontSize: "0.9rem" }}>
          {loadError}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <QuickAccessNav activeTab="historial" onNavigate={onNavigate} />

      <div className="my-5">
        <h1 className="text-foreground font-semibold tracking-tight" style={{ fontSize: "1.4rem" }}>
          Consulta tu historial y prepárate para tus próximas tutorías
        </h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)] xl:items-start">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Pendientes"
              count={countBy("PENDIENTE")}
              icon={Clock}
              color="#F59E0B"
              active={filtroEstado === "PENDIENTE"}
              onClick={() => setFiltroEstado(filtroEstado === "PENDIENTE" ? "Todos" : "PENDIENTE")}
            />
            <SummaryCard
              label="Aprobadas"
              count={countBy("APROBADA")}
              icon={CalendarCheck}
              color="#3B82F6"
              active={filtroEstado === "APROBADA"}
              onClick={() => setFiltroEstado(filtroEstado === "APROBADA" ? "Todos" : "APROBADA")}
            />
            <SummaryCard
              label="Completadas"
              count={countBy("COMPLETADA")}
              icon={CheckCheck}
              color="#11CAA0"
              active={filtroEstado === "COMPLETADA"}
              onClick={() => setFiltroEstado(filtroEstado === "COMPLETADA" ? "Todos" : "COMPLETADA")}
            />
          </div>

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-[#2A4158] dark:bg-[#192B3B]">
            <div className="flex flex-col gap-3 border-b border-border bg-secondary/30 p-4 dark:border-[#2A4158] dark:bg-[#1F2937] sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-center gap-2.5">
                <History size={20} className="text-[#118AB2]" />
                <h2 className="text-foreground font-semibold" style={{ fontSize: "1.05rem" }}>
                  Mi historial
                </h2>
              </div>
              <div className="flex gap-2">
                <VoiceSearchInput
                  value={busqueda}
                  onChange={setBusqueda}
                  placeholder="Buscar..."
                  className="min-w-0 flex-1 sm:w-64"
                  style={
                    {
                      fontSize: "0.85rem",
                      borderColor: "#118AB2",
                      "--tw-ring-color": "#118AB2",
                      background: "var(--input-background)",
                    } as React.CSSProperties
                  }
                />
                <div className="relative">
                  <select
                    value={filtroEstado}
                    onChange={(event) => setFiltroEstado(event.target.value)}
                    aria-label="Filtrar por estado"
                    className="h-full appearance-none rounded-xl border border-[#118AB2] bg-input-background px-3 py-2 pr-8 text-sm text-foreground outline-none transition-all focus:border-[#118AB2] focus:ring-2 focus:ring-[#118AB2]"
                  >
                    <option value="Todos">Filtrar por estado</option>
                    {Object.keys(ESTADO_CONFIG).map((estado) => (
                      <option key={estado} value={estado}>
                        {ESTADO_CONFIG[estado as EstadoSesion].label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Tarjetas para móviles */}
            <ul className="divide-y divide-border lg:hidden dark:divide-[#2A4158]" aria-label="Mis tutorías">
              {filtradas.length === 0 ? (
                <li className="py-10 text-center text-sm text-muted-foreground">No se encontraron tutorías</li>
              ) : (
                filtradas.map((session) => (
                  <li key={session.id} className="space-y-3 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {session.asignaturaNombre}{" "}
                          <span className="text-xs font-normal text-muted-foreground">#{session.id}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFecha(session.fechaSesion)} · {formatHora(session.horaInicio)} · {session.tutorNombre}
                        </p>
                      </div>
                      <EstadoBadge estado={session.estado} />
                    </div>
                    <div className="flex gap-2 [&>button]:flex-1">
                      <button
                        type="button"
                        onClick={() => setDetalle(session)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm text-foreground transition-colors hover:bg-secondary"
                      >
                        <Eye size={15} aria-hidden="true" /> Ver detalle
                      </button>
                      {(session.estado === "PENDIENTE" || session.estado === "APROBADA") && (
                        <button
                          type="button"
                          onClick={() => solicitarCancelacion(session)}
                          aria-label={`Cancelar ${session.asignaturaNombre}`}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm text-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 size={15} aria-hidden="true" /> Cancelar
                        </button>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>

            {/* Tabla para escritorio */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/20 dark:border-[#2A4158] dark:bg-[#1F2937]">
                    {["Fecha", "Hora", "Asignatura", "Tutor", "Estado", "Acciones"].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-[#2A4158]">
                  {filtradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                        No se encontraron tutorías
                      </td>
                    </tr>
                  ) : (
                    filtradas.map((session) => (
                      <tr
                        key={session.id}
                        className="text-xs transition-colors hover:bg-secondary/50 dark:hover:bg-[#24394D] [&>td]:text-xs [&_p]:text-xs"
                      >
                        <td className="px-5 py-3.5 text-foreground">
                          {formatFecha(session.fechaSesion)}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="flex items-center gap-1.5 text-foreground">
                            <Clock3 size={13} className="text-muted-foreground" />
                            {formatHora(session.horaInicio)}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="font-medium text-foreground">{session.asignaturaNombre}</span>
                            <span className="text-muted-foreground">#{session.id}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-foreground">{session.tutorNombre}</td>
                        <td className="px-5 py-3.5">
                          <EstadoBadge estado={session.estado} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setDetalle(session)}
                              aria-label={`Ver detalle de ${session.asignaturaNombre}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-[#118AB2]"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => solicitarCancelacion(session)}
                              aria-label={`Cancelar ${session.asignaturaNombre}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground dark:border-[#2A4158]">
              Mostrando {filtradas.length} de {tutorias.length} registros
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <CalendarPanel tutorias={tutorias} />
        </div>
      </div>

      {detalle && <DetalleModal sesion={detalle} onClose={() => setDetalle(null)} />}

      {pendingCancel && (
        <ConfirmarCancelModal
          sesion={pendingCancel}
          enviando={cancelando}
          onConfirm={confirmarCancelacion}
          onClose={() => setPendingCancel(null)}
        />
      )}

      {/* ---------- Notificación flotante de éxito (sesión cancelada) ---------- */}
      {mensajeExito && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex max-w-[calc(100vw-3rem)] items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-700 shadow-lg dark:text-emerald-400"
        >
          <CheckCircle2 size={18} className="shrink-0" />
          <p className="text-sm">{mensajeExito}</p>
          {/* Botón para cerrar el aviso manualmente */}
          <button
            type="button"
            onClick={() => setMensajeExito(null)}
            aria-label="Cerrar notificación"
            className="ml-2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-card px-5 py-4 text-red-600 shadow-xl dark:border-red-900/50 dark:text-red-400"
          style={{ fontSize: "0.85rem" }}
        >
          <AlertTriangle size={18} className="shrink-0 text-red-500" />
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            aria-label="Cerrar aviso"
            className="ml-2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}