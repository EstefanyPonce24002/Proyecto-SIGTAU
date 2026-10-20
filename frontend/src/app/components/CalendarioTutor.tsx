// Importación de hooks de React
import { useCallback, useEffect, useMemo, useState } from "react";
// Importación de iconos de lucide-react
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarDays,
  Clock3,
} from "lucide-react";
// Importación de funciones de la API y tipos
import { historialTutor, type Sesion } from "../lib/sesiones";
import { ApiError } from "../lib/api";

// Interfaz de propiedades del componente
interface Props {
  idTutor: number; // ID del tutor
  compact?: boolean; // Define si se muestra en modo compacto (sin cabecera grande)
}

// Array con los nombres de los meses en español
const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Función que convierte un objeto Date a string "YYYY-MM-DD"
function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

// 👇 CORRECCIÓN: Función mejorada para agregar a.m. / p.m. a la hora
function formatHora(horaISO: string): string {
  if (!horaISO) return "";

  try {
    // Separa la hora y los minutos del string (ej. "14:30:00" -> ["14", "30"])
    const [horas, minutos] = horaISO.split(":");

    // Crea un objeto Date temporal
    const fecha = new Date();
    fecha.setHours(Number(horas), Number(minutos), 0, 0);

    // Utiliza Intl.DateTimeFormat para formatear con hour12: true
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(fecha);
  } catch (error) {
    // Si hay un error de formato, devuelve los primeros 5 caracteres (ej. "14:30")
    return horaISO.slice(0, 5);
  }
}

