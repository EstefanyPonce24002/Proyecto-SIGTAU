import { apiFetch } from "./api";

export type TipoReporte = "ASISTENCIA" | "RENDIMIENTO" | "ESTADISTICAS" | "POR_TUTOR";

export interface Kpi {
  label: string;
  value: string;
}

export interface ChartPoint {
  name: string;
  value: number;
}

export interface ReporteGenerado {
  tipoReporte: TipoReporte;
  headers: string[];
  rows: string[][];
  kpis: Kpi[];
  chart: ChartPoint[];
  totalRegistros: number;
  fechaGeneracion: string;
}

export interface GenerarReportePayload {
  tipoReporte: TipoReporte;
  fechaInicio: string; // "YYYY-MM-DD"
  fechaFin: string;
  filtroCarrera?: string;
}

export function generarReporte(payload: GenerarReportePayload): Promise<ReporteGenerado> {
  return apiFetch<ReporteGenerado>("/reportes/generar", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
