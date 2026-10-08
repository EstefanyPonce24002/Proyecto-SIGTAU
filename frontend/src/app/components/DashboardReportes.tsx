import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Download, FileSpreadsheet, FileText, Filter, Loader2,
  TrendingUp, Users, BookOpen, Award, CheckCircle2, ChevronDown,
  BarChart3, Play, AlertCircle,
} from "lucide-react";
import { generarReporte, type TipoReporte, type ReporteGenerado } from "../lib/reportes";
import { ApiError } from "../lib/api";

const TIPO_OPCIONES: { valor: TipoReporte; label: string; info: string }[] = [
  { valor: "ASISTENCIA",   label: "Asistencia",             info: "Sesiones por estado e índice de asistencia por asignatura." },
  { valor: "RENDIMIENTO",  label: "Rendimiento Académico",  info: "Promedios de calificaciones por asignatura." },
  { valor: "ESTADISTICAS", label: "Estadísticas Generales", info: "Totales del período: sesiones, estudiantes, tutores, asistencia." },
  { valor: "POR_TUTOR",    label: "Por Tutor",              info: "Desempeño individual: sesiones, aprobación y evaluación." },
  { valor: "DEMANDA",     label: "Tutorías más solicitadas", info: "Demanda de tutorías agrupada por asignatura." },
];

const KPI_ICONS = [TrendingUp, Award, BookOpen, Users];
const KPI_COLORS = ["#10B981", "#3B82F6", "#EF4444", "#F59E0B"];

