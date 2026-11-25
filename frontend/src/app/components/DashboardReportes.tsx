import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FileSpreadsheet,
  FileText,
  Loader2,
  TrendingUp,
  Users,
  BookOpen,
  Award,
  CheckCircle2,
  BarChart3,
  Play,
  AlertCircle,
} from "lucide-react";
import {
  generarReporte,
  listarCarreras,
  type TipoReporte,
  type ReporteGenerado,
} from "../lib/reportes";
import { ApiError } from "../lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const TIPO_OPCIONES: {
  valor: TipoReporte;
  label: string;
  info: string;
}[] = [
  {
    valor: "ASISTENCIA",
    label: "Asistencia",
    info: "Sesiones por estado e índice de asistencia por asignatura.",
  },
  {
    valor: "ESTADISTICAS",
    label: "Estadísticas Generales",
    info: "Totales del período: sesiones, estudiantes, tutores y asistencia.",
  },
  {
    valor: "ESTUDIANTES_ATENDIDOS",
    label: "Estudiantes atendidos",
    info: "Estudiantes con tutorías completadas y asistencia confirmada.",
  },
  {
    valor: "RENDIMIENTO",
    label: "Rendimiento Académico",
    info: "Promedios de calificaciones por asignatura.",
  },
  {
    valor: "TUTORIAS_MAS_SOLICITADAS",
    label: "Tutorías más solicitadas",
    info: "Demanda de tutorías agrupada por asignatura.",
  },
  {
    valor: "TUTORIAS_POR_CARRERA",
    label: "Tutorías por carrera",
    info: "Cantidad de tutorías, estudiantes, sesiones completadas y asistencia por carrera.",
  },
];

/** Convierte "2026-01-31" en "31/01/2026". */
function fmtFecha(iso: string): string {
  const [a, m, d] = iso.split("-");
  return d && m && a ? `${d}/${m}/${a}` : iso;
}

const KPI_ICONS = [TrendingUp, Award, BookOpen, Users];

const KPI_COLORS = ["#118AB2", "#118AB2", "#FF5C65", "#7B91A8"];

/* ── Exportación Excel ───────────────────────────── */

function celdaExcel(valor: string): string | number {
  return /^-?\d+(\.\d+)?$/.test(valor.trim()) ? Number(valor) : valor;
}

function downloadExcel(
  reporte: ReporteGenerado,
  label: string,
  fechaInicio: string,
  fechaFin: string,
  carrera: string,
) {
  const columnas = Math.max(reporte.headers.length, 2);
  const filaVacia: string[] = [];

  const encabezado: (string | number)[][] = [
    ["Universidad de El Salvador · SIGTAU"],
    [`Reporte: ${label}`],
    [`Período: ${fmtFecha(fechaInicio)} al ${fmtFecha(fechaFin)}`],
    [`Carrera: ${carrera || "Todas las carreras"}`],
    [`Generado: ${new Date().toLocaleString("es-SV")}`],
    filaVacia,
    ["Indicadores"],
    ...reporte.kpis.map((k) => [k.label, celdaExcel(k.value)]),
    filaVacia,
  ];

  const cuerpo =
    reporte.rows.length > 0
      ? reporte.rows.map((r) => r.map(celdaExcel))
      : [["Sin datos para el período y la carrera seleccionados"]];

  const worksheet = XLSX.utils.aoa_to_sheet([
    ...encabezado,
    reporte.headers,
    ...cuerpo,
  ]);

  worksheet["!merges"] = [0, 1, 2, 3, 4, 6].map((fila) => ({
    s: { r: fila, c: 0 },
    e: { r: fila, c: columnas - 1 },
  }));

  const filasTabla = [reporte.headers, ...reporte.rows];

  worksheet["!cols"] = Array.from({ length: columnas }, (_, c) => {
    const largos = filasTabla.map((f) => String(f[c] ?? "").length);

    if (c === 0) {
      largos.push(...reporte.kpis.map((k) => k.label.length));
    }

    return {
      wch: Math.min(45, Math.max(12, ...largos) + 2),
    };
  });

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

  XLSX.writeFile(
    workbook,
    `SIGTAU_${label.replace(/ /g, "_")}_${Date.now()}.xlsx`,
  );
}

