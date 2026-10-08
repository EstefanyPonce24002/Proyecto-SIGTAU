import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { historialTutor, type Sesion } from "../lib/sesiones";
import { ApiError } from "../lib/api";

interface Props {
  idTutor: number;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatHora(hora: string) {
  return hora.slice(0, 5);
}

export function CalendarioTutor({ idTutor }: Props) {
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
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar el calendario."))
      .finally(() => setCargando(false));
  }, [idTutor]);

  useEffect(() => { cargar(); }, [cargar]);

  const dias = useMemo(() => {
    const year = mes.getFullYear();
    const month = mes.getMonth();
    const first = new Date(year, month, 1);
    const start = (first.getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = Array(start).fill(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [mes]);

  const sesionesMes = sesiones.filter((s) => {
    const d = new Date(s.fechaSesion + "T12:00:00");
    return d.getFullYear() === mes.getFullYear() && d.getMonth() === mes.getMonth();
  });

  const sesionesDia = diaSeleccionado
    ? sesiones.filter((s) => s.fechaSesion === diaSeleccionado)
    : [];

  if (cargando) {
    return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Calendario</h2>
        <p className="mt-1 text-sm text-muted-foreground">Consulta tus tutorías programadas por fecha.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <button onClick={() => { setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1)); setDiaSeleccionado(null); }} className="rounded-lg p-2 hover:bg-secondary">
            <ChevronLeft size={18} />
          </button>
          <h3 className="font-semibold text-foreground">{MESES[mes.getMonth()]} {mes.getFullYear()}</h3>
          <button onClick={() => { setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1)); setDiaSeleccionado(null); }} className="rounded-lg p-2 hover:bg-secondary">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-border">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {dias.map((dia, i) => {
            if (!dia) return <div key={i} className="min-h-24 border-b border-r border-border bg-secondary/20" />;
            const fecha = isoDate(new Date(mes.getFullYear(), mes.getMonth(), dia));
            const eventos = sesiones.filter((s) => s.fechaSesion === fecha);
            const seleccionado = diaSeleccionado === fecha;
            return (
              <button
                key={fecha}
                onClick={() => setDiaSeleccionado(fecha)}
                className="min-h-24 border-b border-r border-border p-2 text-left align-top hover:bg-secondary/50"
                style={{ background: seleccionado ? "rgba(17,138,178,0.08)" : undefined }}
              >
                <span className="text-sm font-medium text-foreground">{dia}</span>
                <div className="mt-1 space-y-1">
                  {eventos.slice(0, 3).map((s) => (
                    <div key={s.id} className="truncate rounded-md bg-secondary px-1.5 py-1 text-[0.68rem] text-foreground">
                      {formatHora(s.horaInicio)} · {s.asignaturaNombre}
                    </div>
                  ))}
                  {eventos.length > 3 && <p className="text-[0.65rem] text-muted-foreground">+{eventos.length - 3} más</p>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {diaSeleccionado ? `Sesiones del ${new Date(diaSeleccionado + "T12:00:00").toLocaleDateString("es-SV")}` : "Selecciona un día"}
        </h3>
        {diaSeleccionado && sesionesDia.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay sesiones para este día.</p>
        ) : diaSeleccionado ? (
          <div className="space-y-2">
            {sesionesDia.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl bg-secondary p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.asignaturaNombre}</p>
                  <p className="text-xs text-muted-foreground">{s.estudianteNombre} · {formatHora(s.horaInicio)}–{formatHora(s.horaFin)}</p>
                </div>
                <span className="text-xs text-muted-foreground">{s.estado}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{sesionesMes.length} sesiones en este mes.</p>
        )}
      </div>
    </div>
  );
}