/* ── Exportación real de lo que devolvió el backend ──────────────────── */
function downloadCSV(reporte: ReporteGenerado, label: string, fechaInicio: string, fechaFin: string) {
  const meta = [
    `SIGTAU - Reporte: ${label}`,
    `Período: ${fechaInicio} — ${fechaFin}`,
    `Generado: ${new Date().toLocaleDateString("es-SV")}`,
    "",
  ];
  const csvRows = [...meta, reporte.headers.join(","), ...reporte.rows.map((r) => r.map((c) => `"${c}"`).join(","))];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SIGTAU_${label.replace(/ /g, "_")}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF(reporte: ReporteGenerado, label: string, fechaInicio: string, fechaFin: string) {
  const sep = "=".repeat(70);
  const dash = "-".repeat(70);
  const lines = [
    sep, `  SIGTAU — REPORTE: ${label.toUpperCase()}`, sep,
    `  Período     : ${fechaInicio} — ${fechaFin}`,
    `  Generado    : ${new Date().toLocaleString("es-SV")}`,
    dash, "", `  DATOS DEL REPORTE`, dash,
    "  " + reporte.headers.join("  |  "),
    "  " + "-".repeat(60),
    ...reporte.rows.map((r) => "  " + r.join("  |  ")),
    "", dash, `  Total registros: ${reporte.rows.length}`, sep,
  ];
  const blob = new Blob([lines.join("\n")], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SIGTAU_${label.replace(/ /g, "_")}_${Date.now()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DashboardReportes() {
  const [tipo,         setTipo]         = useState<TipoReporte>("ASISTENCIA");
  const [fechaInicio,  setFechaInicio]  = useState("2026-01-01");
  const [fechaFin,     setFechaFin]     = useState(new Date().toISOString().split("T")[0]);
  const [carrera,      setCarrera]      = useState("");
  const [generando,    setGenerando]    = useState(false);
  const [genError,     setGenError]     = useState<string | null>(null);
  const [reporte,      setReporte]      = useState<ReporteGenerado | null>(null);

  const tipoInfo = TIPO_OPCIONES.find((t) => t.valor === tipo)!;

  const handleGenerar = async () => {
    setGenerando(true);
    setGenError(null);
    setReporte(null);
    try {
      const resultado = await generarReporte({
        tipoReporte: tipo,
        fechaInicio,
        fechaFin,
        filtroCarrera: carrera.trim() || undefined,
      });
      setReporte(resultado);
    } catch (err) {
      setGenError(err instanceof ApiError ? err.message : "No se pudo generar el reporte.");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-foreground">Reportes</h2>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            RF-11 · Coordinación Académica
          </p>
        </div>
        {reporte && (
          <div className="flex gap-2">
            <button onClick={() => downloadPDF(reporte, tipoInfo.label, fechaInicio, fechaFin)}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 transition-all hover:bg-secondary active:scale-95"
              style={{ fontSize: "0.82rem" }}>
              <FileText size={14} style={{ color: "#EF4444" }} />
              <span className="text-foreground">Exportar PDF</span>
            </button>
            <button onClick={() => downloadCSV(reporte, tipoInfo.label, fechaInicio, fechaFin)}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 transition-all hover:bg-secondary active:scale-95"
              style={{ fontSize: "0.82rem" }}>
              <FileSpreadsheet size={14} style={{ color: "#10B981" }} />
              <span className="text-foreground">Exportar Excel</span>
            </button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={14} style={{ color: "#10B981" }} />
          <p className="text-muted-foreground" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Configurar reporte
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {TIPO_OPCIONES.map((t) => (
            <button key={t.valor} onClick={() => { setTipo(t.valor); setReporte(null); }}
              className="rounded-xl border p-3 text-left transition-all hover:shadow-sm"
              style={{
                borderColor: tipo === t.valor ? "#10B981" : "var(--border)",
                background: tipo === t.valor ? "rgba(16,185,129,0.06)" : "var(--input-background)",
              }}>
              <div className="flex items-center gap-2 mb-1.5">
                <BarChart3 size={13} style={{ color: tipo === t.valor ? "#10B981" : "var(--muted-foreground)" }} />
              </div>
              <p className="text-foreground" style={{ fontSize: "0.8rem", fontWeight: tipo === t.valor ? 500 : 400 }}>{t.label}</p>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.68rem", lineHeight: 1.4 }}>{t.info}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="space-y-1">
            <label className="text-muted-foreground" style={{ fontSize: "0.73rem" }}>Fecha inicio</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full rounded-xl border border-border bg-input-background text-foreground px-3 py-2.5 outline-none focus:ring-2 transition-all"
              style={{ fontSize: "0.85rem", "--tw-ring-color": "#10B981" } as React.CSSProperties} />
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground" style={{ fontSize: "0.73rem" }}>Fecha fin</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
              className="w-full rounded-xl border border-border bg-input-background text-foreground px-3 py-2.5 outline-none focus:ring-2 transition-all"
              style={{ fontSize: "0.85rem", "--tw-ring-color": "#10B981" } as React.CSSProperties} />
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground" style={{ fontSize: "0.73rem" }}>Filtro por carrera</label>
            <input value={carrera} onChange={(e) => setCarrera(e.target.value)} placeholder="Todas las carreras"
              className="w-full rounded-xl border border-border bg-input-background text-foreground px-3 py-2.5 outline-none focus:ring-2 transition-all placeholder:text-muted-foreground"
              style={{ fontSize: "0.85rem", "--tw-ring-color": "#10B981" } as React.CSSProperties} />
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground" style={{ fontSize: "0.73rem" }}>&nbsp;</label>
            <button onClick={handleGenerar} disabled={generando}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ background: generando ? "#6B7280" : "linear-gradient(135deg, #1E3A8A, #3B82F6)", fontSize: "0.875rem" }}>
              {generando ? <><Loader2 size={15} className="animate-spin" /> Generando...</> : <><Play size={14} /> Generar reporte</>}
            </button>
          </div>
        </div>

        {genError && (
          <div className="flex items-center gap-2.5 rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={14} className="text-destructive shrink-0" />
            <p className="text-destructive" style={{ fontSize: "0.82rem" }}>{genError}</p>
          </div>
        )}
      </div>

      {/* Resultados */}
      {reporte && (
        <>
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <CheckCircle2 size={16} style={{ color: "#10B981", flexShrink: 0 }} />
            <div className="flex-1">
              <p style={{ fontSize: "0.85rem", color: "#10B981" }}>
                Reporte generado — <strong>{tipoInfo.label}</strong>
              </p>
              <p className="text-muted-foreground" style={{ fontSize: "0.73rem" }}>
                Período: {fechaInicio} · {fechaFin} · {carrera || "Todas las carreras"} · {reporte.totalRegistros} registros
              </p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {reporte.kpis.map((k, i) => {
              const Icon = KPI_ICONS[i % KPI_ICONS.length];
              const color = KPI_COLORS[i % KPI_COLORS.length];
              return (
                <div key={k.label} className="bg-card rounded-2xl border border-border p-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "1.3rem", color: "var(--foreground)", lineHeight: 1 }}>{k.value}</p>
                  <p className="text-muted-foreground mt-1" style={{ fontSize: "0.75rem" }}>{k.label}</p>
                </div>
              );
            })}
          </div>

          {/* Gráfica */}
          {reporte.chart.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="text-card-foreground mb-1" style={{ fontSize: "0.95rem" }}>Visualización — {tipoInfo.label}</h3>
              <p className="text-muted-foreground mb-4" style={{ fontSize: "0.78rem" }}>Período {fechaInicio} al {fechaFin}</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={reporte.chart} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,138,0.07)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabla */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText size={14} style={{ color: "#10B981" }} />
                <h3 className="text-card-foreground" style={{ fontSize: "0.95rem" }}>Tabla de datos — {tipoInfo.label}</h3>
              </div>
              <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{reporte.rows.length} registros</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: `${reporte.headers.length * 130}px` }}>
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    {reporte.headers.map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-muted-foreground whitespace-nowrap"
                        style={{ fontSize: "0.69rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reporte.rows.length === 0 ? (
                    <tr>
                      <td colSpan={reporte.headers.length} className="text-center py-10 text-muted-foreground" style={{ fontSize: "0.875rem" }}>
                        Sin datos para el período seleccionado
                      </td>
                    </tr>
                  ) : (
                    reporte.rows.map((row, ri) => (
                      <tr key={ri} className="hover:bg-secondary/40 transition-colors">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-5 py-3 whitespace-nowrap"
                            style={{
                              fontSize: "0.82rem",
                              color: ci === 0 ? "var(--foreground)" : "var(--muted-foreground)",
                              fontFamily: /^[\d.%\s-]+$/.test(cell) ? "var(--font-mono)" : undefined,
                            }}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3.5 border-t border-border flex items-center justify-between">
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                {reporte.rows.length} registros · generado {new Date(reporte.fechaGeneracion).toLocaleString("es-SV")}
              </p>
              <div className="flex gap-2">
                <button onClick={() => downloadPDF(reporte, tipoInfo.label, fechaInicio, fechaFin)}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                  style={{ fontSize: "0.75rem" }}>
                  <FileText size={12} style={{ color: "#EF4444" }} /> Exportar PDF
                </button>
                <button onClick={() => downloadCSV(reporte, tipoInfo.label, fechaInicio, fechaFin)}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                  style={{ fontSize: "0.75rem" }}>
                  <FileSpreadsheet size={12} style={{ color: "#10B981" }} /> Exportar Excel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {!reporte && !generando && (
        <div className="bg-card rounded-2xl border border-dashed border-border py-16 text-center">
          <BarChart3 size={36} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-foreground" style={{ fontSize: "0.95rem" }}>Configura y genera un reporte</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.82rem" }}>
            Selecciona el tipo, define el período y haz clic en «Generar reporte»
          </p>
        </div>
      )}
    </div>
  );
}
