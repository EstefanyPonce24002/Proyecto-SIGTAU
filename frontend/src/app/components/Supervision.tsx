import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import {
  ChevronDown,
  Eye,
  Trash2,
  X,
  FileText,
  Calendar,
  Clock,
  User,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { VoiceSearchInput } from "./VoiceSearchInput";

type Estado =
  | "PENDIENTE"
  | "APROBADA"
  | "COMPLETADA"
  | "CANCELADA"
  | "RECHAZADA";

interface Sesion {
  id: string;
  estudiante: string;
  tutor: string;
  asignatura: string;
  fecha: string;
  hora: string;
  estado: Estado;
  descripcion: string;
  carnet: string;
}

const ESTADO_CFG: Record<Estado, { label: string; color: string; bg: string }> =
  {
    PENDIENTE: {
      label: "Pendiente",
      color: "#F59E0B",
      bg: "rgba(245,158,11,0.12)",
    },
    APROBADA: {
      label: "Aprobada",
      color: "#3B82F6",
      bg: "rgba(59,130,246,0.12)",
    },
    COMPLETADA: {
      label: "Completada",
      color: "#10B981",
      bg: "rgba(16,185,129,0.12)",
    },
    CANCELADA: {
      label: "Cancelada",
      color: "#6B7280",
      bg: "rgba(122,144,184,0.12)",
    },
    RECHAZADA: {
      label: "Rechazada",
      color: "#EF4444",
      bg: "rgba(239,68,68,0.12)",
    },
  };



const TUTORES = ["Todos los tutores"];
const ASIGNATS = ["Todas las asignaturas"];
const ESTUDIANTS = ["Todos los estudiantes"];

function EstadoBadge({ estado }: { estado: Estado }) {
  const cfg = ESTADO_CFG[estado];
  return (
    <span
      className="rounded-full px-2.5 py-1 inline-block whitespace-nowrap"
      style={{ fontSize: "0.72rem", color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

function DetalleModal({
  sesion,
  onClose,
}: {
  sesion: Sesion;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <FileText size={14} style={{ color: "#10B981" }} />
            <h3
              className="text-card-foreground"
              style={{ fontSize: "0.95rem" }}
            >
              Detalle de sesión
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-card-foreground">{sesion.asignatura}</p>
              <p
                className="text-muted-foreground"
                style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}
              >
                {sesion.id}
              </p>
            </div>
            <EstadoBadge estado={sesion.estado} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: User, label: "Estudiante", val: sesion.estudiante },
              {
                icon: BookOpen,
                label: "Tutor",
                val: sesion.tutor.replace("Prof. ", ""),
              },
              { icon: Calendar, label: "Fecha", val: sesion.fecha },
              { icon: Clock, label: "Hora", val: sesion.hora },
            ].map((r) => (
              <div key={r.label} className="rounded-xl bg-secondary p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <r.icon size={11} className="text-muted-foreground" />
                  <span
                    className="text-muted-foreground"
                    style={{
                      fontSize: "0.67rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {r.label}
                  </span>
                </div>
                <p
                  className="text-card-foreground"
                  style={{ fontSize: "0.82rem" }}
                >
                  {r.val}
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-secondary p-3">
            <p
              className="text-muted-foreground mb-1"
              style={{
                fontSize: "0.67rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Descripción
            </p>
            <p
              className="text-card-foreground"
              style={{ fontSize: "0.875rem", lineHeight: 1.6 }}
            >
              {sesion.descripcion}
            </p>
          </div>
        </div>
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full rounded-xl py-2.5 text-white hover:opacity-90 transition-all"
            style={{
              background: "linear-gradient(135deg, #1E3A8A, #3B82F6)",
              fontSize: "0.875rem",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmCancelModal({
  sesion,
  onConfirm,
  onClose,
}: {
  sesion: Sesion;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-card rounded-2xl border border-border shadow-xl p-6 text-center space-y-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: "rgba(239,68,68,0.1)" }}
        >
          <AlertTriangle size={26} style={{ color: "#EF4444" }} />
        </div>
        <div>
          <h3
            className="text-card-foreground mb-1"
            style={{ fontSize: "1rem" }}
          >
            ¿Cancelar esta sesión?
          </h3>
          <p
            className="text-muted-foreground"
            style={{ fontSize: "0.85rem", lineHeight: 1.6 }}
          >
            La sesión{" "}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--foreground)",
              }}
            >
              {sesion.id}
            </span>{" "}
            de <strong className="text-foreground">{sesion.estudiante}</strong>{" "}
            cambiará a <strong style={{ color: "#6B7280" }}>CANCELADA</strong>.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-foreground hover:bg-secondary transition-all"
            style={{ fontSize: "0.875rem" }}
          >
            Mantener
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl py-2.5 text-white hover:opacity-90 transition-all"
            style={{ background: "#EF4444", fontSize: "0.875rem" }}
          >
            Cancelar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════ */
export function Supervision() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Array<{
      id: number; estudianteNombre: string; tutorNombre: string; asignaturaNombre: string;
      fechaSesion: string; horaInicio: string; horaFin: string; estado: Estado;
      descripcionDificultades?: string | null; idEstudiante: number;
    }>>("/sesiones")
      .then(data => setSesiones(data.map(s => ({
        id: String(s.id),
        estudiante: s.estudianteNombre,
        tutor: s.tutorNombre,
        asignatura: s.asignaturaNombre,
        fecha: s.fechaSesion,
        hora: s.horaInicio + " - " + s.horaFin,
        estado: s.estado,
        descripcion: s.descripcionDificultades || "Sin descripción.",
        carnet: String(s.idEstudiante),
      }))))
      .catch(e => setError(e instanceof Error ? e.message : "No se pudo cargar la supervisión"));
  }, []);


  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroTutor, setFiltroTutor] = useState("Todos los tutores");
  const [filtroAsig, setFiltroAsig] = useState("Todas las asignaturas");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [detalle, setDetalle] = useState<Sesion | null>(null);
  const [cancelando, setCancelando] = useState<Sesion | null>(null);

  const tutores = useMemo(() => ["Todos los tutores", ...Array.from(new Set(sesiones.map(s => s.tutor)))], [sesiones]);
  const asignaturas = useMemo(() => ["Todas las asignaturas", ...Array.from(new Set(sesiones.map(s => s.asignatura)))], [sesiones]);

  const cancelarSesion = async (id: string) => {
    try {
      await apiFetch("/sesiones/" + id + "/cancelar", { method: "PATCH" });
      setSesiones(prev => prev.map(s => s.id === id ? { ...s, estado: "CANCELADA" } : s));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cancelar la sesión");
    } finally {
      setCancelando(null);
    }
  };

  const filtradas = sesiones.filter((s) => {
    const matchQ =
      busqueda === "" ||
      s.estudiante.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.id.toLowerCase().includes(busqueda.toLowerCase());
    const matchE = filtroEstado === "Todos" || s.estado === filtroEstado;
    const matchT =
      filtroTutor === "Todos los tutores" || s.tutor === filtroTutor;
    const matchA =
      filtroAsig === "Todas las asignaturas" || s.asignatura === filtroAsig;
    const matchFechaInicio = !fechaInicio || s.fecha >= fechaInicio;
    const matchFechaFin = !fechaFin || s.fecha <= fechaFin;
    return matchQ && matchE && matchT && matchA && matchFechaInicio && matchFechaFin;
  });

  const countByEstado = (e: Estado) =>
    sesiones.filter((s) => s.estado === e).length;

  return (
    <div className="w-full space-y-5">
      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      {/* Header */}
      <div>
        <h2 className="text-foreground">Supervisión de Sesiones</h2>
        <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
          Vista global · {sesiones.length} sesiones registradas en el sistema
        </p>
      </div>

      {/* Estado summary */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {(
          [
            "PENDIENTE",
            "APROBADA",
            "COMPLETADA",
            "CANCELADA",
            "RECHAZADA",
          ] as Estado[]
        ).map((e) => {
          const cfg = ESTADO_CFG[e];
          const count = countByEstado(e);
          return (
            <button
              key={e}
              onClick={() => setFiltroEstado(filtroEstado === e ? "Todos" : e)}
              className="bg-card rounded-xl border p-3 text-left transition-all"
              style={{
                borderColor: filtroEstado === e ? cfg.color : "var(--border)",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "1.1rem",
                  color: cfg.color,
                  lineHeight: 1,
                }}
              >
                {count}
              </p>
              <p
                className="text-muted-foreground mt-1"
                style={{ fontSize: "0.67rem" }}
              >
                {cfg.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <p
          className="text-muted-foreground"
          style={{
            fontSize: "0.72rem",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          Filtros avanzados
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(240px,2fr)_repeat(4,minmax(130px,1fr))] gap-3 items-end">
          {/* Búsqueda */}
          <VoiceSearchInput
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar..."
            className="min-w-0 bg-input-background"
            style={{ fontSize: "0.875rem" }}
          />
          {/* Tutor */}
          <div className="relative min-w-0">
            <select
              value={filtroTutor}
              onChange={(e) => setFiltroTutor(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border bg-input-background text-foreground px-3 py-2.5 pr-8 outline-none focus:ring-2 transition-all"
              style={
                {
                  fontSize: "0.82rem",
                  "--tw-ring-color": "#10B981",
                } as React.CSSProperties
              }
            >
              {tutores.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
          {/* Asignatura */}
          <div className="relative min-w-0">
            <select
              value={filtroAsig}
              onChange={(e) => setFiltroAsig(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border bg-input-background text-foreground px-3 py-2.5 pr-8 outline-none focus:ring-2 transition-all"
              style={
                {
                  fontSize: "0.82rem",
                  "--tw-ring-color": "#10B981",
                } as React.CSSProperties
              }
            >
              {asignaturas.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
          {/* Fecha inicio */}
          <div className="space-y-1 min-w-0">
            <label
              className="text-muted-foreground"
              style={{ fontSize: "0.72rem" }}
            >
              Fecha inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full rounded-xl border border-border bg-input-background text-foreground px-3 py-2 outline-none focus:ring-2 transition-all"
              style={
                {
                  fontSize: "0.82rem",
                  "--tw-ring-color": "#10B981",
                } as React.CSSProperties
              }
            />
          </div>
          {/* Fecha fin */}
          <div className="space-y-1 min-w-0">
            <label
              className="text-muted-foreground"
              style={{ fontSize: "0.72rem" }}
            >
              Fecha fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full rounded-xl border border-border bg-input-background text-foreground px-3 py-2 outline-none focus:ring-2 transition-all"
              style={
                {
                  fontSize: "0.82rem",
                  "--tw-ring-color": "#10B981",
                } as React.CSSProperties
              }
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "760px" }}>
            <thead>
              <tr
                className="border-b border-border"
                style={{ background: "rgba(245,158,11,0.1)" }}
              >
                {[
                  "Código",
                  "Estudiante",
                  "Tutor",
                  "Asignatura",
                  "Fecha / Hora",
                  "Estado",
                  "Acciones",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-muted-foreground"
                    style={{
                      fontSize: "0.69rem",
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
              {filtradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground"
                    style={{ fontSize: "0.875rem" }}
                  >
                    No se encontraron sesiones con los filtros aplicados
                  </td>
                </tr>
              ) : (
                filtradas.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-secondary/40 transition-colors"
                  >
                    <td
                      className="px-4 py-3.5 text-muted-foreground"
                      style={{
                        fontSize: "0.78rem",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {s.id}
                    </td>
                    <td className="px-4 py-3.5">
                      <p
                        className="text-foreground"
                        style={{ fontSize: "0.82rem" }}
                      >
                        {s.estudiante}
                      </p>
                      <p
                        className="text-muted-foreground"
                        style={{
                          fontSize: "0.7rem",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {s.carnet}
                      </p>
                    </td>
                    <td
                      className="px-4 py-3.5 text-foreground"
                      style={{ fontSize: "0.82rem" }}
                    >
                      {s.tutor.replace("Prof. ", "Prof. ")}
                    </td>
                    <td
                      className="px-4 py-3.5 text-foreground"
                      style={{ fontSize: "0.82rem" }}
                    >
                      {s.asignatura}
                    </td>
                    <td className="px-4 py-3.5">
                      <p
                        className="text-foreground"
                        style={{ fontSize: "0.82rem" }}
                      >
                        {s.fecha}
                      </p>
                      <p
                        className="text-muted-foreground"
                        style={{
                          fontSize: "0.73rem",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {s.hora}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <EstadoBadge estado={s.estado} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDetalle(s)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                          title="Ver detalle"
                        >
                          <Eye size={14} />
                        </button>
                        {(s.estado === "PENDIENTE" ||
                          s.estado === "APROBADA") && (
                          <button
                            onClick={() => setCancelando(s)}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all hover:opacity-90 active:scale-95"
                            style={{
                              fontSize: "0.72rem",
                              color: "#EF4444",
                              background: "rgba(239,68,68,0.08)",
                              border: "1px solid rgba(239,68,68,0.25)",
                            }}
                          >
                            <Trash2 size={12} />
                            Cancelar sesión
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border">
          <p className="text-muted-foreground" style={{ fontSize: "0.78rem" }}>
            Mostrando {filtradas.length} de {sesiones.length} sesiones
          </p>
        </div>
      </div>

      {detalle && (
        <DetalleModal sesion={detalle} onClose={() => setDetalle(null)} />
      )}
      {cancelando && (
        <ConfirmCancelModal
          sesion={cancelando}
          onConfirm={() => cancelarSesion(cancelando.id)}
          onClose={() => setCancelando(null)}
        />
      )}
    </div>
  );
}
