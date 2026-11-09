// Hooks de React: efectos secundarios, valores memorizados y estado local
import { useEffect, useMemo, useState } from "react";
// Íconos de la librería lucide-react usados en KPIs y alertas
import {
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Eye,
  Users,
  UserRound,
  XCircle,
} from "lucide-react";
// Helper para consumir la API del backend (agrega base URL, headers, etc.)
import { apiFetch } from "../lib/api";
// Tipo que describe una sesión de tutoría tal como la devuelve /sesiones
import type { Sesion } from "../lib/sesiones";

// Forma de la respuesta del endpoint /reportes/dashboard
type Dashboard = {
  sesiones: number; // total de sesiones registradas
  tutoresActivos: number; // cantidad de tutores activos
  estudiantesActivos: number; // cantidad de estudiantes activos
  asignaturasActivas: number; // cantidad de asignaturas activas
  // Últimos movimientos del sistema para la tabla de actividad
  actividadReciente: Array<{
    idSesion: number;
    estado: string; // PENDIENTE | APROBADA | RECHAZADA | COMPLETADA | CANCELADA
    estudiante: string;
    tutor: string;
    asignatura: string;
    fecha: string;
    hora: string;
  }>;
};

// Configuración de las 4 tarjetas de indicadores (KPI).
// `key` debe coincidir con una propiedad numérica de `Dashboard`.
const kpiItems = [
  {
    key: "sesiones",
    label: "Sesiones registradas",
    icon: CalendarCheck,
    tone: "blue",
  },
  {
    key: "tutoresActivos",
    label: "Tutores activos",
    icon: Users,
    tone: "green",
  },
  {
    key: "estudiantesActivos",
    label: "Estudiantes activos",
    icon: UserRound,
    tone: "violet",
  },
  {
    key: "asignaturasActivas",
    label: "Asignaturas activas",
    icon: BookOpen,
    tone: "amber",
  },
] as const;

// Clases de Tailwind por tono: fondo translúcido + color del ícono
const toneClasses: Record<string, string> = {
  blue: "bg-blue-400/10 text-blue-400",
  green: "bg-green-400/10 text-green-400",
  violet: "bg-violet-400/10 text-violet-400",
  amber: "bg-amber-400/10 text-amber-400",
  red: "bg-red-400/10 text-red-400",
} as const;

// Texto legible para cada estado de sesión que viene del backend
const statusLabels: Record<string, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

// Colores (texto y fondo translúcido) de la etiqueta de cada estado
const statusStyles: Record<string, { color: string; background: string }> = {
  PENDIENTE: { color: "#F59E0B", background: "rgba(245,158,11,0.12)" },
  APROBADA: { color: "#3B82F6", background: "rgba(59,130,246,0.12)" },
  COMPLETADA: { color: "#10B981", background: "rgba(16,185,129,0.12)" },
  CANCELADA: { color: "#6B7280", background: "rgba(122,144,184,0.12)" },
  RECHAZADA: { color: "#EF4444", background: "rgba(239,68,68,0.12)" },
};

// Devuelve la fecha de hoy como "YYYY-MM-DD" (hora local),
// el mismo formato de `sesion.fechaSesion`, para poder compararlas.
function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// Recorta una hora "HH:MM:SS" a "HH:MM"
function formatTime(value: string): string {
  return value.slice(0, 5);
}

// Convierte una hora 24 h ("HH:MM[:SS]") a formato 12 h con "a. m." / "p. m."
function formatHour(value: string): string {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  const period = hours >= 12 ? "p. m." : "a. m.";
  // 0 y 12 se muestran como 12 en formato de 12 horas
  const hour12 = hours % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
}

// Obtiene el estilo de la etiqueta según el estado;
// si el estado es desconocido usa un gris neutro por defecto.
function statusStyle(estado: string) {
  return (
    statusStyles[estado] ?? {
      color: "#A8B7C8",
      background: "rgba(168,183,200,0.12)",
    }
  );
}

