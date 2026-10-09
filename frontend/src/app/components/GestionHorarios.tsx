import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Clock,
  Lock,
  X,
  Loader2,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import {
  listarHorariosDelTutor,
  crearHorario,
  eliminarHorario,
  DIA_LABEL,
  formatHora,
  type HorarioOption,
} from "../lib/catalogo";
import { ApiError } from "../lib/api";

interface Props {
  idTutor: number;
}

const DIAS: HorarioOption["diaSemana"][] = [
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
];

function NuevoHorarioModal({
  idTutor,
  onCreated,
  onClose,
}: {
  idTutor: number;
  onCreated: () => void;
  onClose: () => void;
}) {
  const [diaSemana, setDiaSemana] =
    useState<HorarioOption["diaSemana"]>("LUNES");
  const [horaInicio, setHoraInicio] = useState("14:00");
  const [horaFin, setHoraFin] = useState("16:00");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (horaFin <= horaInicio) {
      setError("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }
    setSaving(true);
    try {
      await crearHorario({ idTutor, diaSemana, horaInicio, horaFin });
      onCreated();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo crear el bloque.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nuevo horario"
        className="relative w-full max-w-sm bg-card rounded-2xl border border-border shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-card-foreground" style={{ fontSize: "0.95rem" }}>
            Nuevo bloque de disponibilidad
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar nuevo horario"
            className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <X size={15} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {error && (
            <div
              className="rounded-xl px-3 py-2.5"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <p className="text-destructive" style={{ fontSize: "0.82rem" }}>
                {error}
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <label
              className="text-card-foreground"
              style={{ fontSize: "0.85rem" }}
            >
              Día
            </label>
            <select
              value={diaSemana}
              onChange={(e) =>
                setDiaSemana(e.target.value as HorarioOption["diaSemana"])
              }
              className="w-full rounded-xl border border-border-strong bg-input-background text-card-foreground px-4 py-2.5 outline-none focus focus focus transition-all"
              style={
                {
                  fontSize: "0.875rem",
                } as React.CSSProperties
              }
            >
              {DIAS.map((d) => (
                <option key={d} value={d}>
                  {DIA_LABEL[d]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                className="text-card-foreground"
                style={{ fontSize: "0.85rem" }}
              >
                Hora inicio
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full rounded-xl border border-border-strong bg-input-background text-card-foreground px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                style={
                  {
                    fontSize: "0.875rem",
                  } as React.CSSProperties
                }
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-card-foreground"
                style={{ fontSize: "0.85rem" }}
              >
                Hora fin
              </label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full rounded-xl border border-border bg-input-background text-card-foreground px-4 py-2.5 outline-none focus:ring-2 transition-all"
                style={
                  {
                    fontSize: "0.875rem",
                    "--tw-ring-color": "#118AB2",
                  } as React.CSSProperties
                }
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-2.5 text-foreground hover:bg-secondary transition-all"
              style={{ fontSize: "0.875rem" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 transition-all hover active disabled focus-visible focus-visible focus-visible focus-visible"
              style={{ fontSize: "0.875rem" }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function GestionHorarios({ idTutor }: Props) {
  const [horarios, setHorarios] = useState<HorarioOption[]>([]);
  const [cargando, setCargando] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setLoadError(null);
    listarHorariosDelTutor(idTutor)
      .then(setHorarios)
      .catch((err) =>
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar los horarios.",
        ),
      )
      .finally(() => setCargando(false));
  }, [idTutor]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleEliminar = async (id: number) => {
    setEliminando(id);
    setActionError(null);
    try {
      await eliminarHorario(id);
      cargar();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "No se pudo eliminar el bloque.",
      );
    } finally {
      setEliminando(null);
    }
  };

  if (cargando) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full rounded-2xl border border-border bg-card p-8 text-center">
        <AlertCircle size={24} className="mx-auto mb-2 text-destructive" />
        <p className="text-destructive" style={{ fontSize: "0.9rem" }}>
          {loadError}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground">Mis Horarios</h2>
          <p className="text-muted-foreground" style={{ fontSize: "0.88rem" }}>
            {horarios.length} bloques registrados
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-white transition-all hover:brightness-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          style={{ backgroundColor: "#118AB2", fontSize: "0.875rem" }}
        >
          <Plus size={15} /> Nuevo bloque
        </button>
      </div>

      {actionError && (
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <p className="text-destructive" style={{ fontSize: "0.85rem" }}>
            {actionError}
          </p>
        </div>
      )}

      {horarios.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border py-16 text-center">
          <CalendarDays
            size={32}
            className="mx-auto mb-3 text-muted-foreground"
          />
          <p className="text-foreground" style={{ fontSize: "0.95rem" }}>
            Sin bloques de disponibilidad
          </p>
          <p
            className="text-muted-foreground mt-1"
            style={{ fontSize: "0.82rem" }}
          >
            Crea tu primer bloque para que los estudiantes puedan solicitarte
            tutorías
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DIAS.map((dia) => {
            const bloques = horarios.filter((h) => h.diaSemana === dia);
            if (bloques.length === 0) return null;

            return (
              <div
                key={dia}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                {/* Encabezado del día */}{" "}
                <div className="px-4 py-3 border-b border-border bg-brand-blue/10">
                  <p
                    className="text-foreground"
                    style={{ fontSize: "0.85rem" }}
                  >
                    {DIA_LABEL[dia]}{" "}
                  </p>{" "}
                </div>
                ```
                {/* Bloques de disponibilidad */}
                <div className="divide-y divide-border">
                  {bloques.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock size={14} className="text-brand-blue" />
                        <span
                          className="text-foreground"
                          style={{
                            fontSize: "0.85rem",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {formatHora(h.horaInicio)} – {formatHora(h.horaFin)}
                        </span>
                      </div>

                      {h.disponible ? (
                        <button
                          onClick={() => handleEliminar(h.id)}
                          disabled={eliminando === h.id}
                          aria-label={`Eliminar horario del ${DIA_LABEL[h.diaSemana]}, de ${formatHora(h.horaInicio)} a ${formatHora(h.horaFin)}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {eliminando === h.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      ) : (
                        <span
                          className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                          style={{
                            fontSize: "0.68rem",
                            color: "#F59E0B",
                            background: "rgba(245,158,11,0.12)",
                          }}
                        >
                          <Lock size={10} /> Ocupado
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <NuevoHorarioModal
          idTutor={idTutor}
          onCreated={() => {
            setModalOpen(false);
            cargar();
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
