import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Loader2,
  AlertCircle,
  Users,
  ChevronDown,
  Pencil,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

import {
  listarUsuarios,
  registrarUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  type UsuarioAdmin,
  type RegistroPayload,
} from "../lib/usuarios";

import {
  listarAsignaturas,
  listarTodasLasAsignaturas,
  listarTutoresPorAsignatura,
  asignarTutorAAsignatura,
  quitarTutorDeAsignatura,
  type Asignatura,
} from "../lib/catalogo";

import type { Rol } from "../lib/auth";
import { ApiError } from "../lib/api";
import { VoiceSearchInput } from "./VoiceSearchInput";

const ROL_LABEL: Record<Rol, string> = {
  ESTUDIANTE: "Estudiante",
  TUTOR: "Tutor",
  COORDINADOR: "Coordinador",
};

const ROL_STYLE: Record<Rol, string> = {
  ESTUDIANTE: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  TUTOR: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  COORDINADOR: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
};

const ESTADO_ACTIVO = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";

function iniciales(nombres: string, apellidos: string): string {
  return `${nombres[0] ?? ""}${apellidos[0] ?? ""}`.toUpperCase();
}

/* ─────────────────────────────────────────────────────────────
   Modal de creación y edición de usuarios
   ───────────────────────────────────────────────────────────── */