// Encabezado reutilizable de cada panel: título a la izquierda
// y un detalle opcional (p. ej. "3 programadas") a la derecha.
function SectionHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
      <div className="flex items-center gap-2.5">
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
      </div>
      {detail && (
        <span className="text-[11px] text-muted-foreground">{detail}</span>
      )}
    </div>
  );
}

// Componente principal: dashboard de la coordinación académica
export function DashboardCoord() {
  // Datos agregados del dashboard (KPIs + actividad reciente); null mientras carga
  const [data, setData] = useState<Dashboard | null>(null);
  // Listado completo de sesiones, usado para calcular "hoy" y las alertas
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [sesionDetalle, setSesionDetalle] = useState<Sesion | null>(null);
  // Mensaje de error si alguna petición falla
  const [error, setError] = useState("");

  // Al montar el componente, carga ambos recursos en paralelo
  useEffect(() => {
    Promise.all([
      apiFetch<Dashboard>("/reportes/dashboard"),
      apiFetch<Sesion[]>("/sesiones"),
    ])
      .then(([dashboard, allSesiones]) => {
        setData(dashboard);
        setSesiones(allSesiones);
      })
      .catch((e) =>
        // Si es un Error usa su mensaje; si no, un texto genérico
        setError(
          e instanceof Error ? e.message : "No se pudo cargar el dashboard",
        ),
      );
  }, []);

  // Tutorías de hoy: sesiones con fecha de hoy y estado PENDIENTE o APROBADA,
  // ordenadas por hora de inicio. Se recalcula solo cuando cambia `sesiones`.
  const sesionesHoy = useMemo(
    () =>
      sesiones
        .filter(
          (sesion) =>
            sesion.fechaSesion === todayKey() &&
            ["PENDIENTE", "APROBADA"].includes(sesion.estado),
        )
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
    [sesiones],
  );

  // Alertas para la coordinación, derivadas de las sesiones
  const alertas = useMemo(() => {
    // Solicitudes que aún esperan revisión
    const pendientes = sesiones.filter(
      (sesion) => sesion.estado === "PENDIENTE",
    );
    // Sesiones activas (pendientes/aprobadas) que no tienen horario asignado
    const sinHorario = sesiones.filter(
      (sesion) =>
        ["PENDIENTE", "APROBADA"].includes(sesion.estado) &&
        sesion.idHorario === null,
    );
    // Sesiones completadas a las que falta registrar la asistencia
    const seguimiento = sesiones.filter(
      (sesion) => sesion.estado === "COMPLETADA" && sesion.asistencia === null,
    );

    // Cada alerta lleva su ícono, tono, textos (con singular/plural)
    // y `visible` para mostrarla solo si hay casos que atender.
    return [
      {
        icon: XCircle,
        tone: "red",
        title: `${pendientes.length} solicitud${pendientes.length === 1 ? "" : "es"} de tutoría pendiente${pendientes.length === 1 ? "" : "s"}`,
        detail: "Requieren revisión y asignación",
        visible: pendientes.length > 0,
      },
      {
        icon: UserRound,
        tone: "amber",
        title: `${sinHorario.length} tutoría${sinHorario.length === 1 ? "" : "s"} sin horario`,
        detail: "Revisar disponibilidad",
        visible: sinHorario.length > 0,
      },
      {
        icon: CheckCircle2,
        tone: "blue",
        title: `${seguimiento.length} sesión${seguimiento.length === 1 ? "" : "es"} por dar seguimiento`,
        detail: "Completar asistencia y resultado",
        visible: seguimiento.length > 0,
      },
    ].filter((alerta) => alerta.visible); // descarta las alertas sin casos
  }, [sesiones]);

  return (
    // Contenedor centrado con ancho máximo y separación vertical entre secciones
    <div className="mx-auto w-full max-w-[1180px] space-y-5 text-foreground">
      {/* Encabezado: título de la vista y fecha actual */}
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[25px]">
            Resumen operativo para coordinación académica
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {/* Fecha completa en español de El Salvador (p. ej. "sábado, 7 de noviembre de 2026") */}
          {new Intl.DateTimeFormat("es-SV", { dateStyle: "full" }).format(
            new Date(),
          )}
        </p>
      </header>

      {/* Banner de error: solo aparece si falló alguna petición */}
      {error && (
        <div className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Indicadores (KPI): 2 columnas en pantallas pequeñas, 4 en xl */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpiItems.map(({ key, label, icon: Icon, tone }) => (
          <div
            key={key}
            className="flex min-h-[72px] items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 shadow-lg shadow-black/10 dark:border-[#30465C] dark:bg-[#192B3B] sm:px-3.5"
          >
            {/* Ícono con fondo del color del tono */}
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}
            >
              <Icon size={19} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              {/* Valor del KPI; muestra "—" mientras los datos cargan */}
              <p className="text-xl font-semibold leading-none tracking-tight text-card-foreground sm:text-2xl">
                {data?.[key] ?? "—"}
              </p>
              <p className="mt-1.5 truncate text-[10px] leading-3 text-muted-foreground sm:text-[11px]">
                {label}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Fila central: tutorías de hoy (izquierda) y alertas (derecha) en pantallas grandes */}
      <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        {/* Panel: próximas tutorías de hoy */}
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-black/10 dark:border-[#30465C] dark:bg-[#192B3B]">
          <SectionHeader
            title="Próximas tutorías de hoy"
            detail={`${sesionesHoy.length} programadas`}
          />
          {/* Tres estados: cargando, sin tutorías hoy, o lista de tutorías */}
          {!data ? (
            <div className="bg-card p-5 text-sm text-muted-foreground dark:bg-[#1F2937]">
              Cargando...
            </div>
          ) : sesionesHoy.length === 0 ? (
            <div className="bg-card p-5 text-sm text-muted-foreground dark:bg-[#1F2937]">
              No hay tutorías programadas para hoy.
            </div>
          ) : (
            <div className="divide-y divide-border dark:divide-[#30465C]">
              {/* Muestra como máximo las primeras 5 tutorías del día */}
              {sesionesHoy.slice(0, 5).map((sesion) => (
                <div
                  key={sesion.id}
                  className="flex items-center gap-3 px-4 py-3 sm:px-5"
                >
                  {/* Bloque de horario: hora de inicio y fin con línea de acento */}
                  <div className="w-12 shrink-0 border-l-2 border-sky-400 pl-2.5">
                    <p className="text-xs font-semibold text-card-foreground">
                      {formatTime(sesion.horaInicio)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatTime(sesion.horaFin)}
                    </p>
                  </div>
                  {/* Asignatura y tutor (se truncan si no caben) */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-card-foreground">
                      {sesion.asignaturaNombre}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      Tutor: {sesion.tutorNombre}
                    </p>
                  </div>
                  {/* Etiqueta de estado con su color */}
                  <span
                    className="rounded-full px-2 py-1 text-[10px] font-medium"
                    style={statusStyle(sesion.estado)}
                  >
                    {statusLabels[sesion.estado]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Panel: alertas y seguimiento */}
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-black/10 dark:border-[#30465C] dark:bg-[#192B3B]">
          <SectionHeader
            title="Alertas y seguimiento"
            detail={`${alertas.length} activas`}
          />
          {/* Si no hay alertas, muestra un mensaje positivo */}
          {alertas.length === 0 ? (
            <div className="flex items-center gap-2.5 bg-card p-5 text-sm text-muted-foreground dark:bg-[#1F2937]">
              <CheckCircle2 size={16} className="text-emerald-400" /> Todo está
              al día.
            </div>
          ) : (
            <div className="divide-y divide-border dark:divide-[#30465C]">
              {alertas.map(({ icon: Icon, tone, title, detail }) => (
                <div
                  key={title}
                  className="flex items-center gap-3 bg-card px-4 py-3 sm:px-5 dark:bg-[#1F2937]"
                >
                  {/* Ícono circular con el color del tono de la alerta */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-card-foreground">
                      {title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Panel: tabla de actividad reciente */}
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-black/10 dark:border-[#30465C] dark:bg-[#192B3B]">
        <SectionHeader
          title="Actividad reciente"
          detail="Últimos movimientos"
        />
        {/* Tres estados: cargando, sin actividad, o tabla con registros */}
        {!data ? (
          <div className="bg-card p-5 text-sm text-muted-foreground dark:bg-[#1F2937]">
            Cargando...
          </div>
        ) : data.actividadReciente.length === 0 ? (
          <div className="bg-card p-5 text-sm text-muted-foreground dark:bg-[#1F2937]">
            No hay actividad registrada.
          </div>
        ) : (
          // Scroll horizontal en pantallas estrechas para no romper la tabla
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse bg-card text-left dark:bg-[#1D3043]">
              <thead className="border-b border-border bg-card dark:border-[#30465C] dark:bg-[#192B3B]">
                <tr className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium sm:px-5">
                    Descripción
                  </th>
                  <th className="px-4 py-2.5 font-medium sm:px-5">Usuario</th>
                  <th className="px-4 py-2.5 font-medium sm:px-5">Estado</th>
                  <th className="w-[130px] px-4 py-2.5 text-center font-medium sm:px-5">
                    Fecha
                  </th>
                  <th className="w-[130px] px-4 py-2.5 text-right font-medium sm:px-5">
                    Hora
                  </th>
                  <th className="w-[110px] px-4 py-2.5 text-center font-medium sm:px-5">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-[#30465C]">
                {/* Muestra solo los 6 movimientos más recientes */}
                {data.actividadReciente.slice(0, 6).map((actividad) => (
                  <tr
                    key={actividad.idSesion}
                    className="align-middle bg-card text-[11px] transition-colors hover:bg-secondary dark:bg-[#1F2937] dark:hover:bg-[#24394D]"
                  >
                    {/* Descripción: número de sesión y asignatura */}
                    <td className="max-w-[360px] truncate px-4 py-3 text-card-foreground sm:px-5">
                      Tutoría #{actividad.idSesion} · {actividad.asignatura}
                    </td>
                    {/* Estudiante involucrado */}
                    <td className="max-w-[190px] truncate px-4 py-3 text-muted-foreground sm:px-5">
                      {actividad.estudiante}
                    </td>
                    {/* Estado como etiqueta de color (si no tiene etiqueta, muestra el valor crudo) */}
                    <td className="px-4 py-3 sm:px-5">
                      <span
                        className="inline-flex rounded-full px-2 py-1 text-[10px] font-medium"
                        style={statusStyle(actividad.estado)}
                      >
                        {statusLabels[actividad.estado] ?? actividad.estado}
                      </span>
                    </td>
                    {/* Fecha tal como la entrega el backend */}
                    <td className="whitespace-nowrap px-4 py-3 text-center text-muted-foreground sm:px-5">
                      {actividad.fecha}
                    </td>
                    {/* Hora convertida a formato de 12 horas */}
                    <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground sm:px-5">
                      {formatHour(actividad.hora)}
                    </td>
                    <td className="px-4 py-3 text-center sm:px-5">
                      <button
                        type="button"
                        aria-label={`Ver detalle de la sesión ${actividad.idSesion}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        onClick={() => {
                          const detalle = sesiones.find(
                            (sesion) => sesion.id === actividad.idSesion,
                          );
                          if (detalle) setSesionDetalle(detalle);
                        }}
                      >
                        <Eye size={13} />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {sesionDetalle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detalle-sesion-title"
          onClick={() => setSesionDetalle(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl dark:border-[#30465C] dark:bg-[#192B3B] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4 dark:border-[#30465C]">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Detalle de tutoría #{sesionDetalle.id}
                </p>
                <h3
                  id="detalle-sesion-title"
                  className="mt-1 text-lg font-semibold"
                >
                  {sesionDetalle.asignaturaNombre}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Cerrar detalle"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setSesionDetalle(null)}
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-1">
              <div className="rounded-xl bg-secondary/60 p-4 dark:bg-[#1F2937]">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Tutor asignado
                </p>
                <p className="mt-1 text-sm font-medium">
                  {sesionDetalle.tutorNombre}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-4 dark:border-[#30465C] dark:bg-[#1F2937]">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Área en la que se requiere apoyo
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {sesionDetalle.descripcionDificultades?.trim() ||
                  "El estudiante no registró una descripción de apoyo."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
