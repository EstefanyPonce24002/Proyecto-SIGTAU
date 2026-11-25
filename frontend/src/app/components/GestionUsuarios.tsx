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
  AlertTriangle,
} from "lucide-react";

import {
  listarUsuarios,
  registrarUsuario,
  registrarCoordinador,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

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

const ESTADO_ACTIVO =
  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";

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
    valor
      .trim()
      .split(/\s+/)[0]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const primerNombre = normalizar(nombres);
  const primerApellido = normalizar(apellidos);
  if (!primerNombre || !primerApellido) return "";

  const base =
    rol === "ESTUDIANTE"
      ? primerNombre[0] + primerApellido[0]
      : `${primerNombre}.${primerApellido}`;

  return `${base}@sigtau.edu.sv`;
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

  const actualizarNombre = (field: "nombres" | "apellidos", value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
        if (form.rol === "COORDINADOR") {
          await registrarCoordinador(form);
        } else {
          await registrarUsuario(form);
        }
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
                onChange={(e) => actualizarNombre("nombres", e.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-[#118AB2] bg-input-background px-4 py-2.5 text-sm outline-none focus:border-[#118AB2] focus:ring-2 focus:ring-[#118AB2]"
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
                onChange={(e) => actualizarNombre("apellidos", e.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-[#118AB2] bg-input-background px-4 py-2.5 text-sm outline-none focus:border-[#118AB2] focus:ring-2 focus:ring-[#118AB2]"
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
                disabled={saving}
                placeholder="Se generará al ingresar nombres y apellidos"
                className="w-full min-w-0 rounded-xl border border-[#118AB2] bg-input-background px-4 py-2.5 text-sm outline-none focus:border-[#118AB2] focus:ring-2 focus:ring-[#118AB2]"
              />
              <p className="text-xs text-muted-foreground">
                {form.rol === "ESTUDIANTE"
                  ? "Se forma con las iniciales del primer nombre y del primer apellido."
                  : "Se forma como primerNombre.primerApellido@sigtau.edu.sv."}{" "}
                Si ya existe, el backend agregará un correlativo
                automáticamente.
              </p>
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
                className="w-full appearance-none rounded-xl border border-[#118AB2] bg-input-background px-4 py-2.5 pr-9 text-sm outline-none focus:border-[#118AB2] focus:ring-2 focus:ring-[#118AB2] disabled:opacity-60"
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
              className="w-full rounded-xl border border-[#118AB2] bg-input-background px-4 py-2.5 text-sm outline-none focus:border-[#118AB2] focus:ring-2 focus:ring-[#118AB2]"
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
                className="w-full rounded-xl border border-[#118AB2] bg-input-background px-4 py-2.5 text-sm outline-none focus:border-[#118AB2] focus:ring-2 focus:ring-[#118AB2]"
              />
            </div>
          )}

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
                  className="w-full rounded-xl border border-[#118AB2] bg-input-background px-4 py-2.5 text-sm outline-none focus:border-[#118AB2] focus:ring-2 focus:ring-[#118AB2]"
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
                  className="w-full rounded-xl border border-[#118AB2] bg-input-background px-4 py-2.5 text-sm outline-none focus:border-[#118AB2] focus:ring-2 focus:ring-[#118AB2]"
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
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_ACTIVO}`}
                    >
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
              className="rounded-xl border border-[#65323F] bg-[#252B3A] px-5 py-2.5 text-sm font-medium text-[#FF5C65] transition-colors hover:border-[#FF5C65] hover:bg-[#2D3040] disabled:opacity-50"
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#118AB2] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0F789A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#118AB2] disabled:cursor-not-allowed disabled:opacity-60"
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

function ConfirmarDesactivacionUsuario({
  usuario,
  enviando,
  error,
  onConfirm,
  onClose,
}: {
  usuario: UsuarioAdmin;
  enviando: boolean;
  error: string | null;
  onConfirm: (contrasenaActual: string) => void;
  onClose: () => void;
}) {
  const [contrasenaActual, setContrasenaActual] = useState("");

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !enviando) onClose();
      }}
    >
      <AlertDialogContent className="max-w-md rounded-2xl border-border bg-card shadow-2xl">
        <AlertDialogHeader>
          <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertTriangle size={22} aria-hidden="true" />
          </div>
          <AlertDialogTitle>¿Desactivar esta cuenta?</AlertDialogTitle>
          <AlertDialogDescription>
            Se desactivará la cuenta de {usuario.nombres} {usuario.apellidos}.
            Confirma la acción con la contraseña de tu cuenta de coordinación.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <label className="space-y-1.5 text-sm font-medium" htmlFor="contrasena-coordinacion">
          Contraseña de coordinación
          <input
            id="contrasena-coordinacion"
            type="password"
            autoComplete="current-password"
            value={contrasenaActual}
            onChange={(event) => setContrasenaActual(event.target.value)}
            disabled={enviando}
            className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 font-normal outline-none transition focus:border-[#118AB2] focus:ring-2 focus:ring-[#118AB2]"
          />
        </label>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={enviando}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={enviando || !contrasenaActual.trim()}
            onClick={(event) => {
              event.preventDefault();
              onConfirm(contrasenaActual);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {enviando ? "Desactivando..." : "Desactivar cuenta"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type FiltroEstado = "Todos" | "ACTIVO" | "INACTIVO";

export function GestionUsuarios({
  idUsuarioActual,
}: {
  idUsuarioActual: number;
}) {
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
  const [usuarioDesactivando, setUsuarioDesactivando] =
    useState<UsuarioAdmin | null>(null);
  const [errorDesactivacion, setErrorDesactivacion] = useState<string | null>(
    null,
  );

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

  const confirmarDesactivacion = async (contrasenaActual: string) => {
    if (!usuarioDesactivando) return;
    setCambiando(usuarioDesactivando.id);
    setErrorDesactivacion(null);

    try {
      await cambiarEstadoUsuario(
        usuarioDesactivando.id,
        false,
        contrasenaActual,
      );
      setUsuarioDesactivando(null);
      await cargar();
    } catch (err) {
      setErrorDesactivacion(
        err instanceof ApiError
          ? err.message
          : "No se pudo desactivar el usuario.",
      );
    } finally {
      setCambiando(null);
    }
  };

  const solicitarCambioEstado = (usuario: UsuarioAdmin) => {
    setActionError(null);
    if (usuario.activo) {
      setErrorDesactivacion(null);
      setUsuarioDesactivando(usuario);
      return;
    }
    void toggleEstado(usuario);
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
        usuario.codigoTutor?.toLowerCase().includes(texto),
      );

    const coincideRol = filtroRol === "Todos" || usuario.rol === filtroRol;

    const coincideEstado =
      filtroEstado === "Todos" ||
      (filtroEstado === "ACTIVO" && usuario.activo) ||
      (filtroEstado === "INACTIVO" && !usuario.activo);

    return coincideBusqueda && coincideRol && coincideEstado;
  });

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5 text-foreground">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="usuarios-titulo"
            className="text-2xl font-semibold tracking-tight text-foreground sm:text-[25px]"
          >
            Administra el registro de nuevos usuarios
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            setActionError(null);
            setModalOpen(true);
          }}
          disabled={cargando || Boolean(loadError)}
          className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60 sm:w-auto"
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
            {/* Búsqueda con focus aplicado */}
            <div className="min-w-0 border border-[#118AB2] rounded-2xl sm:w-80 lg:w-96 focus-within:ring-[#118AB2] transition-all">
              <VoiceSearchInput
                value={busqueda}
                onChange={setBusqueda}
                placeholder="Buscar por nombre, correo o carné..."
                className="min-w-0 w-full focus:outline-none"
                style={{ fontSize: "0.875rem" }}
              />
            </div>

            <div className="relative self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setMostrarFiltros((actual) => !actual)}
                aria-expanded={mostrarFiltros}
                aria-controls="filtro-usuarios"
                className={`flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-[#118AB2] px-4 text-sm text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-[#118AB2] sm:w-44 ${
                  mostrarFiltros ? "ring-2 ring-[#118AB2]" : ""
                }`}
                style={{
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
                        className="mt-1.5 h-10 w-full appearance-none rounded-xl border bg-[#263746] px-3 text-sm text-[#F1F5F9] outline-none focus:border-[#118AB2] focus:ring-2 focus:ring-[#118AB2]"
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
                        className="mt-1.5 h-10 w-full appearance-none rounded-xl border bg-[#263746] px-3 text-sm text-[#F1F5F9] outline-none focus:border-[#118AB2] focus:ring-2 focus:ring-[#118AB2]"
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

        {/* Celular: cada usuario como tarjeta y tableta (la tabla de 7 columnas no cabe por debajo de 1024 px) */}
        <ul
          className="divide-y divide-[#30465C] lg:hidden"
          aria-label="Usuarios registrados"
        >
          {cargando ? (
            <li className="px-4 py-10 text-center text-sm text-[#D5DEE8]">
              <span role="status">Cargando usuarios...</span>
            </li>
          ) : loadError ? (
            <li className="px-4 py-8 text-center text-sm">
              <p role="alert" className="text-[#F87171]">
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => void cargar()}
                className="mt-4 min-h-11 rounded-xl bg-primary px-4 py-2 text-primary-foreground"
              >
                Reintentar
              </button>
            </li>
          ) : filtrados.length === 0 ? (
            <li className="bg-[#1D3043] px-4 py-10 text-center text-sm text-[#D5DEE8]">
              {usuarios.length === 0
                ? "Sin usuarios registrados."
                : "No se encontraron usuarios."}
            </li>
          ) : (
            filtrados.map((usuario) => {
              const identificador =
                usuario.rol === "ESTUDIANTE"
                  ? usuario.carnet
                  : usuario.rol === "TUTOR"
                    ? usuario.codigoTutor
                    : null;
              return (
                <li
                  key={usuario.id}
                  className="bg-[#1F2937] px-4 py-4 text-[#F1F5F9]"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs text-white"
                      style={{
                        background: "linear-gradient(135deg, #1E3A8A, #3B82F6)",
                      }}
                      aria-hidden="true"
                    >
                      {iniciales(usuario.nombres, usuario.apellidos)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {usuario.nombres} {usuario.apellidos}
                      </p>
                      <p className="break-all text-xs text-[#D5DEE8]">
                        {usuario.correo}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#D5DEE8]">
                        <span>{ROL_LABEL[usuario.rol]}</span>
                        {identificador && (
                          <span className="font-mono">· {identificador}</span>
                        )}
                        {usuario.telefono && <span>· {usuario.telefono}</span>}
                        <span
                          className="rounded-md px-2 py-0.5 font-medium"
                          style={{
                            color: usuario.activo ? "#34D399" : "#CBD5E1",
                            background: usuario.activo
                              ? "rgba(16,185,129,0.12)"
                              : "rgba(100,116,139,0.2)",
                          }}
                        >
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActionError(null);
                        setUsuarioEditando(usuario);
                      }}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#30465C] text-sm text-[#F1F5F9] transition-colors hover:bg-[#24394D]"
                      aria-label={`Editar a ${usuario.nombres} ${usuario.apellidos}`}
                    >
                      <Pencil size={14} aria-hidden="true" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => solicitarCambioEstado(usuario)}
                      disabled={
                        cambiando === usuario.id ||
                        (usuario.activo && usuario.id === idUsuarioActual)
                      }
                      title={
                        usuario.activo && usuario.id === idUsuarioActual
                          ? "No puedes desactivar la cuenta que estás usando"
                          : undefined
                      }
                      aria-label={`${usuario.activo ? (usuario.id === idUsuarioActual ? "Cuenta actual, no se puede desactivar" : "Desactivar") : "Activar"} a ${usuario.nombres} ${usuario.apellidos}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                      style={{
                        color: usuario.activo ? "#F87171" : "#34D399",
                        background: usuario.activo
                          ? "rgba(239,68,68,0.1)"
                          : "rgba(16,185,129,0.12)",
                      }}
                    >
                      {cambiando === usuario.id ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                          aria-label="Procesando"
                        />
                      ) : usuario.activo ? (
                        usuario.id === idUsuarioActual
                          ? "Cuenta actual"
                          : "Desactivar"
                      ) : (
                        "Activar"
                      )}
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>

        {/* Tabla: pantallas de 1024 px o más */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left" style={{ minWidth: "960px" }}>
            <thead>
              <tr className="border-b border-[#30465C] bg-[#192B3B]">
                {[
                  "Identificador",
                  "Usuario",
                  "Correo",
                  "Teléfono",
                  "Rol",
                  "Estado",
                  "Acciones",
                ].map((encabezado) => (
                  <th
                    key={encabezado}
                    className="px-5 py-3 text-left text-xs font-medium text-[#A8B7C8]"
                  >
                    {encabezado}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#30465C]">
              {cargando ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    <span role="status">Cargando usuarios...</span>
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm">
                    <p role="alert" className="text-destructive">
                      {loadError}
                    </p>
                    <button
                      type="button"
                      onClick={() => void cargar()}
                      className="mt-4 rounded-xl bg-primary px-4 py-2 text-primary-foreground"
                    >
                      Reintentar
                    </button>
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
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
                      <span className="text-xs text-[#F1F5F9]">
                        {usuario.rol === "ESTUDIANTE"
                          ? (usuario.carnet ?? "—")
                          : usuario.rol === "TUTOR"
                            ? (usuario.codigoTutor ?? "—")
                            : ""}
                      </span>
                    </td>

                    {/* Usuario: avatar + nombre */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#118AB2] text-xs text-white"
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
                      <p
                        className="truncate text-sm text-[#D5DEE8]"
                        title={usuario.correo}
                      >
                        {usuario.correo}
                      </p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="text-sm text-[#D5DEE8]">
                        {usuario.telefono ?? "—"}
                      </p>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="text-xs text-[#D5DEE8]">
                        {ROL_LABEL[usuario.rol]}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className="rounded-md px-2 py-0.5 text-xs font-medium"
                        style={{
                          color: usuario.activo ? "#34D399" : "#CBD5E1",
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
                          onClick={() => solicitarCambioEstado(usuario)}
                          disabled={
                            cambiando === usuario.id ||
                            (usuario.activo && usuario.id === idUsuarioActual)
                          }
                          title={
                            usuario.activo && usuario.id === idUsuarioActual
                              ? "No puedes desactivar la cuenta que estás usando"
                              : undefined
                          }
                          aria-label={`${usuario.activo ? (usuario.id === idUsuarioActual ? "Cuenta actual, no se puede desactivar" : "Desactivar") : "Activar"} a ${usuario.nombres} ${usuario.apellidos}`}
                          className={`rounded-lg px-3 py-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 ${
                            usuario.activo
                              ? "hover:bg-red-500/25 active:bg-red-500/40 focus-visible:ring-red-500"
                              : "hover:bg-emerald-500/25 active:bg-emerald-500/40 focus-visible:ring-emerald-500"
                          }`}
                          style={{
                            fontSize: "0.78rem",
                            color: usuario.activo ? "#F87171" : "#34D399",
                            background: usuario.activo
                              ? "rgba(239,68,68,0.08)"
                              : "rgba(16,185,129,0.1)",
                          }}
                        >
                          {cambiando === usuario.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : usuario.activo ? (
                            usuario.id === idUsuarioActual
                              ? "Cuenta actual"
                              : "Desactivar"
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

      {usuarioDesactivando && (
        <ConfirmarDesactivacionUsuario
          usuario={usuarioDesactivando}
          enviando={cambiando === usuarioDesactivando.id}
          error={errorDesactivacion}
          onConfirm={(contrasenaActual) =>
            void confirmarDesactivacion(contrasenaActual)
          }
          onClose={() => {
            setUsuarioDesactivando(null);
            setErrorDesactivacion(null);
          }}
        />
      )}
    </div>
  );
}
