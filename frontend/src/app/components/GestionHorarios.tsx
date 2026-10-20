// Importación de hooks
import { useState, useEffect, useCallback, useRef } from "react";
// Importación de iconos
import {
  Plus,
  Trash2,
  Clock,
  Lock,
  X,
  Loader2,
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
// Importación de API
import {
  listarHorariosDelTutor,
  crearHorario,
  eliminarHorario,
  DIA_LABEL,
  // 👇 Renombramos la importación para evitar conflictos con nuestra nueva función
  formatHora as formatHoraOriginal,
  type HorarioOption,
} from "../lib/catalogo";
import { ApiError } from "../lib/api";
import { CalendarioTutor } from "./CalendarioTutor";

// Interfaz de props
interface Props {
  idTutor: number;
}

// Lista de días de la semana
const DIAS: HorarioOption["diaSemana"][] = [
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
];

// 👇 CORRECCIÓN: Función que formatea con a.m. / p.m. (similar a SeguimientoAcademico)
function formatHora(horaISO: string): string {
  if (!horaISO) return "";
  try {
    const [horas, minutos] = horaISO.split(":");
    const fecha = new Date();
    fecha.setHours(Number(horas), Number(minutos), 0, 0);

    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(fecha);
  } catch (error) {
    // Si falla, usa la original como respaldo
    return formatHoraOriginal(horaISO);
  }
}

// Componente del Modal para crear un nuevo horario
function NuevoHorarioModal({
  idTutor,
  onCreated,
  onClose,
}: {
  idTutor: number;
  onCreated: () => void;
  onClose: () => void;
}) {
  // Estados del formulario
  const [diaSemana, setDiaSemana] =
    useState<HorarioOption["diaSemana"]>("LUNES");
  const [horaInicio, setHoraInicio] = useState("14:00");
  const [horaFin, setHoraFin] = useState("16:00");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Maneja el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación básica: la hora de fin debe ser mayor a la de inicio
    if (horaFin <= horaInicio) {
      setError("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    setSaving(true);
    try {
      await crearHorario({ idTutor, diaSemana, horaInicio, horaFin });
      onCreated(); // Recarga la lista y cierra el modal
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
      {/* Fondo oscuro traslúcido */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Contenedor del Modal */}
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

        {/* Formulario */}
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

// Componente Principal de Gestión de Horarios
export function GestionHorarios({ idTutor }: Props) {
  // Estados principales
  const [horarios, setHorarios] = useState<HorarioOption[]>([]);
  const [cargando, setCargando] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Referencia para controlar el scroll horizontal del carrusel
  const carruselRef = useRef<HTMLDivElement>(null);

  // Carga la lista de horarios del tutor
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

  // Maneja la eliminación de un bloque de horario
  const handleEliminar = async (id: number) => {
    setEliminando(id);
    setActionError(null);
    try {
      await eliminarHorario(id);
      cargar(); // Recarga la lista
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

  // Desplaza el carrusel hacia la izquierda
  const scrollIzquierda = () => {
    if (carruselRef.current) {
      carruselRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  // Desplaza el carrusel hacia la derecha
  const scrollDerecha = () => {
    if (carruselRef.current) {
      carruselRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  // Render de carga
  if (cargando) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Render de error
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

  // Filtra solo los días que tienen al menos un bloque registrado
  const diasConBloques = DIAS.filter((dia) =>
    horarios.some((h) => h.diaSemana === dia),
  );

  return (
    // Contenedor principal con max-w-5xl para mantenerlo más angosto
    <div className="mx-auto w-full max-w-5xl space-y-7">
      {/* Cabecera */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Define tus horarios disponibles y revisa las tutorías programadas
              en tu calendario
            </h2>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-medium text-white shadow-sm transition-all hover:brightness-95 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          style={{ backgroundColor: "#118AB2", fontSize: "0.78rem" }}
        >
          <Plus size={14} /> Nuevo bloque
        </button>
      </div>

      {/* Mensaje de error de acciones (como eliminar) */}
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

      {/* Render si no hay horarios registrados */}
      {horarios.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-5 py-16 text-center shadow-sm">
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
        // CARRUSEL DE HORARIOS
        <div className="relative group">
          {/* Botón Flecha Izquierda (solo visible si hay más de 3 tarjetas) */}
          {diasConBloques.length > 3 && (
            <button
              onClick={scrollIzquierda}
              aria-label="Desplazar a la izquierda"
              className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-all hover:bg-secondary active:scale-95 opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronLeft size={15} />
            </button>
          )}

          {/* Contenedor deslizable */}
          <div
            ref={carruselRef}
            className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {diasConBloques.map((dia) => {
              const bloques = horarios.filter((h) => h.diaSemana === dia);
              return (
                <div
                  key={dia}
                  className="w-[85%] shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)]"
                >
                  {/* Encabezado del día (más compacto) */}
                  <div className="border-b border-border bg-brand-blue/10 px-3 py-1.5">
                    <p
                      className="text-foreground font-medium"
                      style={{ fontSize: "0.78rem" }}
                    >
                      {DIA_LABEL[dia]}
                    </p>
                  </div>

                  {/* Bloques de disponibilidad (más compactos) */}
                  <div className="divide-y divide-border">
                    {bloques.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 transition-colors hover:bg-secondary/30"
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock
                            size={12}
                            className="text-brand-blue shrink-0"
                          />
                          <span
                            className="text-foreground truncate"
                            style={{
                              fontSize: "0.75rem",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {formatHora(h.horaInicio)} – {formatHora(h.horaFin)}
                          </span>
                        </div>

                        {/* Botón para eliminar o indicador de ocupado */}
                        {h.disponible ? (
                          <button
                            onClick={() => handleEliminar(h.id)}
                            disabled={eliminando === h.id}
                            aria-label={`Eliminar horario del ${DIA_LABEL[h.diaSemana]}, de ${formatHora(h.horaInicio)} a ${formatHora(h.horaFin)}`}
                            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                          >
                            {eliminando === h.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </button>
                        ) : (
                          <span
                            className="flex items-center gap-1 rounded-full px-1.5 py-0.5 shrink-0"
                            style={{
                              fontSize: "0.6rem",
                              color: "#F59E0B",
                              background: "rgba(245,158,11,0.12)",
                            }}
                          >
                            <Lock size={9} /> Ocupado
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón Flecha Derecha (solo visible si hay más de 3 tarjetas) */}
          {diasConBloques.length > 3 && (
            <button
              onClick={scrollDerecha}
              aria-label="Desplazar a la derecha"
              className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-all hover:bg-secondary active:scale-95 opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      )}

      {/* Componente del Calendario en modo compacto */}
      <CalendarioTutor idTutor={idTutor} compact />

      {/* Modal para crear nuevo horario */}
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
