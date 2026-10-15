// =====================================================================
// IMPORTACIONES
// =====================================================================

// Hooks de React:
// - useCallback: memoriza una función para no recrearla en cada render
// - useEffect: ejecuta efectos secundarios (cargar datos)
// - useState: maneja el estado local del componente
import { useCallback, useEffect, useState } from "react";

// Iconos de la librería lucide-react
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  UserRound,
  Video,
} from "lucide-react";

// Clase de error personalizada para distinguir errores que vienen del backend
import { ApiError } from "../lib/api";

// Funciones y tipos de la capa de datos (API de sesiones)
// - cancelarSesion: cambia el estado de una sesión a CANCELADA
// - historialEstudiante: obtiene todas las sesiones de un estudiante
// - EstadoSesion / Sesion: tipos TypeScript del modelo de datos
import {
  cancelarSesion,
  historialEstudiante,
  type EstadoSesion,
  type Sesion,
} from "../lib/sesiones";

// Función que separa las sesiones en "próximas" y "vencidas" (pendientes de realizar)
import { sesionesAgenda } from "../lib/proximos";

// Barra de navegación rápida entre secciones
import { QuickAccessNav, type QuickAccessTab } from "./QuickAccessNav";

// =====================================================================
// TIPOS Y CONSTANTES
// =====================================================================

// Propiedades que recibe el componente principal
interface Props {
  idEstudiante: number; // ID del estudiante cuya agenda se consulta
  onVerHistorial: () => void; // Navega a la vista de historial
  onSolicitar: () => void; // Navega a la vista para solicitar una tutoría
  onNavigate: (tab: QuickAccessTab) => void; // Callback para cambiar de pestaña
}

// Sesión con campos opcionales extra (modalidad y enlace virtual)
// que pueden o no venir del backend
type EventoExtendido = Sesion & {
  modalidad?: "VIRTUAL" | "PRESENCIAL";
  enlaceVirtual?: string;
};

// Diccionario que asocia cada estado con su texto y colores:
// - label: texto mostrado al usuario
// - color: color del texto del badge
// - bg: color de fondo del badge (con transparencia)
const ESTADO_CONFIG: Record<
  EstadoSesion,
  { label: string; color: string; bg: string }
> = {
  PENDIENTE: {
    label: "Pendiente",
    color: "#B77908",
    bg: "rgba(245,158,11,0.14)",
  },
  APROBADA: {
    label: "Confirmada",
    color: "#16805F",
    bg: "rgba(34,197,139,0.15)",
  },
  COMPLETADA: {
    label: "Completada",
    color: "#6451B8",
    bg: "rgba(124,92,218,0.14)",
  },
  CANCELADA: {
    label: "Cancelada",
    color: "#C34B5A",
    bg: "rgba(239,68,68,0.12)",
  },
  RECHAZADA: {
    label: "Rechazada",
    color: "#C34B5A",
    bg: "rgba(239,68,68,0.12)",
  },
};

// =====================================================================
// FUNCIONES AUXILIARES
// =====================================================================

