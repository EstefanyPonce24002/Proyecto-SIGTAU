import { useEffect, useState } from "react";
import { BookOpen, Users, CalendarCheck, Award, Clock } from "lucide-react";
import { apiFetch } from "../lib/api";

type Dashboard = {
  sesiones: number;
  tutoresActivos: number;
  estudiantesActivos: number;
  asignaturasActivas: number;
  actividadReciente: Array<{
    idSesion: number;
    estado: string;
    estudiante: string;
    tutor: string;
    asignatura: string;
    fecha: string;
    hora: string;
  }>;
};

const icons = [CalendarCheck, Award, Users, BookOpen];

export function DashboardCoord() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Dashboard>("/reportes/dashboard")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar el dashboard"));
  }, []);

  const kpis = data ? [
    ["Sesiones registradas", data.sesiones],
    ["Tutores activos", data.tutoresActivos],
    ["Estudiantes activos", data.estudiantesActivos],
    ["Asignaturas activas", data.asignaturasActivas],
  ] : [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"><CalendarCheck size={14} className="text-brand-teal" /> Vista general</div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">Resumen general del sistema académico.</p>
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value], i) => {
          const Icon = icons[i];
          return (
            <div key={String(label)} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-brand-teal/30">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
                <Icon size={16} />
              </div>
              <p className="text-2xl font-semibold tracking-tight text-foreground" style={{ fontFamily: "var(--font-mono)" }}>{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-1 border-b border-border bg-secondary/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h3 className="text-card-foreground" style={{ fontSize: "0.95rem" }}>Actividad reciente</h3>
          <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Datos del sistema</span>
        </div>
        {!data ? (
          <div className="p-6 text-sm text-muted-foreground">Cargando...</div>
        ) : data.actividadReciente.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No hay actividad registrada.</div>
        ) : (
          <div className="divide-y divide-border">
            {data.actividadReciente.map((a) => (
              <div key={a.idSesion} className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-secondary/30 sm:px-5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
                  <Clock size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground" style={{ fontSize: "0.82rem", lineHeight: 1.4 }}>
                    Sesión #{a.idSesion} · {a.asignatura} · {a.estado}
                  </p>
                  <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.7rem" }}>
                    {a.estudiante} con {a.tutor} · {a.fecha} {a.hora}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