/* ── Exportación PDF ─────────────────────────────── */

function downloadPDF(
  reporte: ReporteGenerado,
  label: string,
  fechaInicio: string,
  fechaFin: string,
  carrera: string,
) {
  const doc = new jsPDF({ orientation: "landscape" });

  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const margen = 14;

  // Paleta institucional SIGTAU
  const azul: [number, number, number] = [37, 43, 58];
  const turquesa: [number, number, number] = [17, 138, 178];

  // Encabezado institucional
  doc.setFillColor(...azul);
  doc.rect(0, 0, ancho, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("SIGTAU", margen, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text("Sistema Integral de Gestión de Tutorías Académicas", margen, 17);

  doc.text(
    "Universidad de El Salvador · Coordinación académica",
    ancho - margen,
    11,
    { align: "right" },
  );

  doc.text(
    `Generado: ${new Date().toLocaleString("es-SV")}`,
    ancho - margen,
    17,
    { align: "right" },
  );

  // Título y filtros
  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Reporte: ${label}`, margen, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(75, 85, 99);

  doc.text(
    `Período: ${fmtFecha(fechaInicio)} al ${fmtFecha(fechaFin)}   ·   Carrera: ${carrera || "Todas las carreras"}   ·   Registros: ${reporte.rows.length}`,
    margen,
    41,
  );

  // Indicadores KPI
  let y = 48;

  if (reporte.kpis.length > 0) {
    const sep = 4;
    const n = reporte.kpis.length;
    const anchoKpi = (ancho - margen * 2 - sep * (n - 1)) / n;

    reporte.kpis.forEach((k, i) => {
      const x = margen + i * (anchoKpi + sep);

      doc.setDrawColor(209, 213, 219);
      doc.setFillColor(243, 246, 251);
      doc.roundedRect(x, y, anchoKpi, 18, 2, 2, "FD");

      doc.setTextColor(...turquesa);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(k.value, x + 4, y + 8);

      doc.setTextColor(75, 85, 99);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(k.label, x + 4, y + 14);
    });

    y += 24;
  }

  // Tabla de datos
  if (reporte.rows.length === 0) {
    doc.setTextColor(180, 83, 9);
    doc.setFontSize(10);
    doc.text(
      "Sin datos para el período y la carrera seleccionados.",
      margen,
      y + 6,
    );
  } else {
    autoTable(doc, {
      head: [reporte.headers],
      body: reporte.rows,
      startY: y,
      margin: {
        left: margen,
        right: margen,
        bottom: 16,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
        textColor: [31, 41, 55],
      },
      headStyles: {
        fillColor: turquesa,
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });
  }

  // Pie de página
  const paginas = doc.getNumberOfPages();

  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);

    doc.setDrawColor(209, 213, 219);
    doc.line(margen, alto - 11, ancho - margen, alto - 11);

    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);

    doc.text("Documento generado por SIGTAU · Uso académico", margen, alto - 6);

    doc.text(`Página ${p} de ${paginas}`, ancho - margen, alto - 6, {
      align: "right",
    });
  }

  doc.save(`SIGTAU_${label.replace(/ /g, "_")}_${Date.now()}.pdf`);
}

/* ── Dashboard de reportes ───────────────────────── */

export function DashboardReportes() {
  const [tipo, setTipo] = useState<TipoReporte>("ASISTENCIA");

  const [fechaInicio, setFechaInicio] = useState("2026-01-01");

  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [carrera, setCarrera] = useState("");
  const [carreras, setCarreras] = useState<string[]>([]);
  const [carrerasError, setCarrerasError] = useState(false);

  const [generando, setGenerando] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [reporte, setReporte] = useState<ReporteGenerado | null>(null);

  const tipoInfo = TIPO_OPCIONES.find((t) => t.valor === tipo)!;

  // Cargar carreras
  useEffect(() => {
    listarCarreras()
      .then(setCarreras)
      .catch(() => setCarrerasError(true));
  }, []);

  // Generar reporte
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
      setGenError(
        err instanceof ApiError
          ? err.message
          : "No se pudo generar el reporte.",
      );
    } finally {
      setGenerando(false);
    }
  };

  const sinDatos = !!reporte && reporte.rows.length === 0;

  const mensajeSinDatos = carrera
    ? `No hay sesiones de estudiantes de ${carrera} entre el ${fmtFecha(fechaInicio)} y el ${fmtFecha(fechaFin)}. Prueba con otro período o con «Todas las carreras».`
    : `No hay sesiones registradas entre el ${fmtFecha(fechaInicio)} y el ${fmtFecha(fechaFin)}. Prueba con un período más amplio.`;

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5 text-foreground">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[25px]">
            Genera y consulta reportes académicos
          </h2>
        </div>

      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <p
            className="text-muted-foreground"
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            Configurar reporte
          </p>
        </div>

        {/* Tipos de reporte */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {TIPO_OPCIONES.map((t) => (
            <button
              key={t.valor}
              onClick={() => {
                setTipo(t.valor);
                setReporte(null);
              }}
              className="rounded-xl border p-3.5 text-left transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#118AB2]"
              style={{
                borderColor: tipo === t.valor ? "#118AB2" : "var(--border)",
                background:
                  tipo === t.valor
                    ? "rgba(17,138,178,0.10)"
                    : "var(--input-background)",
              }}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <BarChart3
                  size={13}
                  style={{
                    color:
                      tipo === t.valor ? "#118AB2" : "var(--muted-foreground)",
                  }}
                />
              </div>

              <p
                className="text-foreground"
                style={{
                  fontSize: "0.8rem",
                  fontWeight: tipo === t.valor ? 600 : 400,
                }}
              >
                {t.label}
              </p>

              <p
                className="mt-0.5 text-muted-foreground"
                style={{
                  fontSize: "0.75rem",
                  lineHeight: 1.4,
                }}
              >
                {t.info}
              </p>
            </button>
          ))}
        </div>

        {/* Fechas y filtros */}
        <div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">
            Fecha inicio
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="h-11 w-full min-w-0 rounded-xl border border-border bg-input-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#118AB2] dark:[color-scheme:dark]"
            />
          </label>

          <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">
            Fecha fin
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="h-11 w-full min-w-0 rounded-xl border border-border bg-input-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#118AB2] dark:[color-scheme:dark]"
            />
          </label>

          <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">
            Filtro por carrera
            <select
              value={carrera}
              onChange={(e) => {
                setCarrera(e.target.value);
                setReporte(null);
              }}
              title={
                carrerasError
                  ? "No se pudieron cargar las carreras; se usará Todas las carreras."
                  : undefined
              }
              className="h-11 w-full min-w-0 rounded-xl border border-border bg-input-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#118AB2] dark:[color-scheme:dark]"
            >
              <option value="">Todas las carreras</option>

              {carreras.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleGenerar}
            disabled={generando}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0F789A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#118AB2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generando ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Play size={14} />
                Generar reporte
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {genError && (
          <div
            className="mt-4 flex items-center gap-2.5 rounded-xl px-4 py-3"
            style={{
              background: "rgba(255,92,101,0.08)",
              border: "1px solid rgba(255,92,101,0.25)",
            }}
          >
            <AlertCircle size={14} className="shrink-0 text-[#FF5C65]" />

            <p className="text-[#FF5C65]" style={{ fontSize: "0.82rem" }}>
              {genError}
            </p>
          </div>
        )}
      </div>

      {/* Resultados */}
      {reporte && (
        <>
          {/* Estado del reporte */}
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              background: sinDatos
                ? "rgba(245,158,11,0.08)"
                : "rgba(17,138,178,0.08)",
              border: sinDatos
                ? "1px solid rgba(245,158,11,0.3)"
                : "1px solid rgba(17,138,178,0.25)",
            }}
          >
            {sinDatos ? (
              <AlertCircle
                size={16}
                style={{
                  color: "#F59E0B",
                  flexShrink: 0,
                }}
              />
            ) : (
              <CheckCircle2
                size={16}
                style={{
                  color: "#118AB2",
                  flexShrink: 0,
                }}
              />
            )}

            <div className="flex-1">
              <p
                style={{
                  fontSize: "0.85rem",
                  color: sinDatos ? "#F59E0B" : "#118AB2",
                }}
              >
                {sinDatos ? "Reporte sin resultados" : "Reporte generado"}
              </p>

              <p
                className="text-muted-foreground"
                style={{ fontSize: "0.75rem" }}
              >
                {sinDatos
                  ? mensajeSinDatos
                  : `Período: ${fmtFecha(fechaInicio)} al ${fmtFecha(fechaFin)}`}
              </p>
            </div>
          </div>

          {/* Gráfica */}
          {reporte.chart.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3
                className="mb-1 text-card-foreground"
                style={{ fontSize: "0.95rem" }}
              >
                Visualización — {tipoInfo.label}
              </h3>

              <p
                className="mb-4 text-muted-foreground"
                style={{ fontSize: "0.78rem" }}
              >
                Período {fmtFecha(fechaInicio)} al {fmtFecha(fechaFin)}
              </p>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={reporte.chart} barSize={32}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(17,138,178,0.10)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 11,
                      fill: "var(--muted-foreground)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "var(--muted-foreground)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />

                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#118AB2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabla */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <FileText size={14} className="text-[#118AB2]" />

                <h3
                  className="text-card-foreground"
                  style={{ fontSize: "0.95rem" }}
                >
                  Tabla de datos: {tipoInfo.label}
                </h3>
              </div>

              <span
                className="text-muted-foreground"
                style={{ fontSize: "0.75rem" }}
              >
                {reporte.rows.length} registros
              </span>
            </div>

            <div className="overflow-x-auto">
              <table
                className="w-full"
                style={{
                  minWidth: `${reporte.headers.length * 130}px`,
                }}
              >
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    {reporte.headers.map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-5 py-3 text-left text-muted-foreground"
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          fontWeight: 500,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {reporte.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={reporte.headers.length}
                        className="py-10 text-center text-muted-foreground"
                        style={{ fontSize: "0.875rem" }}
                      >
                        {mensajeSinDatos}
                      </td>
                    </tr>
                  ) : (
                    reporte.rows.map((row, ri) => (
                      <tr
                        key={ri}
                        className="transition-colors hover:bg-secondary/40"
                      >
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className="whitespace-nowrap px-5 py-3"
                            style={{
                              fontSize: "0.82rem",
                              color:
                                ci === 0
                                  ? "var(--foreground)"
                                  : "var(--muted-foreground)",
                              fontFamily: /^[\d.%\s-]+$/.test(cell)
                                ? "var(--font-mono)"
                                : undefined,
                            }}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pie de tabla */}
            <div className="flex items-center justify-between border-t border-border px-5 py-3.5">
              <p
                className="text-muted-foreground"
                style={{ fontSize: "0.75rem" }}
              >
                Reporte generado{" "}
                {new Date(reporte.fechaGeneracion).toLocaleString("es-SV")}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    downloadPDF(
                      reporte,
                      tipoInfo.label,
                      fechaInicio,
                      fechaFin,
                      carrera,
                    )
                  }
                  className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-muted-foreground transition-all hover:border-[#FF5C65] hover:bg-secondary hover:text-foreground"
                  style={{ fontSize: "0.85rem" }}
                >
                  <FileText size={14} className="text-[#FF5C65]" />
                  Exportar PDF
                </button>

                <button
                  onClick={() =>
                    downloadExcel(
                      reporte,
                      tipoInfo.label,
                      fechaInicio,
                      fechaFin,
                      carrera,
                    )
                  }
                  className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-muted-foreground transition-all hover:border-[#118AB2] hover:bg-secondary hover:text-foreground"
                  style={{ fontSize: "0.8rem" }}
                >
                  <FileSpreadsheet size={14} className="text-[#118AB2]" />
                  Exportar Excel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Estado inicial */}
      {!reporte && !generando && (
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <BarChart3
            size={36}
            className="mx-auto mb-3 text-[#118AB2] opacity-60"
          />

          <p className="text-foreground" style={{ fontSize: "0.95rem" }}>
            Configura y genera un reporte
          </p>

          <p
            className="mt-1 text-muted-foreground"
            style={{ fontSize: "0.82rem" }}
          >
            Selecciona el tipo, define el período y haz clic en «Generar
            reporte».
          </p>
        </div>
      )}
    </div>
  );
}