// Convierte una fecha "YYYY-MM-DD" a una fecha local.
// Se evita `new Date("YYYY-MM-DD")` porque lo interpreta como UTC y
// puede mostrar el día anterior en zonas horarias como la de El Salvador.
function fechaLocal(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Formatea la hora como "HH:MM".
function formatHora(value: string): string {
  return value.slice(0, 5);
}

// Obtiene la modalidad del evento.
// Si el backend no la envía, se asume PRESENCIAL por defecto.
function getModalidad(evento: Sesion): "VIRTUAL" | "PRESENCIAL" {
  return (evento as EventoExtendido).modalidad ?? "PRESENCIAL";
}

// Calcula los minutos que faltan para iniciar una sesión.
// Devuelve un valor negativo si la sesión ya comenzó.
function minutosHasta(evento: Sesion): number {
  const inicio = fechaLocal(evento.fechaSesion);
  const [hours, minutes] = evento.horaInicio.split(":").map(Number);

  // Combina la fecha con la hora de inicio de la sesión
  inicio.setHours(hours, minutes, 0, 0);

  // Diferencia en milisegundos convertida a minutos
  return (inicio.getTime() - Date.now()) / 60000;
}

// =====================================================================
// SUBCOMPONENTES AUXILIARES
// =====================================================================

// ---------------------------------------------------------------------
// FechaEvento: bloque visual con mes, día y día de la semana del evento
// ---------------------------------------------------------------------
// Componente de fecha para cada evento.
function FechaEvento({ fecha }: { fecha: string }) {
  const date = fechaLocal(fecha);

  return (
    <div
      className="flex w-full shrink-0 items-center gap-3 rounded-xl px-3 py-2 sm:w-16 sm:flex-col sm:gap-0 sm:px-2 sm:py-2.5"
      style={{
        background: "rgba(59,130,246,0.1)",
        color: "#2563EB",
      }}
    >
      {/* Mes abreviado (se quita el punto, ej. "oct.") */}
      <span className="text-xs font-semibold uppercase">
        {date.toLocaleDateString("es-SV", { month: "short" }).replace(".", "")}
      </span>

      {/* Número del día */}
      <strong
  className="text-2xl leading-none sm:mt-1"
  style={{ color: "#2563EB" }}
>
  {date.getDate()}
</strong>

      {/* Día de la semana abreviado */}
      <span className="text-xs capitalize sm:mt-1">
        {date
          .toLocaleDateString("es-SV", { weekday: "short" })
          .replace(".", "")}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------
// TarjetaEvento: tarjeta individual de una sesión de tutoría.
// Muestra datos de la sesión y el botón de acción correspondiente
// (Unirse o Cancelar).
// ---------------------------------------------------------------------
// Tarjeta individual de una sesión de tutoría.
function TarjetaEvento({
  evento,
  onCancel,
  cancelando,
}: {
  evento: Sesion; // Sesión a mostrar
  onCancel: () => void; // Acción al presionar "Cancelar"
  cancelando: boolean; // true mientras se procesa la cancelación de esta sesión
}) {
  // ---------- Datos derivados ----------
  const config = ESTADO_CONFIG[evento.estado]; // Colores y texto del estado
  const modalidad = getModalidad(evento);

  // El botón "Unirse" solo aparece en sesiones virtuales
  // cuando faltan menos de 10 minutos para que inicien
  const puedeUnirse =
    modalidad === "VIRTUAL" &&
    minutosHasta(evento) >= 0 &&
    minutosHasta(evento) < 10;

  // Enlace de la reunión virtual (si existe)
  const enlace = (evento as EventoExtendido).enlaceVirtual;

  // Solo se pueden cancelar sesiones PENDIENTE o APROBADA
  const puedeCancelar =
    evento.estado === "PENDIENTE" || evento.estado === "APROBADA";

  return (
    <article className="rounded-2xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* ---------- Bloque de fecha (izquierda) ---------- */}
        <FechaEvento fecha={evento.fechaSesion} />

        {/* ---------- Información de la sesión (centro) ---------- */}
        <div className="min-w-0 flex-1">
          {/* Asignatura y badge de estado */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3
              className="min-w-0 truncate font-semibold text-foreground"
              title={evento.asignaturaNombre}
            >
              {evento.asignaturaNombre}
            </h3>

            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                color: config.color,
                background: config.bg,
              }}
            >
              {config.label}
            </span>
          </div>

          {/* Detalles: tutor, horario y modalidad */}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {/* Nombre del tutor */}
            <span className="flex min-w-0 items-center gap-1.5">
              <UserRound size={14} className="shrink-0" />
              <span className="truncate">{evento.tutorNombre}</span>
            </span>

            {/* Hora de inicio y fin */}
            <span className="flex items-center gap-1.5">
              <Clock3 size={14} className="shrink-0" />
              {formatHora(evento.horaInicio)} – {formatHora(evento.horaFin)}
            </span>

            {/* Modalidad: icono de video si es virtual, de ubicación si es presencial */}
            <span className="flex items-center gap-1.5">
              {modalidad === "VIRTUAL" ? (
                <Video size={14} />
              ) : (
                <MapPin size={14} />
              )}

              {modalidad === "VIRTUAL" ? "Virtual" : "Presencial"}
            </span>
          </div>
        </div>

        {/* ---------- Acciones (derecha) ---------- */}
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
          {puedeUnirse ? (
            // Botón "Unirse": enlace a la reunión virtual
            <a
              href={enlace ?? "#"}
              target={enlace ? "_blank" : undefined}
              rel={enlace ? "noreferrer" : undefined}
              // Si no hay enlace, se evita que el clic navegue a "#"
              onClick={(event) => {
                if (!enlace) {
                  event.preventDefault();
                }
              }}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98] sm:flex-none"
              style={{
                background: "linear-gradient(135deg, #1E3A8A, #3B82F6)",
              }}
            >
              <ExternalLink size={15} />
              Unirse
            </a>
          ) : puedeCancelar ? (
            // Botón "Cancelar": se deshabilita y muestra spinner mientras se procesa
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelando}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-500 transition-all hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:hover:bg-red-950/20 sm:flex-none"
            >
              {cancelando && <Loader2 size={15} className="animate-spin" />}
              Cancelar
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

// =====================================================================
// COMPONENTE PRINCIPAL: ProximosEventos
// Muestra la agenda del estudiante: tutorías próximas y pendientes
// de realizar, con la opción de cancelarlas o unirse a ellas.
// =====================================================================
export function ProximosEventos({
  idEstudiante,
  onVerHistorial,
  onSolicitar,
  onNavigate,
}: Props) {
  // -------------------------------------------------------------------
  // ESTADOS
  // -------------------------------------------------------------------
  const [sesiones, setSesiones] = useState<Sesion[]>([]); // Todas las sesiones del estudiante
  const [cargando, setCargando] = useState(true); // true mientras se cargan los datos
  const [error, setError] = useState<string | null>(null); // Mensaje de error a mostrar
  const [cancelando, setCancelando] = useState<number | null>(null); // ID de la sesión que se está cancelando

  // -------------------------------------------------------------------
  // CARGA DE DATOS
  // -------------------------------------------------------------------
  // Pide las sesiones al backend. Se memoriza con useCallback para poder
  // reutilizarla (al montar, al reintentar y después de cancelar).
  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);

    historialEstudiante(idEstudiante)
      .then(setSesiones) // Guarda las sesiones recibidas
      .catch((err) =>
        // Si es un ApiError se muestra su mensaje; si no, uno genérico
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar la agenda.",
        ),
      )
      .finally(() => setCargando(false)); // Siempre se quita el estado de carga
  }, [idEstudiante]);

  // Carga la agenda al montar el componente (o si cambia el estudiante)
  useEffect(() => {
    cargar();
  }, [cargar]);

  // -------------------------------------------------------------------
  // DATOS DERIVADOS
  // -------------------------------------------------------------------
  // Separa las sesiones en próximas y vencidas (pendientes de realizar)
  const { proximas, vencidas } = sesionesAgenda(sesiones);
  const eventos = [...proximas, ...vencidas];
  const vacia = eventos.length === 0; // true si no hay ninguna sesión para mostrar

  // -------------------------------------------------------------------
  // ACCIÓN: CANCELAR SESIÓN
  // -------------------------------------------------------------------
  const cancelar = async (evento: Sesion) => {
    setCancelando(evento.id); // Marca cuál sesión se está cancelando

    try {
      await cancelarSesion(evento.id); // Llamada al backend
      cargar(); // Recarga la agenda para reflejar el cambio
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo cancelar la sesión.",
      );
    } finally {
      setCancelando(null);
    }
  };

  // -------------------------------------------------------------------
  // RENDERIZADO PRINCIPAL
  // -------------------------------------------------------------------
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      {/* ---------- Navegación rápida entre secciones ---------- */}
      <QuickAccessNav activeTab="eventos" onNavigate={onNavigate} />

      {/* ---------- Título de la página ---------- */}
      <div className="mb-6">
        <div className="mx-auto w-full max-w-4xl space-y-1">
          <h1
            className="text-foreground"
            style={{
              fontSize: "1.4rem",
              fontWeight: 500,
              lineHeight: 1.3,
            }}
          >
            Revisa las tutorías pendientes y confirmadas en un solo lugar
          </h1>
        </div>
      </div>

      {/* ---------- Estado: cargando ---------- */}
      {cargando && (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-16">
          <Loader2 size={25} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ---------- Estado: error (con botón para reintentar) ---------- */}
      {!cargando && error && (
        <div
          role="alert"
          className="rounded-2xl border border-border bg-card p-7 text-center"
        >
          <AlertTriangle size={24} className="mx-auto mb-2 text-destructive" />

          <p className="text-destructive" style={{ fontSize: "0.9rem" }}>
            {error}
          </p>

          <button
            type="button"
            onClick={cargar}
            className="mt-4 min-h-11 rounded-xl border border-[#118AB2] px-4 py-2.5 text-sm font-medium text-[#118AB2] transition-all hover:bg-[#118AB2] hover:text-white"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ---------- Estado: vacío (no hay sesiones próximas) ---------- */}
      {!cargando && !error && vacia && (
        <div className="rounded-2xl border border-border bg-card p-7 text-center sm:p-10">
          {/* Icono decorativo */}
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              background: "rgba(17,138,178,0.10)",
              color: "#118AB2",
            }}
          >
            <CalendarDays size={38} />
          </div>

          {/* Mensaje principal */}
          <h2 className="mt-5 text-foreground" style={{ fontSize: "1.15rem" }}>
            ¡Todo al día!
          </h2>

          <p
            className="mx-auto mt-2 max-w-md text-muted-foreground"
            style={{
              fontSize: "0.86rem",
              lineHeight: 1.6,
            }}
          >
            No tienes sesiones próximas. Cuando una tutoría sea aprobada,
            aparecerá aquí con su fecha y horario.
          </p>

          {/* Botones de acción: solicitar tutoría / ver tutores */}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onSolicitar}
              className="min-h-11 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #1E3A8A, #3B82F6)",
              }}
            >
              + Solicitar tutoría
            </button>

            <button
              type="button"
              onClick={onSolicitar}
              className="min-h-11 rounded-xl border border-[#118AB2] px-5 py-2.5 text-sm font-medium text-[#118AB2] transition-all hover:bg-[#118AB2] hover:text-white"
            >
              Ver tutores
            </button>
          </div>
        </div>
      )}

      {/* ---------- Estado: lista de sesiones ---------- */}
      {!cargando && !error && !vacia && (
        <div className="mx-auto w-full max-w-4xl space-y-3">
          {/* Sesiones próximas */}
          {proximas.length > 0 &&
            proximas.map((evento) => (
              <TarjetaEvento
                key={evento.id}
                evento={evento}
                onCancel={() => cancelar(evento)}
                cancelando={cancelando === evento.id}
              />
            ))}

          {/* Sesiones vencidas, bajo su propio subtítulo */}
          {vencidas.length > 0 && (
            <>
              <p className="pt-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Pendientes de realizar
              </p>
              {vencidas.map((evento) => (
                <TarjetaEvento
                  key={evento.id}
                  evento={evento}
                  onCancel={() => cancelar(evento)}
                  cancelando={cancelando === evento.id}
                />
              ))}
            </>
          )}

          {/* Botón alineado con las tarjetas */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onVerHistorial}
              className="min-h-11 rounded-xl border border-[#118AB2] px-4 py-2.5 text-sm font-medium text-[#118AB2] transition-all hover:bg-[#118AB2] hover:text-white"
            >
              Ver todas mis tutorías
            </button>
          </div>
        </div>
      )}
    </div>
  );
}