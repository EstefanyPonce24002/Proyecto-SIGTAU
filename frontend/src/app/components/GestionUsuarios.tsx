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

function iniciales(nombres: string, apellidos: string): string {
  return `${nombres[0] ?? ""}${apellidos[0] ?? ""}`.toUpperCase();
}

function generarCorreoVistaPrevia(
  nombres: string,
  apellidos: string,
  rol: Rol,
): string {
  if (!nombres.trim() || !apellidos.trim()) return "";

  const normalizar = (valor: string) =>
    valor.trim().split(/\s+/)[0]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const primerNombre = normalizar(nombres);
  const primerApellido = normalizar(apellidos);
  if (!primerNombre || !primerApellido) return "";

  if (rol === "ESTUDIANTE") {
    return primerNombre[0] + primerApellido[0] + "@sigtau.edu.sv";
  }

  if (rol === "TUTOR") {
    return primerNombre + "." + primerApellido + "@sigtau.edu.sv";
  }

  return "";
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
    telefono: usuario?.telefono ?? "",
    contrasena: "",
    rol: usuario?.rol ?? "ESTUDIANTE",
    carrera: usuario?.carrera ?? "",
    especialidad: usuario?.especialidad ?? "",
  });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const correoVistaPrevia = generarCorreoVistaPrevia(
    form.nombres,
    form.apellidos,
    form.rol,
  );

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

    if (!form.nombres.trim() || !form.apellidos.trim()) {
      setError("Completa nombres y apellidos.");
      return;
    }

    if (!editando && form.contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
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
          telefono: form.telefono?.trim() ?? "",
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
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-secondary/30 px-5 py-4">
          <h3 className="font-medium">
            {editando ? "Editar usuario" : "Nuevo usuario"}
          </h3>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar formulario"
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
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

          {!editando && (
            <div className="space-y-1.5">
              <label htmlFor="correo" className="text-sm">
                Correo institucional
              </label>
              <input
                id="correo"
                type="email"
                value={correoVistaPrevia}
                readOnly
                placeholder="Se generará al ingresar nombres y apellidos"
                disabled={saving || form.rol === "COORDINADOR"}
                className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm outline-none"
              />
              <p className="text-xs text-muted-foreground">
                {form.rol === "ESTUDIANTE"
                  ? "Se forma con la inicial del primer nombre y del primer apellido."
                  : form.rol === "TUTOR"
                    ? "Se forma como primerNombre.primerApellido@sigtau.edu.sv."
                    : "La creación de coordinadores no está habilitada."}
                {" "}Si la dirección ya existe, el sistema agregará un correlativo al registrarla.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="telefono" className="text-sm">
              Teléfono
            </label>
            <input
              id="telefono"
              type="tel"
              maxLength={25}
              value={form.telefono ?? ""}
              onChange={set("telefono")}
              disabled={saving}
              placeholder="+503 7000 0000"
              className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
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
                <option value="COORDINADOR" disabled>Coordinador</option>
              </select>

              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
            {!editando && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {form.rol === "ESTUDIANTE"
                  ? "El carné se genera automáticamente con las iniciales del nombre y apellido más un correlativo."
                  : form.rol === "TUTOR"
                    ? "El código del tutor se genera automáticamente con el formato TUT-0001."
                    : "El coordinador no utiliza un identificador en esta tabla."}
              </p>
            )}
          </div>

          {form.rol === "ESTUDIANTE" && (
            <div className="space-y-1.5">
              <div className="space-y-1.5">
                <label htmlFor="carrera" className="text-sm">
                  Carrera <span className="text-red-500">*</span>
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
                  <option value="Ingeniería Civil">Ingeniería Civil</option>
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
              <section className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-emerald-600" />
                    <h4 className="text-sm font-medium">
                      Asignaturas del tutor
                    </h4>
                  </div>

                  {!cargandoAsignaturas && !errorAsignaturas && (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-600">
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
                                className="shrink-0 text-emerald-600"
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
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "#118AB2" }}
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

type FiltroEstado = "Todos" | "ACTIVO" | "INACTIVO";

export function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<string>("Todos");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("Todos");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
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
      !texto ||
      nombreCompleto.includes(texto) ||
      usuario.correo.toLowerCase().includes(texto) ||
      Boolean(
        usuario.carnet?.toLowerCase().includes(texto) ||
        usuario.codigoTutor?.toLowerCase().includes(texto)
      );

    const coincideRol = filtroRol === "Todos" || usuario.rol === filtroRol;

    const coincideEstado =
      filtroEstado === "Todos" ||
      (filtroEstado === "ACTIVO" && usuario.activo) ||
      (filtroEstado === "INACTIVO" && !usuario.activo);

    return coincideBusqueda && coincideRol && coincideEstado;
  });

  if (cargando) {
    return (
      <div className="flex w-full items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <AlertCircle size={24} className="mx-auto mb-2 text-destructive" />
        <p className="mb-4 text-sm text-destructive">{loadError}</p>
        <button
          type="button"
          onClick={() => void cargar()}
          className="rounded-xl px-4 py-2 text-sm text-white"
          style={{ background: "#118AB2" }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      {/* Encabezado fuera de la card */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Gestiona el registro de nuevos usuarios</h2>
        </div>

        <button
          type="button"
          onClick={() => {
            setActionError(null);
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "#118ab2", fontSize: "0.875rem" }}
        >
          <Plus size={15} /> Nuevo usuario
        </button>
      </div>

      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3"
        >
          <p className="text-sm text-destructive">{actionError}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {/* Cabecera de la card */}
        <div
          className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between"
          style={{ background: "#192b3b", borderColor: "#30465c" }}
        >
          <h3 className="shrink-0 text-base font-semibold text-foreground">
            Usuarios registrados
          </h3>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <VoiceSearchInput
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por nombre, correo o carné..."
              className="min-w-0 sm:w-80 lg:w-96"
              style={{ fontSize: "0.875rem" }}
            />

            <div className="relative self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setMostrarFiltros((actual) => !actual)}
                aria-expanded={mostrarFiltros}
                aria-controls="filtro-usuarios"
                className={`flex h-11 w-full items-center justify-between gap-3 rounded-2xl border px-4 text-sm text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring sm:w-44 ${
                  mostrarFiltros ? "ring-2 ring-ring" : ""
                }`}
                style={{
                  borderColor: "var(--border-strong)",
                  background: "var(--input-background)",
                }}
              >
                <span>Filtrar</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    mostrarFiltros ? "rotate-180" : ""
                  }`}
                  style={{ color: "#b8c5d1" }}
                />
              </button>

              {mostrarFiltros && (
                <>
                  <button
                    type="button"
                    aria-label="Cerrar filtros"
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setMostrarFiltros(false)}
                  />
                  <div
                    id="filtro-usuarios"
                    className="absolute right-0 z-30 mt-2 w-64 space-y-3 rounded-2xl border border-[#30465C] bg-[#1D3043] p-3 shadow-xl"
                  >
                    <label className="block text-xs font-medium text-[#A8B7C8]">
                      Rol
                      <select
                        value={filtroRol}
                        onChange={(e) => setFiltroRol(e.target.value)}
                        aria-label="Filtrar usuarios por rol"
                        className="mt-1.5 h-10 w-full appearance-none rounded-xl border bg-[#263746] px-3 text-sm text-[#F1F5F9] outline-none focus:ring-2 focus:ring-ring"
                        style={{ borderColor: "var(--border-strong)" }}
                      >
                        <option value="Todos">Todos los roles</option>
                        <option value="ESTUDIANTE">Estudiante</option>
                        <option value="TUTOR">Tutor</option>
                        <option value="COORDINADOR">Coordinador</option>
                      </select>
                    </label>

                    <label className="block text-xs font-medium text-[#A8B7C8]">
                      Estado
                      <select
                        value={filtroEstado}
                        onChange={(e) =>
                          setFiltroEstado(e.target.value as FiltroEstado)
                        }
                        aria-label="Filtrar usuarios por estado"
                        className="mt-1.5 h-10 w-full appearance-none rounded-xl border bg-[#263746] px-3 text-sm text-[#F1F5F9] outline-none focus:ring-2 focus:ring-ring"
                        style={{ borderColor: "var(--border-strong)" }}
                      >
                        <option value="Todos">Todos los estados</option>
                        <option value="ACTIVO">Activos</option>
                        <option value="INACTIVO">Inactivos</option>
                      </select>
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: "880px" }}>
            <thead>
              <tr className="border-b border-[#30465C] bg-[#192B3B]">
                {["Identificador", "Usuario", "Correo", "Teléfono", "Rol", "Estado", "Acciones"].map(
                  (encabezado) => (
                    <th
                      key={encabezado}
                      className="px-5 py-3 text-left text-xs font-medium text-[#A8B7C8]"
                    >
                      {encabezado}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#30465C]">
              {filtrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="bg-[#1D3043] py-12 text-center text-sm text-[#D5DEE8]"
                  >
                    {usuarios.length === 0
                      ? "Sin usuarios registrados."
                      : "No se encontraron usuarios."}
                  </td>
                </tr>
              ) : (
                filtrados.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="bg-[#1F2937] text-sm text-[#F1F5F9] transition-colors hover:bg-[#24394D]"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm text-[#F1F5F9]">
                        {usuario.rol === "ESTUDIANTE"
                          ? usuario.carnet ?? "—"
                          : usuario.rol === "TUTOR"
                            ? usuario.codigoTutor ?? "—"
                            : "—"}
                      </span>
                    </td>

                    {/* Usuario: avatar + nombre */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs text-white"
                          style={{
                            background:
                              "linear-gradient(135deg, #1E3A8A, #3B82F6)",
                          }}
                        >
                          {iniciales(usuario.nombres, usuario.apellidos)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm text-[#F1F5F9]">
                            {usuario.nombres} {usuario.apellidos}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="max-w-[240px] px-5 py-3.5">
                      <p className="truncate text-sm text-[#D5DEE8]" title={usuario.correo}>
                        {usuario.correo}
                      </p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="text-sm text-[#D5DEE8]">
                        {usuario.telefono ?? "—"}
                      </p>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className="text-xs text-[#D5DEE8]"
                      >
                        {ROL_LABEL[usuario.rol]}
                      </span>
                    </td>


                    <td className="px-5 py-3.5">
                      <span
                        className="rounded-md px-2 py-0.5 text-[0.7rem] font-medium"
                        style={{
                          color: usuario.activo ? "#059669" : "#64748B",
                          background: usuario.activo
                            ? "rgba(16,185,129,0.12)"
                            : "rgba(100,116,139,0.12)",
                        }}
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
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
                          aria-label={`Editar a ${usuario.nombres} ${usuario.apellidos}`}
                          title="Editar usuario"
                        >
                          <Pencil size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => void toggleEstado(usuario)}
                          disabled={cambiando === usuario.id}
                          className={`rounded-lg px-3 py-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 ${
                            usuario.activo
                              ? "hover:bg-red-500/25 active:bg-red-500/40 focus-visible:ring-red-500"
                              : "hover:bg-emerald-500/25 active:bg-emerald-500/40 focus-visible:ring-emerald-500"
                          }`}
                          style={{
                            fontSize: "0.78rem",
                            color: usuario.activo ? "#EF4444" : "#10B981",
                            background: usuario.activo
                              ? "rgba(239,68,68,0.08)"
                              : "rgba(16,185,129,0.1)",
                          }}
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

        <div className="border-t border-[#30465C] bg-[#182A39] px-5 py-3">
          <p className="text-xs text-[#A8B7C8]">
            Mostrando {filtrados.length} de {usuarios.length} usuarios
          </p>
        </div>
      </div>

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