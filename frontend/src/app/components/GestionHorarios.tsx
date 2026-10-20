import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Lock,
  X,
  Loader2,
  AlertCircle,
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
import { CalendarioTutor } from "./CalendarioTutor";

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

function formatHoraVisual(hora: string) {
  const [hours, minutes] = hora.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("es-SV", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

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
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-4 text-sm font-medium text-red-600 transition-colors duration-200 hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-700 active:bg-red-500/25 active:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium text-white transition-colors hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              style={{ background: "#118AB2" }}
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
  const [diaSemanaEnfocado, setDiaSemanaEnfocado] = useState<number | null>(null);

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
    <div className="mx-auto w-full max-w-6xl space-y-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div>
           
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Define tus horarios disponibles y revisa las tutorías programadas en tu calendario
            </h2>
          </div>
        </div>
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

      <div className="overflow-hidden rounded-2xl border border-[#30465C] bg-[#192B3B] text-[#F1F5F9] shadow-sm">
        <div
          className="grid grid-cols-1 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.8fr)]"
          onMouseLeave={() => setDiaSemanaEnfocado(null)}
        >
          <section
            className="flex min-w-0 flex-col border-b border-[#30465C] bg-[#1D3043] lg:border-b-0 lg:border-r"
          >
            <div className="flex h-14 items-center border-b border-[#30465C] bg-[#192B3B] px-4 sm:px-5">
              <h3 className="text-base font-semibold text-[#F1F5F9]">Disponibilidad semanal de horarios</h3>
            </div>
            <div>
              {DIAS.map((dia, index) => {
                const bloques = horarios
                  .filter((h) => h.diaSemana === dia)
                  .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

                return (
                  <div
                    key={dia}
                    onMouseEnter={() => setDiaSemanaEnfocado(index)}
                    className={`flex items-start gap-2 border-b border-[#30465C] px-4 py-3 transition-colors sm:px-5 ${diaSemanaEnfocado === index ? "bg-[#20C5E8]/10" : "hover:bg-[#24394D]/60"}`}
                  >
                    <span className="w-16 shrink-0 whitespace-nowrap pt-1 text-xs font-semibold text-[#F1F5F9]">
                      {DIA_LABEL[dia]}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-row flex-wrap items-center gap-1.5">
                      {bloques.length ? bloques.map((h) => (
                        <span
                          key={h.id}
                          className="inline-flex min-h-8 items-center gap-1 rounded-md border border-[#30465C] bg-[#192B3B] py-0.5 pl-2 pr-1 text-[13px] text-[#F1F5F9]"
                        >
                          <span className="font-mono font-medium">
                            {formatHoraVisual(h.horaInicio)} - {formatHoraVisual(h.horaFin)}
                          </span>
                          {h.disponible ? (
                            <button
                              onClick={() => handleEliminar(h.id)}
                              disabled={eliminando === h.id}
                              aria-label={`Eliminar horario del ${DIA_LABEL[h.diaSemana]}, de ${formatHora(h.horaInicio)} a ${formatHora(h.horaFin)}`}
                              className="flex h-6 w-6 items-center justify-center rounded text-[#A8B7C8] transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C5E8]"
                            >
                              {eliminando === h.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            </button>
                          ) : (
                            <span className="inline-flex items-center px-1 text-[#FBBF24]" title="Ocupado">
                              <Lock size={11} />
                            </span>
                          )}
                        </span>
                      )) : <span className="text-xs text-[#A8B7C8]">Sin bloques</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {horarios.length === 0 && (
              <p className="px-4 py-3 text-xs text-[#A8B7C8] sm:px-5">
                Crea un bloque para que los estudiantes puedan solicitar tutorías.
              </p>
            )}
            <div className="mt-auto border-t border-[#30465C] px-4 py-4 sm:px-5">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-colors hover:bg-[#0E6F8F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C5E8]"
                style={{ backgroundColor: "#118AB2" }}
              >
                <Plus size={15} /> Nuevo bloque de horario
              </button>
            </div>
          </section>
          <CalendarioTutor
            idTutor={idTutor}
            compact
            diaSemanaEnfocado={diaSemanaEnfocado}
            onDiaSemanaEnfocado={setDiaSemanaEnfocado}
          />
        </div>
      </div>

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
