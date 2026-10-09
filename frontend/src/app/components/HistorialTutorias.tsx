// IMPORTACIONES
// Hooks de React que usaremos
import { useCallback, useEffect, useMemo, useState } from "react";

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
import {
  historialEstudiante,
  cancelarSesion,
  type Sesion,
  type EstadoSesion,
} from "../lib/sesiones";
import { ApiError } from "../lib/api";

// Componentes reutilizables
import { VoiceSearchInput } from "./VoiceSearchInput";
import { QuickAccessNav, type QuickAccessTab } from "./QuickAccessNav";

// TIPOS Y CONSTANTES
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

// FUNCIONES AUXILIARES
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

// SUBCOMPONENTES AUXILIARES
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
      className="flex min-w-0 items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm dark:border-[#2A4158]"
      style={{ borderColor: active ? color : undefined }}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}1F`, color }}
      >
        <Icon size={19} />
      </span>
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

function DetalleModal({
  sesion,
  onClose,
}: {
  sesion: Sesion;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detalle-tutoria"
    >
      <button
        type="button"
        aria-label="Cerrar detalle"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl dark:border-[#2A4158]">
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
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
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

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: CalendarDays,
                label: "Fecha",
                value: formatFecha(sesion.fechaSesion),
              },
              {
                icon: Clock3,
                label: "Hora",
                value: formatHora(sesion.horaInicio),
              },
              { icon: FileText, label: "Código", value: `#${sesion.id}` },
              { icon: UserRound, label: "Tutor", value: sesion.tutorNombre },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-secondary p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <item.icon size={12} className="text-muted-foreground" />
                  <span
                    className="text-muted-foreground"
                    style={{ fontSize: "0.68rem", textTransform: "uppercase" }}
                  >
                    {item.label}
                  </span>
                </div>
                <p
                  className="text-card-foreground"
                  style={{ fontSize: "0.82rem" }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-secondary p-3">
            <p
              className="mb-1 text-muted-foreground"
              style={{ fontSize: "0.7rem", textTransform: "uppercase" }}
            >
              Observaciones del tutor
            </p>
            <p
              className="text-card-foreground"
              style={{ fontSize: "0.875rem", lineHeight: 1.6 }}
            >
              {sesion.observacionesTutor ??
                "Aún no hay observaciones registradas para esta sesión."}
            </p>
          </div>
        </div>

        <div className="px-6 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #1E3A8A, #3B82F6)" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancelar-tutoria"
    >
      <button
        type="button"
        aria-label="Cerrar confirmación"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-xl dark:border-[#2A4158]">
        <div className="space-y-4 px-6 pb-4 pt-6 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(239,68,68,0.1)" }}
          >
            <AlertTriangle size={26} className="text-destructive" />
          </div>
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
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm text-foreground hover:bg-secondary dark:border-[#2A4158]"
          >
            Volver
          </button>
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

function CalendarPanel({ tutorias }: { tutorias: Sesion[] }) {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const firstDay =
    (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const monthName = month.toLocaleDateString("es-SV", {
    month: "long",
    year: "numeric",
  });

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
    <section className="rounded-2xl border border-[#C9D8E6] bg-[#E5EEF6] p-3 dark:border-[#2A4158] dark:bg-[#182A3A] sm:p-4">
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
          <span className="min-w-24 text-center text-xs capitalize text-foreground">
            {monthName}
          </span>
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

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            className="py-0.5 text-[0.68rem] font-medium text-muted-foreground"
          >
            {day}
          </span>
        ))}
        {cells.map((day, index) => {
          if (!day)
            return <span key={`empty-${index}`} className="h-8 sm:h-9" />;
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
              className="relative flex h-8 flex-col items-center justify-center rounded-md border text-xs transition-colors hover:bg-secondary sm:h-9 dark:border-[#2A4158] dark:bg-[#1E2F42] dark:hover:bg-[#2A4158]"
              style={{
                borderColor: isSelected ? "#3578CE" : undefined,
                background: isSelected
                  ? "rgba(59,130,246,0.12)"
                  : isToday
                    ? "rgba(59,130,246,0.06)"
                    : undefined,
                color: isToday || isSelected ? "#2563EB" : undefined,
                fontWeight: isToday ? 700 : 400,
              }}
            >
              <span style={{ color: "#d6dee5" }}>{day}</span>
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
                        style={{ background: color }}
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

// COMPONENTE PRINCIPAL: HistorialTutorias
export function HistorialTutorias({ idEstudiante, onNavigate }: Props) {
  const [tutorias, setTutorias] = useState<Sesion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");
  const [detalle, setDetalle] = useState<Sesion | null>(null);
  const [pendingCancel, setPendingCancel] = useState<Sesion | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [canceledId, setCanceledId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setLoadError(null);
    historialEstudiante(idEstudiante)
      .then(setTutorias)
      .catch((error) =>
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "No se pudo cargar el historial.",
        ),
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
      await cancelarSesion(pendingCancel.id);
      setCanceledId(pendingCancel.id);
      setPendingCancel(null);
      setTimeout(() => setCanceledId(null), 4000);
      cargar();
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

  const solicitarCancelacion = (session: Sesion) => {
    if (session.estado === "PENDIENTE" || session.estado === "APROBADA") {
      setPendingCancel(session);
      return;
    }
    setActionError(
      "Solo puedes cancelar sesiones en estado Pendiente o Aprobada.",
    );
    window.setTimeout(() => setActionError(null), 4000);
  };

  const countBy = (estado: EstadoSesion) =>
    tutorias.filter((session) => session.estado === estado).length;

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

  const proximas = useMemo(
    () =>
      tutorias
        .filter(
          (session) =>
            (session.estado === "PENDIENTE" || session.estado === "APROBADA") &&
            fechaLocal(session.fechaSesion).getTime() >=
              new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
        )
        .sort((a, b) =>
          `${a.fechaSesion}${a.horaInicio}`.localeCompare(
            `${b.fechaSesion}${b.horaInicio}`,
          ),
        )
        .slice(0, 4),
    [tutorias],
  );

  if (cargando)
    return (
      <div className="flex w-full items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );

  if (loadError)
    return (
      <div className="w-full rounded-2xl border border-border bg-card p-8 text-center dark:border-[#2A4158]">
        <AlertTriangle size={24} className="mx-auto mb-2 text-destructive" />
        <p className="text-destructive" style={{ fontSize: "0.9rem" }}>
          {loadError}
        </p>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <QuickAccessNav activeTab="historial" onNavigate={onNavigate} />

      <div className="my-5">
        <h1 className="text-foreground" style={{ fontSize: "1.3rem" }}>
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

          <section className="overflow-hidden rounded-2xl border border-[#C9D8E6] bg-[#F8FBFD] dark:border-[#2A4158] dark:bg-[#1E2F42]">
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

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
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
                <tbody className="divide-y divide-border dark:divide-[#2A4158]">
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
                    filtradas.map((session) => (
                      <tr
                        key={session.id}
                        className="text-xs transition-colors hover:bg-[#EAF3F8] dark:hover:bg-[#2A4158]/40 [&>td]:text-xs [&_p]:text-xs"
                      >
                        <td className="px-5 py-3.5">
                          <p className="text-foreground">
                            {formatFecha(session.fechaSesion)}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="flex items-center gap-1 text-foreground">
                            <Clock3
                              size={12}
                              className="text-muted-foreground"
                            />
                            {formatHora(session.horaInicio)}
                          </p>
                        </td>
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
                        <td className="px-5 py-3.5 text-foreground">
                          {session.tutorNombre}
                        </td>
                        <td className="px-5 py-3.5">
                          <EstadoBadge estado={session.estado} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setDetalle(session)}
                              aria-label={`Ver detalle de ${session.asignaturaNombre}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              <Eye size={15} />
                            </button>
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

            <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground dark:border-[#2A4158]">
              Mostrando {filtradas.length} de {tutorias.length} registros
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <CalendarPanel tutorias={tutorias} />

          <section className="rounded-2xl border border-[#C9D8E6] bg-[#E5EEF6] p-4 dark:border-[#2A4158] dark:bg-[#182A3A] sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{
                    background: "rgba(16,185,129,0.12)",
                    color: "#16805F",
                  }}
                >
                  <CalendarDays size={19} />
                </span>
                <h2 className="text-foreground" style={{ fontSize: "1.05rem" }}>
                  Próximos eventos
                </h2>
              </div>
              <span className="text-xs text-brand-teal">
                {proximas.length} próximas
              </span>
            </div>
            <div className="divide-y divide-border dark:divide-[#2A4158]">
              {proximas.length === 0 ? (
                <p className="bg-[#F8FBFD] py-8 text-center text-sm text-muted-foreground dark:bg-[#1E2F42]">
                  No tienes eventos próximos.
                </p>
              ) : (
                proximas.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl"
                      style={{
                        background: ESTADO_CONFIG[session.estado].bg,
                        color: ESTADO_CONFIG[session.estado].color,
                      }}
                    >
                      <strong className="text-base leading-none">
                        {fechaLocal(session.fechaSesion).getDate()}
                      </strong>
                      <span className="mt-0.5 text-[0.62rem] uppercase">
                        {fechaLocal(session.fechaSesion).toLocaleDateString(
                          "es-SV",
                          { month: "short" },
                        )}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {session.asignaturaNombre}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 size={11} />
                        {formatHora(session.horaInicio)} –{" "}
                        {formatHora(session.horaFin)}
                      </p>
                    </div>
                    <EstadoBadge estado={session.estado} />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {detalle && (
        <DetalleModal sesion={detalle} onClose={() => setDetalle(null)} />
      )}

      {pendingCancel && (
        <ConfirmarCancelModal
          sesion={pendingCancel}
          enviando={cancelando}
          onConfirm={confirmarCancelacion}
          onClose={() => setPendingCancel(null)}
        />
      )}

      {canceledId !== null && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-lg dark:border-[#2A4158]">
          <CheckCircle2 size={18} className="shrink-0 text-brand-teal" />
          <div>
            <p className="text-sm text-foreground">Sesión cancelada</p>
            <p className="text-xs text-muted-foreground">
              #{canceledId} — estado actualizado
            </p>
          </div>
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

      {actionError && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-amber-200 bg-card px-5 py-4 text-amber-700 shadow-lg dark:border-amber-900/50 dark:text-amber-300"
          style={{ fontSize: "0.85rem" }}
        >
          <AlertTriangle size={18} className="shrink-0 text-amber-500" />
          <span>{actionError}</span>
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