function NuevoUsuarioModal({
  onCreated,
  onClose,
  usuario,
}: {
  onCreated: () => void;
  onClose: () => void;
  usuario?: UsuarioAdmin;
}) {
  const editando = Boolean(usuario);

  const [form, setForm] = useState<RegistroPayload>({
    nombres: usuario?.nombres ?? "",
    apellidos: usuario?.apellidos ?? "",
    correo: usuario?.correo ?? "",
    contrasena: "",
    rol: usuario?.rol ?? "ESTUDIANTE",
    carnet: usuario?.carnet ?? "",
    carrera: usuario?.carrera ?? "",
    especialidad: usuario?.especialidad ?? "",
  });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Estados para las asignaturas del tutor.
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [asignaturasSeleccionadas, setAsignaturasSeleccionadas] = useState<
    number[]
  >([]);
  const [asignaturasOriginales, setAsignaturasOriginales] = useState<number[]>(
    [],
  );
  const [cargandoAsignaturas, setCargandoAsignaturas] = useState(false);
  const [errorAsignaturas, setErrorAsignaturas] = useState<string | null>(null);

  const set =
    (field: keyof RegistroPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  /*
   * Al editar un tutor:
   * 1. Carga el catálogo de asignaturas.
   * 2. Consulta qué tutores están vinculados a cada asignatura.
   * 3. Marca las asignaturas correspondientes al tutor actual.
   */
  useEffect(() => {
    if (form.rol !== "TUTOR") {
      setAsignaturas([]);
      setAsignaturasSeleccionadas([]);
      setAsignaturasOriginales([]);
      setErrorAsignaturas(null);
      setCargandoAsignaturas(false);
      return;
    }

    let cancelado = false;

    async function cargarAsignaturasTutor() {
      setCargandoAsignaturas(true);
      setErrorAsignaturas(null);

      try {
        // Cargar el catálogo de asignaturas.
        const catalogo = await listarTodasLasAsignaturas();

        if (cancelado) return;

        setAsignaturas(catalogo);

        // Al crear un tutor, todas empiezan desmarcadas.
        if (!usuario) {
          setAsignaturasSeleccionadas([]);
          setAsignaturasOriginales([]);
          return;
        }

        // Al editar, consultar las asignaturas que ya tiene.
        const resultados = await Promise.all(
          catalogo.map(async (asignatura) => {
            const tutores = await listarTutoresPorAsignatura(asignatura.id);

            return {
              id: asignatura.id,
              asignada: tutores.some((tutor) => tutor.id === usuario.id),
            };
          }),
        );

        if (cancelado) return;

        const seleccionadas = resultados
          .filter((resultado) => resultado.asignada)
          .map((resultado) => resultado.id);

        setAsignaturasSeleccionadas(seleccionadas);
        setAsignaturasOriginales(seleccionadas);
      } catch (err) {
        if (cancelado) return;

        setErrorAsignaturas(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar las asignaturas.",
        );
      } finally {
        if (!cancelado) {
          setCargandoAsignaturas(false);
        }
      }
    }

    void cargarAsignaturasTutor();

    return () => {
      cancelado = true;
    };
  }, [form.rol, usuario]);

  const toggleAsignatura = (id: number) => {
    setAsignaturasSeleccionadas((actuales) =>
      actuales.includes(id)
        ? actuales.filter((actual) => actual !== id)
        : [...actuales, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.nombres.trim() || !form.apellidos.trim() || !form.correo.trim()) {
      setError("Completa nombres, apellidos y correo.");
      return;
    }

    if (!editando && form.contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (form.rol === "ESTUDIANTE" && !form.carnet?.trim()) {
      setError("El carnet es obligatorio para un estudiante.");
      return;
    }

    // No permitir guardar una selección incompleta si falló la carga.
    if (
      editando &&
      usuario?.rol === "TUTOR" &&
      (cargandoAsignaturas || errorAsignaturas)
    ) {
      setError(
        "No se pueden guardar los cambios hasta cargar correctamente las asignaturas.",
      );
      return;
    }

    setSaving(true);

    try {
      if (editando) {
        // 1. Actualizar primero los datos generales.
        await actualizarUsuario(usuario!.id, {
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          carnet: form.carnet,
          carrera: form.carrera,
          especialidad: form.especialidad,
        });

        // 2. Actualizar las asignaciones del tutor.
        if (usuario!.rol === "TUTOR") {
          const originales = new Set(asignaturasOriginales);
          const seleccionadas = new Set(asignaturasSeleccionadas);

          const agregar = asignaturasSeleccionadas.filter(
            (id) => !originales.has(id),
          );

          const quitar = asignaturasOriginales.filter(
            (id) => !seleccionadas.has(id),
          );

          /*
           * La API actual expone operaciones individuales.
           * Ejecutamos solo los cambios necesarios.
           */
          await Promise.all([
            ...agregar.map((idAsignatura) =>
              asignarTutorAAsignatura(idAsignatura, usuario!.id),
            ),
            ...quitar.map((idAsignatura) =>
              quitarTutorDeAsignatura(idAsignatura, usuario!.id),
            ),
          ]);
        }
      } else {
        await registrarUsuario(form);
      }

      onCreated();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron guardar todos los cambios. Verifica los datos e inténtalo nuevamente.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={saving ? undefined : onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={editando ? "Editar usuario" : "Nuevo usuario"}
        className="relative flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl dark:border-[#30465C] dark:bg-[#192B3B]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-secondary/30 px-5 py-4">
          <h3 className="font-semibold">
            {editando ? "Editar usuario" : "Nuevo usuario"}
          </h3>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar formulario"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto px-5 py-5"
        >
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5"
            >
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0 text-destructive"
              />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="nombres" className="text-sm">
                Nombres <span className="text-red-500">*</span>
              </label>
              <input
                id="nombres"
                required
                value={form.nombres}
                onChange={set("nombres")}
                disabled={saving}
                className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="apellidos" className="text-sm">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                id="apellidos"
                required
                value={form.apellidos}
                onChange={set("apellidos")}
                disabled={saving}
                className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="correo" className="text-sm">
              Correo institucional <span className="text-red-500">*</span>
            </label>
            <input
              id="correo"
              type="email"
              required
              value={form.correo}
              onChange={set("correo")}
              disabled={editando || saving}
              placeholder="usuario@universidad.edu.sv"
              className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
          </div>

          {!editando && (
            <div className="space-y-1.5">
              <label htmlFor="contrasena" className="text-sm">
                Contraseña temporal <span className="text-red-500">*</span>
              </label>
              <input
                id="contrasena"
                type="password"
                required
                minLength={8}
                value={form.contrasena}
                onChange={set("contrasena")}
                disabled={saving}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="rol" className="text-sm">
              Rol
            </label>

            <div className="relative">
              <select
                id="rol"
                value={form.rol}
                onChange={set("rol")}
                disabled={editando || saving}
                className="w-full appearance-none rounded-xl border border-border bg-input-background px-4 py-2.5 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              >
                <option value="ESTUDIANTE">Estudiante</option>
                <option value="TUTOR">Tutor</option>
                <option value="COORDINADOR">Coordinador</option>
              </select>

              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </div>

          {form.rol === "ESTUDIANTE" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="carnet" className="text-sm">
                  Carnet <span className="text-red-500">*</span>
                </label>
                <input
                  id="carnet"
                  required
                  value={form.carnet}
                  onChange={set("carnet")}
                  disabled={saving}
                  placeholder="20230187"
                  className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

<div className="space-y-1.5">
  <label htmlFor="carrera" className="text-sm">
    Carrera
  </label>

  <select
    id="carrera"
    value={form.carrera ?? ""}
    onChange={set("carrera")}
    disabled={saving}
    required
    className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
  >
    <option value="" disabled>
      Selecciona una carrera
    </option>
    <option value="Ingeniería de Sistemas">
      Ingeniería de Sistemas
    </option>
    <option value="Ingeniería Civil">
      Ingeniería Civil
    </option>
    <option value="Matemáticas">Matemáticas</option>
    <option value="Física">Física</option>
    <option value="Estadística">Estadística</option>
    <option value="Economía">Economía</option>
  </select>
</div>
            </div>
          )}

          {form.rol === "TUTOR" && (
            <>
              {/* Especialidad del tutor */}
              <div className="space-y-1.5">
                <label htmlFor="especialidad" className="text-sm">
                  Especialidad
                </label>

                <input
                  id="especialidad"
                  value={form.especialidad}
                  onChange={set("especialidad")}
                  disabled={saving}
                  placeholder="Ej.: Matemáticas y Programación"
                  className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Asignaturas del tutor: nuevo y edición */}
              <section className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4 dark:border-[#30465C] dark:bg-[#1F2937]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-brand-blue-text" />
                    <h4 className="text-sm font-medium">
                      Asignaturas del tutor
                    </h4>
                  </div>

                  {!cargandoAsignaturas && !errorAsignaturas && (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_ACTIVO}`}>
                      {asignaturasSeleccionadas.length} seleccionadas
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Marca las asignaturas que podrá atender este tutor.
                </p>

                {/* Cargando */}
                {cargandoAsignaturas && (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 size={18} className="animate-spin" />
                    Cargando asignaturas...
                  </div>
                )}

                {/* Error */}
                {errorAsignaturas && (
                  <div role="alert" className="rounded-lg bg-red-500/5 p-3">
                    <p className="text-sm text-destructive">
                      {errorAsignaturas}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cierra el formulario y vuelve a abrirlo para intentar
                      cargar las asignaturas nuevamente.
                    </p>
                  </div>
                )}

                {/* Lista vacía */}
                {!cargandoAsignaturas &&
                  !errorAsignaturas &&
                  asignaturas.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No hay asignaturas disponibles.
                    </p>
                  )}

                {/* Lista de asignaturas */}
                {!cargandoAsignaturas &&
                  !errorAsignaturas &&
                  asignaturas.length > 0 && (
                    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                      {asignaturas.map((asignatura) => {
                        const seleccionada = asignaturasSeleccionadas.includes(
                          asignatura.id,
                        );

                        return (
                          <label
                            key={asignatura.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                              seleccionada
                                ? "border-emerald-500/40 bg-emerald-500/5"
                                : "border-border hover:bg-secondary/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={seleccionada}
                              disabled={saving || cargandoAsignaturas}
                              onChange={() => toggleAsignatura(asignatura.id)}
                              className="h-4 w-4 accent-emerald-600"
                            />

                            <span className="min-w-0 flex-1">
                              <span className="block text-sm">
                                {asignatura.nombre}
                              </span>

                              {asignatura.codigo && (
                                <span className="text-xs text-muted-foreground">
                                  Código: {asignatura.codigo}
                                </span>
                              )}
                            </span>

                            {seleccionada && (
                              <CheckCircle2
                                size={16}
                                className="shrink-0 text-brand-blue-text"
                              />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
              </section>
            </>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-border px-4 py-2.5 text-sm transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                (form.rol === "TUTOR" &&
                  (cargandoAsignaturas || Boolean(errorAsignaturas)))
              }
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {editando ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Gestión de usuarios
   ───────────────────────────────────────────────────────────── */

export function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<string>("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioAdmin | null>(
    null,
  );
  const [cambiando, setCambiando] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setLoadError(null);

    try {
      const datos = await listarUsuarios();
      setUsuarios(datos);
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar los usuarios.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const toggleEstado = async (usuario: UsuarioAdmin) => {
    setCambiando(usuario.id);
    setActionError(null);

    try {
      await cambiarEstadoUsuario(usuario.id, !usuario.activo);
      await cargar();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "No se pudo cambiar el estado del usuario.",
      );
    } finally {
      setCambiando(null);
    }
  };

  const filtrados = usuarios.filter((usuario) => {
    const nombreCompleto =
      `${usuario.nombres} ${usuario.apellidos}`.toLowerCase();

    const texto = busqueda.trim().toLowerCase();

    const coincideBusqueda =
      nombreCompleto.includes(texto) ||
      usuario.correo.toLowerCase().includes(texto);

    const coincideRol = filtroRol === "Todos" || usuario.rol === filtroRol;

    return coincideBusqueda && coincideRol;
  });

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5 text-foreground">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="usuarios-titulo" className="text-2xl font-semibold tracking-tight text-foreground sm:text-[25px]">
            Usuarios
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra las cuentas y sus asignaciones.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setActionError(null);
            setModalOpen(true);
          }}
          disabled={cargando || Boolean(loadError)}
          className="sigtau-accent-button inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-emerald-950 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60 sm:w-auto"
        >
          <Plus size={16} aria-hidden="true" />
          Nuevo usuario
        </button>
      </header>

      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {actionError}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-black/10 dark:border-[#30465C] dark:bg-[#192B3B]">
        <div className="border-b border-border px-4 py-4 has-[[role=status]]:pb-12 sm:has-[[role=status]]:pb-9 dark:border-[#30465C] sm:px-5">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
            <VoiceSearchInput
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por nombre o correo..."
              className="min-w-0 bg-input-background"
              style={{ fontSize: "0.875rem", lineHeight: "1.25rem" }}
            />

            <div className="relative min-w-0">
              <select
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                aria-label="Filtrar usuarios por rol"
                className="w-full appearance-none rounded-xl border border-border bg-input-background px-4 py-2.5 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Todos">Todos los roles</option>
                <option value="ESTUDIANTE">Estudiante</option>
                <option value="TUTOR">Tutor</option>
                <option value="COORDINADOR">Coordinador</option>
              </select>

              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {cargando ? (
          <div role="status" className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-muted-foreground">
            <Loader2 size={20} aria-hidden="true" className="animate-spin" />
            Cargando usuarios…
          </div>
        ) : loadError ? (
          <div className="px-4 py-10 text-center">
            <AlertCircle size={24} aria-hidden="true" className="mx-auto mb-2 text-destructive" />
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p>
            <button
              type="button"
              onClick={() => void cargar()}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <div
              role="region"
              aria-labelledby="usuarios-titulo"
              tabIndex={0}
              className="overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr
                    className="border-b border-border bg-secondary/60 dark:border-[#30465C] dark:bg-[#192B3B]"
                  >
                    {[
                      "Usuario",
                      "Correo",
                      "Rol",
                      "Detalle",
                      "Estado",
                      "Acciones",
                    ].map((encabezado) => (
                      <th
                        key={encabezado}
                        scope="col"
                        className="px-4 py-3 text-xs font-semibold text-muted-foreground sm:px-5"
                      >
                        {encabezado}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-border dark:divide-[#30465C]">
                  {filtrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="bg-card px-4 py-12 text-center text-sm text-muted-foreground dark:bg-[#1F2937]"
                      >
                        <Users size={24} aria-hidden="true" className="mx-auto mb-2" />
                        {usuarios.length === 0
                          ? "Sin usuarios registrados."
                          : "No se encontraron usuarios."}
                      </td>
                    </tr>
                  ) : (
                    filtrados.map((usuario) => (
                      <tr
                        key={usuario.id}
                        className="bg-card transition-colors hover:bg-secondary/40 dark:bg-[#1F2937] dark:hover:bg-[#24394D]"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              aria-hidden="true"
                              className="sigtau-primary-button flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-medium text-white"
                            >
                              {iniciales(usuario.nombres, usuario.apellidos)}
                            </div>

                            <span className="text-sm font-medium text-card-foreground">
                              {usuario.nombres} {usuario.apellidos}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-sm text-muted-foreground">
                          {usuario.correo}
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${ROL_STYLE[usuario.rol]}`}
                          >
                            {ROL_LABEL[usuario.rol]}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-sm text-muted-foreground">
                          {usuario.rol === "ESTUDIANTE" && (usuario.carnet ?? "—")}

                          {usuario.rol === "TUTOR" && (usuario.especialidad ?? "—")}

                          {usuario.rol === "COORDINADOR" && "—"}
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              usuario.activo ? ESTADO_ACTIVO : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {usuario.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setUsuarioEditando(usuario);
                              }}
                              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                              aria-label={`Editar a ${usuario.nombres} ${usuario.apellidos}`}
                              title="Editar usuario"
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => void toggleEstado(usuario)}
                              disabled={cambiando === usuario.id}
                              aria-label={`${usuario.activo ? "Desactivar" : "Activar"} a ${usuario.nombres} ${usuario.apellidos}`}
                              className={`inline-flex h-8 min-w-21 items-center justify-center whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 ${
                                usuario.activo
                                  ? "bg-destructive/10 text-red-700 hover:bg-destructive/20 dark:text-red-300"
                                  : `${ESTADO_ACTIVO} hover:bg-emerald-500/20`
                              }`}
                            >
                              {cambiando === usuario.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : usuario.activo ? (
                                "Desactivar"
                              ) : (
                                "Activar"
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-border px-4 py-3 dark:border-[#30465C] sm:px-5">
              <p role="status" className="text-xs text-muted-foreground">
                Mostrando {filtrados.length} de {usuarios.length} usuarios
              </p>
            </div>
          </>
        )}
      </section>

      {modalOpen && (
        <NuevoUsuarioModal
          onCreated={() => {
            setModalOpen(false);
            void cargar();
          }}
          onClose={() => setModalOpen(false)}
        />
      )}

      {usuarioEditando && (
        <NuevoUsuarioModal
          key={usuarioEditando.id}
          usuario={usuarioEditando}
          onCreated={() => {
            setUsuarioEditando(null);
            void cargar();
          }}
          onClose={() => setUsuarioEditando(null)}
        />
      )}
    </div>
  );
}
