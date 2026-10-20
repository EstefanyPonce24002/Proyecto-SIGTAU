import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { historialTutor, type Sesion } from "../lib/sesiones";
import { ApiError } from "../lib/api";

interface Props {
  idTutor: number;
  compact?: boolean;
  diaSemanaEnfocado?: number | null;
  onDiaSemanaEnfocado?: (dia: number | null) => void;
}

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

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatHora(hora: string) {
  return hora.slice(0, 5);
}

export function CalendarioTutor({
  idTutor,
  compact = false,
  diaSemanaEnfocado = null,
  onDiaSemanaEnfocado,
}: Props) {
  const [mes, setMes] = useState(() => new Date());
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

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

  useEffect(() => {
    cargar();
  }, [cargar]);

  const dias = useMemo(() => {
    const year = mes.getFullYear();
    const month = mes.getMonth();
    const first = new Date(year, month, 1);
    const start = (first.getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = Array(start).fill(null);

    for (let d = 1; d <= total; d++) {
      cells.push(d);
    }

    while (cells.length % 7) {
      cells.push(null);
    }

    return cells;
  }, [mes]);

  const sesionesDia = diaSeleccionado
    ? sesiones
        .filter((s) => s.fechaSesion === diaSeleccionado)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
    : [];
  const hoy = isoDate(new Date());
  const etiquetasDias = compact
    ? ["L", "M", "M", "J", "V", "S", "D"]
    : ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  if (cargando) {
    return (
      <div className={`flex justify-center ${compact ? "py-12" : "py-20"}`}>
        <Loader2 size={24} className={`animate-spin ${compact ? "text-[#20C5E8]" : "text-muted-foreground"}`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 text-sm ${compact ? "text-red-400" : "rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive"}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={compact ? "min-w-0 p-3 sm:p-4" : "w-full space-y-5"}>
      {!compact && <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Mi calendario</h2><p className="mt-1 text-sm text-muted-foreground">Consulta tus tutorías programadas y revisa cada jornada.</p></div></div>}
      {compact && (
        <div className="-mx-3 -mt-3 mb-3 flex min-h-14 items-center justify-between gap-3 border-b border-[#30465C] bg-[#192B3B] px-4 py-2 sm:-mx-4 sm:-mt-4 sm:px-5">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[#F1F5F9]">Calendario</h3>
            <p className="text-xs text-[#A8B7C8]">Visualiza tus tutorías por día y fecha</p>
          </div>
        </div>
      )}

      <div className={compact ? "w-full min-w-0 overflow-hidden rounded-lg border border-[#30465C] bg-[#1D3043]" : "overflow-hidden rounded-2xl border border-border bg-card shadow-sm"}>
        {/* Encabezado del calendario */}
        <div
          className={`flex h-11 items-center justify-center gap-4 border-b px-2 ${compact ? "border-[#30465C] bg-[#1D3043]" : "border-border px-4 sm:px-5"}`}
          style={{
            ...(!compact ? {
              background: "color-mix(in srgb, var(--brand-blue) 10%, var(--card))",
              color: "var(--foreground)",
            } : {}),
          }}
        >
          <button
            onClick={() => {
              setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1));
              setDiaSeleccionado(null);
            }}
            aria-label="Mes anterior"
            className={`rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 ${compact ? "text-[#A8B7C8] hover:bg-[#24394D] focus-visible:ring-[#20C5E8]" : "border border-border bg-card text-foreground hover:bg-secondary focus-visible:ring-ring"}`}
          >
            <ChevronLeft size={18} />
          </button>

          <h3
            className={`text-sm font-semibold ${compact ? "text-[#F1F5F9]" : "text-base text-foreground sm:text-lg"}`}
          >
            {MESES[mes.getMonth()]} {mes.getFullYear()}
          </h3>

          <button
            onClick={() => {
              setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1));
              setDiaSeleccionado(null);
            }}
            aria-label="Mes siguiente"
            className={`rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 ${compact ? "text-[#A8B7C8] hover:bg-[#24394D] focus-visible:ring-[#20C5E8]" : "text-foreground hover:bg-secondary focus-visible:ring-ring"}`}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Días de la semana */}
        <div className={`grid grid-cols-7 border-b ${compact ? "border-[#30465C] bg-[#202B3A]" : "border-border"}`}>
          {etiquetasDias.map((d, index) => (
            <div
              key={`${d}-${index}`}
              onMouseEnter={() => onDiaSemanaEnfocado?.(index)}
              title={["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][index]}
              className={`px-1 py-1.5 text-center text-[11px] font-medium transition-colors ${compact ? (diaSemanaEnfocado === index ? "bg-[#20C5E8]/10 text-[#20C5E8]" : "text-[#A8B7C8]") : (diaSemanaEnfocado === index ? "bg-brand-blue/10 text-brand-blue" : "text-muted-foreground")}`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Cuadrícula del calendario */}
        <div className={`grid grid-cols-7 ${compact ? "gap-px bg-[#3A4656]" : ""}`}>
          {dias.map((dia, i) => {
            if (!dia) {
              return (
                <div
                  key={i}
                  className={compact ? "h-12 bg-[#293646] sm:h-14" : "min-h-20 border-b border-r border-border bg-secondary/20 sm:min-h-28"}
                />
              );
            }

            const fecha = isoDate(
              new Date(mes.getFullYear(), mes.getMonth(), dia),
            );

            const eventos = sesiones.filter((s) => s.fechaSesion === fecha);

            const seleccionado = diaSeleccionado === fecha;
            const fechaDiaSemana = (new Date(mes.getFullYear(), mes.getMonth(), dia).getDay() + 6) % 7;
            const esHoy = fecha === hoy;
            const diaEnfocado = diaSemanaEnfocado === fechaDiaSemana;

            return (
              <button
                key={fecha}
                onClick={() => setDiaSeleccionado(fecha)}
                onMouseEnter={() => onDiaSemanaEnfocado?.(fechaDiaSemana)}
                aria-pressed={seleccionado}
                aria-label={`${new Date(mes.getFullYear(), mes.getMonth(), dia).toLocaleDateString("es-SV")}${eventos.length ? `, ${eventos.length} sesiones` : ""}`}
                className={`relative ${compact ? "h-12 p-1 sm:h-14 sm:p-1.5" : "min-h-20 p-1.5 sm:min-h-28 sm:p-2.5"} text-left align-top transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset ${compact ? "focus-visible:ring-[#20C5E8]" : "border-b border-r border-border focus-visible:ring-ring"} ${seleccionado ? (compact ? "bg-[#118AB2]/30 ring-1 ring-inset ring-[#20C5E8]" : "bg-brand-blue/10 ring-1 ring-inset ring-brand-blue/50") : diaEnfocado ? (compact ? "bg-[#2A3A4E]" : "bg-brand-blue/5") : compact ? "bg-[#202B3A]" : "bg-card"} ${compact ? (seleccionado ? "hover:bg-[#118AB2]/30" : "hover:bg-[#2A3A4E]") : (seleccionado ? "hover:bg-brand-blue/10" : "hover:bg-secondary/50")}`}
              >
                {/* Número del día */}
                <span
                  className={`relative z-[1] inline-flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    esHoy ? "text-white" : compact ? "text-[#F1F5F9]" : "text-foreground"
                  }`}
                  style={esHoy ? { backgroundColor: "#118AB2" } : undefined}
                >
                  {dia}
                </span>

                {eventos.length > 0 && (
                  <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1" aria-hidden="true">
                    {compact ? (
                      <>
                        {eventos.slice(0, 3).map((s) => <span key={s.id} className="h-1.5 w-1.5 rounded-full bg-[#20C5E8]" />)}
                        {eventos.length > 3 && <span className="text-[9px] leading-none text-[#A8B7C8]">+{eventos.length - 3}</span>}
                      </>
                    ) : <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalle del día seleccionado */}
      {diaSeleccionado && <div className={compact ? "mt-3 w-full border-t border-[#30465C] pt-3" : "rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"}>
        <h3 className={`mb-2 text-sm font-semibold sm:text-base ${compact ? "text-[#F1F5F9]" : "text-foreground"}`}>
          Sesiones del {new Date(diaSeleccionado + "T12:00:00").toLocaleDateString("es-SV")}
        </h3>

        {diaSeleccionado && sesionesDia.length === 0 ? (
          <p className={`text-sm ${compact ? "text-[#A8B7C8]" : "text-muted-foreground"}`}>
            No hay sesiones para este día.
          </p>
        ) : diaSeleccionado ? (
          <div className="space-y-2">
            {sesionesDia.map((s) => (
              <div
                key={s.id}
                className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${compact ? "border-[#30465C] bg-[#1D3043]" : "border-border bg-secondary/50"}`}
              >
                <div>
                  <p className={`text-sm font-medium ${compact ? "text-[#F1F5F9]" : "text-foreground"}`}>
                    {s.asignaturaNombre}
                  </p>

                  <p className={`text-xs ${compact ? "text-[#A8B7C8]" : "text-muted-foreground"}`}>
                    {s.estudianteNombre} · {formatHora(s.horaInicio)}–
                    {formatHora(s.horaFin)}
                  </p>
                  {s.descripcionDificultades && (
                    <p className={`mt-1 text-xs ${compact ? "text-[#A8B7C8]" : "text-muted-foreground"}`}>
                      {s.descripcionDificultades}
                    </p>
                  )}
                  {s.observacionesTutor && (
                    <p className={`mt-1 text-xs ${compact ? "text-[#A8B7C8]" : "text-muted-foreground"}`}>
                      Observaciones: {s.observacionesTutor}
                    </p>
                  )}
                </div>

                <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${compact ? "border-[#30465C] bg-[#192B3B] text-[#A8B7C8]" : "border-border bg-card text-muted-foreground"}`}>
                  {s.estado}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>}
    </div>
  );
}