// Componente principal del Calendario
export function CalendarioTutor({ idTutor, compact = false }: Props) {
  // Estado para el mes que se está visualizando
  const [mes, setMes] = useState(() => new Date());
  // Estado para guardar las sesiones del tutor
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  // Estado de carga
  const [cargando, setCargando] = useState(true);
  // Estado para errores de carga
  const [error, setError] = useState<string | null>(null);
  // Estado para el día seleccionado en el calendario
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  // Función memorizada para cargar las sesiones del tutor
  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);

    historialTutor(idTutor)
      .then(setSesiones)
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el calendario.",
        ),
      )
      .finally(() => setCargando(false));
  }, [idTutor]);

  // Carga las sesiones al montar el componente
  useEffect(() => {
    cargar();
  }, [cargar]);

  // Memoriza el cálculo de los días del mes para la cuadrícula
  const dias = useMemo(() => {
    const year = mes.getFullYear();
    const month = mes.getMonth();
    const first = new Date(year, month, 1);
    // Calcula en qué día de la semana empieza el mes (0 = Lunes, 6 = Domingo)
    const start = (first.getDay() + 6) % 7;
    // Obtiene el último día del mes
    const total = new Date(year, month + 1, 0).getDate();

    // Crea un array con los espacios vacíos al inicio
    const cells: (number | null)[] = Array(start).fill(null);

    // Agrega los días del 1 al total
    for (let d = 1; d <= total; d++) {
      cells.push(d);
    }

    // Rellena con nulos hasta completar las semanas (múltiplos de 7)
    while (cells.length % 7) {
      cells.push(null);
    }

    return cells;
  }, [mes]);

  // Filtra las sesiones que pertenecen al mes actual
  const sesionesMes = sesiones.filter((s) => {
    const d = new Date(s.fechaSesion + "T12:00:00");
    return (
      d.getFullYear() === mes.getFullYear() && d.getMonth() === mes.getMonth()
    );
  });

  // Filtra las sesiones del día seleccionado
  const sesionesDia = diaSeleccionado
    ? sesiones.filter((s) => s.fechaSesion === diaSeleccionado)
    : [];

  // Render de carga
  if (cargando) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Render de error
  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Cabecera (solo si no es modo compacto) */}
      {!compact && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Mi calendario
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Consulta tus tutorías programadas y revisa cada jornada.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground shadow-sm">
            <Clock3 size={16} className="text-brand-blue" />
            <span>
              <strong className="text-foreground">{sesionesMes.length}</strong>{" "}
              sesiones este mes
            </span>
          </div>
        </div>
      )}

      {/* Cabecera compacta */}
      {compact && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
              <CalendarDays size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Visualiza tus tutorías por día y fecha
              </h3>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-sm sm:text-sm">
            <Clock3 size={14} className="text-brand-blue" />
            <span>
              <strong className="text-foreground">{sesionesMes.length}</strong>{" "}
              sesiones este mes
            </span>
          </div>
        </div>
      )}

      {/* Contenedor principal del calendario */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Encabezado con navegación de mes */}
        <div
          className="flex items-center justify-between border-b border-border px-2 py-2 sm:px-4 sm:py-3"
          style={{
            background:
              "color-mix(in srgb, var(--brand-blue) 10%, var(--card))",
            color: "var(--foreground)",
          }}
        >
          <button
            onClick={() => {
              // Retrocede un mes
              setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1));
              setDiaSeleccionado(null);
            }}
            aria-label="Mes anterior"
            className="rounded-lg border border-border bg-card p-1.5 text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-2"
          >
            <ChevronLeft size={16} className="sm:hidden" />
            <ChevronLeft size={18} className="hidden sm:block" />
          </button>

          <h3
            className="text-sm font-semibold sm:text-base"
            style={{ color: "var(--foreground)" }}
          >
            {MESES[mes.getMonth()]} {mes.getFullYear()}
          </h3>

          <button
            onClick={() => {
              // Avanza un mes
              setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1));
              setDiaSeleccionado(null);
            }}
            aria-label="Mes siguiente"
            className="rounded-lg p-1.5 text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-2"
          >
            <ChevronRight size={16} className="sm:hidden" />
            <ChevronRight size={18} className="hidden sm:block" />
          </button>
        </div>

        {/* Días de la semana (Lun - Dom) */}
        <div className="grid grid-cols-7 border-b border-border">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
            <div
              key={d}
              className="px-1 py-1 text-center text-[0.6rem] font-medium text-muted-foreground sm:px-2 sm:py-1.5 sm:text-[0.7rem]"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Cuadrícula de días */}
        <div className="grid grid-cols-7">
          {dias.map((dia, i) => {
            // Renderiza un espacio vacío si no hay día (inicio o fin de mes)
            if (!dia) {
              return (
                <div
                  key={i}
                  className="min-h-[52px] border-b border-r border-border bg-secondary/20 sm:min-h-[72px]"
                />
              );
            }

            // Fecha en formato ISO del día actual de la iteración
            const fecha = isoDate(
              new Date(mes.getFullYear(), mes.getMonth(), dia),
            );

            // Filtra las sesiones que coinciden con este día
            const eventos = sesiones.filter((s) => s.fechaSesion === fecha);
            const seleccionado = diaSeleccionado === fecha;

            return (
              <button
                key={fecha}
                onClick={() => setDiaSeleccionado(fecha)}
                aria-pressed={seleccionado}
                className={`min-h-[52px] border-b border-r border-border p-1 text-left align-top transition-colors hover:bg-secondary/50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:min-h-[72px] sm:p-1.5 ${
                  seleccionado
                    ? "bg-brand-blue/10 ring-1 ring-inset ring-brand-blue/40"
                    : "bg-card"
                }`}
              >
                {/* Número del día */}
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[0.65rem] font-semibold sm:h-6 sm:min-w-6 sm:text-xs ${
                    seleccionado ? "text-white" : "text-foreground"
                  }`}
                  style={
                    seleccionado ? { backgroundColor: "#118AB2" } : undefined
                  }
                >
                  {dia}
                </span>

                {/* Lista de eventos (máximo 2 visibles) */}
                <div className="mt-0.5 space-y-0.5">
                  {eventos.slice(0, 2).map((s) => (
                    <div
                      key={s.id}
                      className="truncate rounded px-1 py-0.5 text-[0.55rem] font-medium sm:text-[0.6rem]"
                      style={{
                        border: "1px solid rgba(17,138,178,0.28)",
                        backgroundColor: "rgba(17,138,178,0.14)",
                        color: "var(--foreground)",
                      }}
                    >
                      {/* Muestra la hora formateada y el nombre de la asignatura */}
                      {formatHora(s.horaInicio)} · {s.asignaturaNombre}
                    </div>
                  ))}

                  {/* Indicador si hay más de 2 eventos */}
                  {eventos.length > 2 && (
                    <p className="text-[0.55rem] text-muted-foreground sm:text-[0.6rem]">
                      +{eventos.length - 2} más
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel de detalle del día seleccionado */}
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
        <h3 className="mb-2 text-xs font-semibold text-foreground sm:text-sm">
          {diaSeleccionado
            ? `Sesiones del ${new Date(
                diaSeleccionado + "T12:00:00",
              ).toLocaleDateString("es-SV")}`
            : "Selecciona un día"}
        </h3>

        {diaSeleccionado && sesionesDia.length === 0 ? (
          <p className="text-xs text-muted-foreground sm:text-sm">
            No hay sesiones para este día.
          </p>
        ) : diaSeleccionado ? (
          <div className="space-y-1.5 sm:space-y-2">
            {sesionesDia.map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-1 rounded-xl border border-border bg-secondary/50 p-2 sm:flex-row sm:items-center sm:justify-between sm:p-2.5"
              >
                <div>
                  <p className="text-xs font-medium text-foreground sm:text-sm">
                    {s.asignaturaNombre}
                  </p>

                  <p className="text-[0.65rem] text-muted-foreground sm:text-xs">
                    {/* Muestra el estudiante y el rango de horas con a.m./p.m. */}
                    {s.estudianteNombre} · {formatHora(s.horaInicio)}–
                    {formatHora(s.horaFin)}
                  </p>
                </div>

                <span className="w-fit rounded-full border border-border bg-card px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground sm:px-2.5 sm:py-1 sm:text-xs">
                  {s.estado}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground sm:text-sm">
            {sesionesMes.length} sesiones en este mes.
          </p>
        )}
      </div>
    </div>
  );
}
