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
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-foreground">Dashboard</h2>
        <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
          Resumen general del sistema
        </p>
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(([label, value], i) => {
          const Icon = icons[i];
          return (
            <div key={String(label)} className="bg-card rounded-2xl border border-border p-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-secondary mb-3">
                <Icon size={16} />
              </div>
              <p style={{ fontSize: "1.5rem", fontFamily: "var(--font-mono)" }}>{value}</p>
              <p className="text-foreground mt-1" style={{ fontSize: "0.8rem" }}>{label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
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
              <div key={a.idSesion} className="flex items-start gap-3 px-5 py-3.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-secondary">
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
