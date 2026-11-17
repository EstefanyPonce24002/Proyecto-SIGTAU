import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Loader2,
  AlertCircle,
  BookOpen,
  Check,
  Search,
  Pencil,
  Mic,
  ChevronDown,
} from "lucide-react";
import {
  listarTodasLasAsignaturas,
  crearAsignatura,
  cambiarEstadoAsignatura,
  listarTutoresPorAsignatura,
  listarTodosLosTutores,
  asignarTutorAAsignatura,
  quitarTutorDeAsignatura,
  type Asignatura,
  type TutorOption,
} from "../lib/catalogo";
import { ApiError } from "../lib/api";

function NuevaAsignaturaModal({
  onCreated,
  onClose,
}: {
  onCreated: () => void;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await crearAsignatura(nombre.trim(), codigo.trim());
      onCreated();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo crear la asignatura.",
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
        aria-label="Nueva asignatura"
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-4">
          <h3 className="text-card-foreground" style={{ fontSize: "0.95rem" }}>
            Nueva asignatura
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar nueva asignatura"
            className="text-muted-foreground hover:text-foreground transition-colors"
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
              Nombre
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Estructuras de Datos"
              className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 text-card-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
              style={
                {
                  fontSize: "0.875rem",
                  "--tw-ring-color": "#10B981",
                } as React.CSSProperties
              }
            />
          </div>
          <div className="space-y-1.5">
            <label
              className="text-card-foreground"
              style={{ fontSize: "0.85rem" }}
            >
              Código <span className="text-muted-foreground">(opcional)</span>
            </label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: SIS-210"
              className="w-full rounded-xl border border-border bg-input-background text-card-foreground px-4 py-2.5 outline-none focus:ring-2 transition-all placeholder:text-muted-foreground"
              style={
                {
                  fontSize: "0.875rem",
                  "--tw-ring-color": "#10B981",
                } as React.CSSProperties
              }
            />
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
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GestionarTutoresModal({
  asignatura,
  onClose,
  soloLectura = false,
}: {
  asignatura: Asignatura;
  onClose: () => void;
  soloLectura?: boolean;
}) {
  const [asignados, setAsignados] = useState<TutorOption[]>([]);
  const [todos, setTodos] = useState<TutorOption[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    Promise.all([
      listarTutoresPorAsignatura(asignatura.id),
      listarTodosLosTutores(),
    ])
      .then(([asig, all]) => {
        setAsignados(asig);
        setTodos(all);
      })
      .catch(() => setError("No se pudo cargar la lista de tutores."))
      .finally(() => setCargando(false));
  }, [asignatura.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const idsAsignados = new Set(asignados.map((t) => t.id));

  const toggle = async (idTutor: number, yaAsignado: boolean) => {
    setProcesando(idTutor);
    setError(null);
    try {
      if (yaAsignado) {
        await quitarTutorDeAsignatura(asignatura.id, idTutor);
      } else {
        await asignarTutorAAsignatura(asignatura.id, idTutor);
      }
      cargar();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo actualizar la asignación.",
      );
    } finally {
      setProcesando(null);
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
        aria-label="Assignar tutores"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3
              className="text-card-foreground"
              style={{ fontSize: "0.95rem" }}
            >
              {soloLectura ? "Tutores asignados" : "Asignar tutores"}
            </h3>
            <p
              className="text-muted-foreground"
              style={{ fontSize: "0.78rem" }}
            >
              {asignatura.nombre}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar gestión de tutores"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {error && (
          <div
            className="mx-5 mt-4 rounded-xl px-3 py-2.5"
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

        {cargando ? (
          <div className="py-12 flex justify-center">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {soloLectura && (
              <div className="px-5 py-4">
                {asignados.length === 0 ? (
                  <p
                    className="text-muted-foreground"
                    style={{ fontSize: "0.85rem" }}
                  >
                    No hay tutores asignados a esta materia.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {asignados.map((tutor) => (
                      <div key={tutor.id} className="flex items-center gap-2">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium"
                          style={{
                            background: "rgba(16,185,129,0.12)",
                            color: "#059669",
                          }}
                        >
                          {tutor.nombreCompleto.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p
                            className="text-foreground"
                            style={{ fontSize: "0.85rem" }}
                          >
                            {tutor.nombreCompleto}
                          </p>
                          {tutor.especialidad && (
                            <p
                              className="text-muted-foreground"
                              style={{ fontSize: "0.72rem" }}
                            >
                              {tutor.especialidad}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!soloLectura && (
              <div className="divide-y divide-border">
                {todos.length === 0 ? (
                  <p
                    className="text-muted-foreground text-center px-5 py-8"
                    style={{ fontSize: "0.85rem" }}
                  >
                    No hay tutores registrados.
                  </p>
                ) : (
                  todos.map((t) => {
                    const asignado = idsAsignados.has(t.id);
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between px-5 py-3"
                      >
                        <div>
                          <p
                            className="text-foreground"
                            style={{ fontSize: "0.875rem" }}
                          >
                            {t.nombreCompleto}
                          </p>
                          {t.especialidad && (
                            <p
                              className="text-muted-foreground"
                              style={{ fontSize: "0.75rem" }}
                            >
                              {t.especialidad}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => toggle(t.id, asignado)}
                          disabled={procesando === t.id}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all disabled:opacity-60"
                          style={{
                            background: asignado
                              ? "rgba(16,185,129,0.12)"
                              : "var(--secondary)",
                            color: asignado
                              ? "#10B981"
                              : "var(--muted-foreground)",
                            fontSize: "0.78rem",
                          }}
                        >
                          {procesando === t.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : asignado ? (
                            <Check size={13} />
                          ) : (
                            <Plus size={13} />
                          )}
                          {asignado ? "Asignado" : "Asignar"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Asignaturas() {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [tutoresPorAsignatura, setTutoresPorAsignatura] = useState<
    Record<number, number>
  >({});
  const [cargando, setCargando] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalNueva, setModalNueva] = useState(false);
  const [gestionando, setGestionando] = useState<{
    asignatura: Asignatura;
    soloLectura: boolean;
  } | null>(null);
  const [confirmandoDesactivacion, setConfirmandoDesactivacion] =
    useState<Asignatura | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<
    "todas" | "activas" | "inactivas"
  >("todas");

  const cargar = useCallback(() => {
    setCargando(true);
    setLoadError(null);
    listarTodasLasAsignaturas()
      .then(async (asignaturasCargadas) => {
        setAsignaturas(asignaturasCargadas);
        const conteos = await Promise.all(
          asignaturasCargadas.map(
            async (asignatura) =>
              [
                asignatura.id,
                (await listarTutoresPorAsignatura(asignatura.id)).length,
              ] as const,
          ),
        );
        setTutoresPorAsignatura(Object.fromEntries(conteos));
      })
      .catch((err) =>
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar las asignaturas y sus tutores.",
        ),
      )
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const toggleActiva = async (a: Asignatura) => {
    try {
      await cambiarEstadoAsignatura(a.id, !a.activa);
      cargar();
    } catch {
      setLoadError("No se pudo cambiar el estado de la asignatura.");
    }
  };

  const asignaturasFiltradas = asignaturas.filter((asignatura) => {
    const termino = busqueda.trim().toLocaleLowerCase();
    const coincideBusqueda =
      !termino ||
      asignatura.nombre.toLocaleLowerCase().includes(termino) ||
      asignatura.codigo?.toLocaleLowerCase().includes(termino);
    const coincideEstado =
      filtroEstado === "todas" ||
      (filtroEstado === "activas" && asignatura.activa) ||
      (filtroEstado === "inactivas" && !asignatura.activa);
    return coincideBusqueda && coincideEstado;
  });

  if (cargando) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
<div className="mx-auto w-full max-w-[1180px] space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Asignaturas
      </h2>
      <p className="text-sm text-muted-foreground">
        Gestiona materias, asigna tutores y controla el estado de las tutorías.
      </p>
        </div>
        <button
          onClick={() => setModalNueva(true)}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0E6F8F] active:bg-[#0B6685]"
          style={{ background: "#118AB2" }}
        >
          <Plus size={15} /> Nueva asignatura
        </button>
      </div>

      {loadError && (
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <p className="text-destructive" style={{ fontSize: "0.85rem" }}>
            {loadError}
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div
          className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: "#192b3b", borderColor: "#30465c" }}
        >
          <h3 className="text-base font-semibold text-foreground">
            Listado de asignaturas
          </h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-72 sm:flex-none">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "#d1d5db" }}
              />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o código..."
                aria-label="Buscar asignaturas por nombre o código"
                className="h-11 w-full rounded-2xl border bg-transparent pl-10 pr-10 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                style={{
                  borderColor: "var(--brand-blue)",
                  background: "var(--input-background)",
                }}
              />
              <Mic
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "#d1d5db" }}
              />
            </div>
            <div className="relative self-start sm:self-auto">
              <select
                value={filtroEstado}
                onChange={(e) =>
                  setFiltroEstado(
                    e.target.value as "todas" | "activas" | "inactivas",
                  )
                }
                aria-label="Filtrar asignaturas por estado"
                className="h-11 w-full appearance-none rounded-2xl border bg-transparent px-4 pr-10 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-ring sm:w-36"
                style={{
                  borderColor: "var(--border-strong)",
                  background: "var(--input-background)",
                }}
              >
                <option value="todas" style={{ background: "var(--card)" }}>
                  Todas
                </option>
                <option value="activas" style={{ background: "var(--card)" }}>
                  Activas
                </option>
                <option value="inactivas" style={{ background: "var(--card)" }}>
                  Inactivas
                </option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "#b8c5d1" }}
              />
            </div>
          </div>
        </div>

        {asignaturas.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen
              size={32}
              className="mx-auto mb-3 text-muted-foreground"
            />
            <p className="text-sm text-[#D5DEE8]">
              Sin asignaturas registradas
            </p>
          </div>
        ) : asignaturasFiltradas.length === 0 ? (
          <div className="py-12 text-center">
            <Search size={28} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-[#D5DEE8]">
              No se encontraron asignaturas
            </p>
            <p className="mt-1 text-sm text-[#A8B7C8]">
              Prueba con otro nombre, código o estado.
            </p>
          </div>
        ) : (
          <div>
            <div className="hidden grid-cols-[minmax(7rem,1fr)_minmax(12rem,2fr)_minmax(7rem,1fr)_minmax(6rem,0.8fr)_9rem] gap-4 border-b border-[#30465C] bg-[#192B3B] px-5 py-3 text-left text-xs font-medium text-[#A8B7C8] md:grid">
              <span className="text-left">Código</span>
              <span className="text-left">Asignatura</span>
              <span className="text-left">Tutor asignado</span>
              <span className="text-left">Estado</span>
              <span className="text-left">Acciones</span>
            </div>
            <div className="divide-y divide-[#30465C]">
              {asignaturasFiltradas.map((a) => (
                <div
                  key={a.id}
                  className="grid gap-4 bg-[#1F2937] px-5 py-4 text-left text-sm text-[#F1F5F9] transition-colors hover:bg-[#24394D] md:grid-cols-[minmax(7rem,1fr)_minmax(12rem,2fr)_minmax(7rem,1fr)_minmax(6rem,0.8fr)_9rem] md:items-center"
                >
                  <div className="flex items-center md:col-start-1 md:row-start-1">
                    <span className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 font-mono text-[0.7rem] text-muted-foreground">
                      {a.codigo ?? "Sin código"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 md:col-start-2 md:row-start-1">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(17,138,178,0.1)" }}
                    >
                      <BookOpen size={15} style={{ color: "#118ab2" }} />
                    </div>
                    <div>
                      <p className="text-sm text-[#F1F5F9]">{a.nombre}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:col-start-3 md:row-start-1">
                    <button
                      onClick={() =>
                        setGestionando({ asignatura: a, soloLectura: true })
                      }
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                      style={{ fontSize: "0.78rem" }}
                    >
                      Tutores ({tutoresPorAsignatura[a.id] ?? 0})
                    </button>
                  </div>
                  <div className="flex items-center md:col-start-4 md:row-start-1">
                    <span
                      className="rounded-md px-2 py-0.5 text-[0.7rem] font-medium"
                      style={{
                        background: a.activa
                          ? "rgba(16,185,129,0.12)"
                          : "rgba(100,116,139,0.12)",
                        color: a.activa ? "#059669" : "#64748B",
                      }}
                    >
                      {a.activa ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 md:col-start-5 md:row-start-1">
                    <button
                      type="button"
                      onClick={() =>
                        setGestionando({ asignatura: a, soloLectura: false })
                      }
                      aria-label={`Editar tutores de ${a.nombre}`}
                      title="Editar tutores"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() =>
                        a.activa
                          ? setConfirmandoDesactivacion(a)
                          : toggleActiva(a)
                      }
                      className={`rounded-lg px-3 py-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                        a.activa
                          ? "hover:bg-red-500/25 active:bg-red-500/40 focus-visible:ring-red-500"
                          : "hover:bg-emerald-500/25 active:bg-emerald-500/40 focus-visible:ring-emerald-500"
                      }`}
                      style={{
                        fontSize: "0.78rem",
                        color: a.activa ? "#EF4444" : "#10B981",
                        background: a.activa
                          ? "rgba(239,68,68,0.08)"
                          : "rgba(16,185,129,0.1)",
                      }}
                    >
                      {a.activa ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#30465C] bg-[#192B3B] px-5 py-3">
              <p className="text-sm text-[#D5DEE8]">
                Mostrando {asignaturasFiltradas.length} de {asignaturas.length}{" "}
                asignaturas
              </p>
            </div>
          </div>
        )}
      </div>

      {modalNueva && (
        <NuevaAsignaturaModal
          onCreated={() => {
            setModalNueva(false);
            cargar();
          }}
          onClose={() => setModalNueva(false)}
        />
      )}
      {gestionando && (
        <GestionarTutoresModal
          asignatura={gestionando.asignatura}
          soloLectura={gestionando.soloLectura}
          onClose={() => {
            setGestionando(null);
            cargar();
          }}
        />
      )}
      {confirmandoDesactivacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmandoDesactivacion(null)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmar-desactivacion-titulo"
            className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-foreground shadow-xl"
          >
            <div className="mb-4 flex items-start gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  color: "#EF4444",
                }}
              >
                <AlertCircle size={18} />
              </div>
              <div>
                <h3
                  id="confirmar-desactivacion-titulo"
                  className="font-semibold text-card-foreground"
                  style={{ fontSize: "0.95rem" }}
                >
                  ¿Desactivar asignatura?
                </h3>
                <p
                  className="mt-1 text-muted-foreground"
                  style={{ fontSize: "0.82rem" }}
                >
                  ¿Confirmas que deseas desactivar “
                  {confirmandoDesactivacion.nombre}”?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmandoDesactivacion(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const asignatura = confirmandoDesactivacion;
                  setConfirmandoDesactivacion(null);
                  toggleActiva(asignatura);
                }}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 active:bg-red-700"
                style={{ background: "#EF4444" }}
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}