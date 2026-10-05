import { BookOpen, Users, CalendarCheck, TrendingUp, ClipboardList, Award, ArrowRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const kpis = [
  { label: "Sesiones este ciclo",     value: "271",  sub: "+14% vs ciclo anterior", icon: CalendarCheck, color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  { label: "Tutores activos",          value: "12",   sub: "2 nuevos este mes",      icon: Award,         color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  { label: "Estudiantes registrados",  value: "148",  sub: "Ciclo 2026-I activos",   icon: Users,         color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  { label: "Asignaturas activas",      value: "8",    sub: "4 con alta demanda",     icon: BookOpen,      color: "#6B7280", bg: "rgba(122,144,184,0.1)" },
];

const tendenciaSemanal = [
  { dia: "Lun", sesiones: 12 },
  { dia: "Mar", sesiones: 19 },
  { dia: "Mié", sesiones: 8  },
  { dia: "Jue", sesiones: 23 },
  { dia: "Vie", sesiones: 17 },
];

const asigMasSolicitadas = [
  { asignatura: "Cálculo",    solicitudes: 54 },
  { asignatura: "Prog. I",    solicitudes: 41 },
  { asignatura: "Álgebra",    solicitudes: 38 },
  { asignatura: "BD",         solicitudes: 29 },
  { asignatura: "Física",     solicitudes: 22 },
];

const actividadReciente = [
  { tipo: "aprobada",  texto: "Sesión TUT-2026-1041 aprobada por Prof. Ramírez", hora: "hace 12 min",  color: "#10B981" },
  { tipo: "nueva",     texto: "Nueva solicitud de M. Gómez — Cálculo Diferencial", hora: "hace 28 min", color: "#3B82F6" },
  { tipo: "completada",texto: "Sesión TUT-2026-1035 marcada como completada",      hora: "hace 1 h",    color: "#F59E0B" },
  { tipo: "alerta",    texto: "Tutor Prof. Mendoza sin actividad en 7 días",       hora: "hace 3 h",    color: "#F59E0B" },
  { tipo: "nueva",     texto: "Usuario creado: carlos.pineda@universidad.edu.sv",  hora: "hace 5 h",    color: "#6B7280" },
];

const iconoActividad: Record<string, React.ElementType> = {
  aprobada:   CheckCircle2,
  nueva:      ClipboardList,
  completada: Award,
  alerta:     AlertCircle,
};

const accesosRapidos = [
  { label: "Nuevo usuario",      sub: "Crear cuenta de estudiante o tutor", color: "#10B981" },
  { label: "Generar reporte",    sub: "Exportar datos del ciclo actual",     color: "#F59E0B" },
  { label: "Asignar tutores",    sub: "Gestionar asignaturas",               color: "#3B82F6" },
  { label: "Ver supervisión",    sub: "Todas las sesiones activas",          color: "#6B7280" },
];

export function DashboardCoord() {
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-foreground">Dashboard</h2>
        <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
          Resumen general del sistema · Ciclo 2026-I · El Salvador
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>
                <k.icon size={16} style={{ color: k.color }} />
              </div>
            </div>
            <p style={{ fontSize: "1.5rem", fontFamily: "var(--font-mono)", color: "var(--foreground)", lineHeight: 1 }}>
              {k.value}
            </p>
            <p className="text-foreground mt-1" style={{ fontSize: "0.8rem" }}>{k.label}</p>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.72rem" }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Sesiones por día */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-5">
          <h3 className="text-card-foreground mb-1" style={{ fontSize: "0.95rem" }}>Sesiones esta semana</h3>
          <p className="text-muted-foreground mb-4" style={{ fontSize: "0.78rem" }}>Total por día hábil</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={tendenciaSemanal} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,138,0.07)" vertical={false} />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="sesiones" fill="#10B981" radius={[6, 6, 0, 0]} name="Sesiones" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asignaturas más solicitadas */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
          <h3 className="text-card-foreground mb-1" style={{ fontSize: "0.95rem" }}>Asignaturas más solicitadas</h3>
          <p className="text-muted-foreground mb-4" style={{ fontSize: "0.78rem" }}>Ciclo 2026-I</p>
          <div className="space-y-3">
            {asigMasSolicitadas.map((a, i) => (
              <div key={a.asignatura} className="flex items-center gap-3">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--muted-foreground)", width: "16px" }}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-foreground" style={{ fontSize: "0.8rem" }}>{a.asignatura}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#10B981" }}>{a.solicitudes}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(a.solicitudes / 54) * 100}%`, background: i === 0 ? "#10B981" : "var(--muted-foreground)" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity + quick access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Actividad reciente */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-card-foreground" style={{ fontSize: "0.95rem" }}>Actividad reciente</h3>
            <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Tiempo real</span>
          </div>
          <div className="divide-y divide-border">
            {actividadReciente.map((a, i) => {
              const Icon = iconoActividad[a.tipo] ?? Clock;
              return (
                <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${a.color}18` }}>
                    <Icon size={13} style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground" style={{ fontSize: "0.82rem", lineHeight: 1.4 }}>{a.texto}</p>
                    <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.7rem" }}>{a.hora}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-card-foreground" style={{ fontSize: "0.95rem" }}>Accesos rápidos</h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {accesosRapidos.map((ac) => (
              <button key={ac.label}
                className="rounded-xl border border-border p-4 text-left hover:bg-secondary/50 transition-all group active:scale-95"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: ac.color }} />
                  <ArrowRight size={13} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <p className="text-foreground" style={{ fontSize: "0.82rem" }}>{ac.label}</p>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.72rem" }}>{ac.sub}</p>
              </button>
            ))}
          </div>

          {/* Estado del sistema */}
          <div className="px-5 pb-4">
            <div className="rounded-xl border border-border p-4" style={{ background: "rgba(16,185,129,0.04)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ background: "#10B981" }} />
                <p className="text-foreground" style={{ fontSize: "0.8rem" }}>Sistema operativo</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Uptime", val: "99.8%" },
                  { label: "Pendientes", val: "5" },
                  { label: "En curso", val: "3" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--foreground)" }}>{s.val}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "0.67rem" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
