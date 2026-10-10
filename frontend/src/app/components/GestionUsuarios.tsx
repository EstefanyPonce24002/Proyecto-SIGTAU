import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Loader2,
  AlertCircle,
  Users,
  ChevronDown,
  Pencil,
} from "lucide-react";
import {
  listarUsuarios,
  registrarUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  type UsuarioAdmin,
  type RegistroPayload,
} from "../lib/usuarios";
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

/* ── Modal: nuevo usuario ─────────────────────────────────────────────── */
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

  const set =
    (field: keyof RegistroPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (
      !form.nombres ||
      !form.apellidos ||
      !form.correo ||
      (!editando && form.contrasena.length < 8)
    ) {
      setError(
        editando
          ? "Completa nombres y apellidos."
          : "Completa nombres, apellidos, correo y una contraseña de al menos 8 caracteres.",
      );
      return;
    }
    if (form.rol === "ESTUDIANTE" && !form.carnet) {
      setError("El carnet es obligatorio para un estudiante.");
      return;
    }
    setSaving(true);
    try {
      if (editando) {
        await actualizarUsuario(usuario!.id, {
          nombres: form.nombres,
          apellidos: form.apellidos,
          carnet: form.carnet,
          carrera: form.carrera,
          especialidad: form.especialidad,
        });
      } else {
        await registrarUsuario(form);
      }
      onCreated();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo registrar el usuario.",
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
        aria-label={editando ? "Editar usuario" : "Nuevo usuario"}
        className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-secondary/30 px-5 py-4">
          <h3 className="text-card-foreground" style={{ fontSize: "0.95rem" }}>
            {editando ? "Editar usuario" : "Nuevo usuario"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar formulario de usuario"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="px-5 py-5 space-y-4 overflow-y-auto"
        >
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                className="text-card-foreground"
                style={{ fontSize: "0.85rem" }}
              >
                Nombres
              </label>
              <input
                value={form.nombres}
                onChange={set("nombres")}
                className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 text-card-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring"
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
                Apellidos
              </label>
              <input
                value={form.apellidos}
                onChange={set("apellidos")}
                className="w-full rounded-xl border border-border bg-input-background text-card-foreground px-4 py-2.5 outline-none focus:ring-2 transition-all"
                style={
                  {
                    fontSize: "0.875rem",
                    "--tw-ring-color": "#10B981",
                  } as React.CSSProperties
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              className="text-card-foreground"
              style={{ fontSize: "0.85rem" }}
            >
              Correo institucional
            </label>
            <input
              type="email"
              value={form.correo}
              onChange={set("correo")}
              disabled={editando}
              placeholder="usuario@universidad.edu.sv"
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
              Contraseña temporal
            </label>
            <input
              type="text"
              value={form.contrasena}
              onChange={set("contrasena")}
              placeholder={
                editando ? "No modificable aquí" : "Mínimo 8 caracteres"
              }
              disabled={editando}
              className="w-full rounded-xl border border-border bg-input-background text-card-foreground px-4 py-2.5 outline-none focus:ring-2 transition-all placeholder:text-muted-foreground"
              style={
                {
                  fontSize: "0.875rem",
                  "--tw-ring-color": "#10B981",
                  fontFamily: "var(--font-mono)",
                } as React.CSSProperties
              }
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="text-card-foreground"
              style={{ fontSize: "0.85rem" }}
            >
              Rol
            </label>
            <div className="relative">
              <select
                value={form.rol}
                onChange={set("rol")}
                disabled={editando}
                className="w-full appearance-none rounded-xl border border-border bg-input-background text-card-foreground px-4 py-2.5 pr-9 outline-none focus:ring-2 transition-all"
                style={
                  {
                    fontSize: "0.875rem",
                    "--tw-ring-color": "#10B981",
                  } as React.CSSProperties
                }
              >
                <option value="ESTUDIANTE">Estudiante</option>
                <option value="TUTOR">Tutor</option>
                <option value="COORDINADOR">Coordinador</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
          </div>

          {form.rol === "ESTUDIANTE" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  className="text-card-foreground"
                  style={{ fontSize: "0.85rem" }}
                >
                  Carnet
                </label>
                <input
                  value={form.carnet}
                  onChange={set("carnet")}
                  placeholder="20230187"
                  className="w-full rounded-xl border border-border bg-input-background text-card-foreground px-4 py-2.5 outline-none focus:ring-2 transition-all placeholder:text-muted-foreground"
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
                  Carrera
                </label>
                <input
                  value={form.carrera}
                  onChange={set("carrera")}
                  className="w-full rounded-xl border border-border bg-input-background text-card-foreground px-4 py-2.5 outline-none focus:ring-2 transition-all"
                  style={
                    {
                      fontSize: "0.875rem",
                      "--tw-ring-color": "#10B981",
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>
          )}

          {form.rol === "TUTOR" && (
            <div className="space-y-1.5">
              <label
                className="text-card-foreground"
                style={{ fontSize: "0.85rem" }}
              >
                Especialidad
              </label>
              <input
                value={form.especialidad}
                onChange={set("especialidad")}
                placeholder="Ej: Matemáticas y Programación"
                className="w-full rounded-xl border border-border bg-input-background text-card-foreground px-4 py-2.5 outline-none focus:ring-2 transition-all placeholder:text-muted-foreground"
                style={
                  {
                    fontSize: "0.875rem",
                    "--tw-ring-color": "#10B981",
                  } as React.CSSProperties
                }
              />
            </div>
          )}

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
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg, #1E3A8A, #3B82F6)",
                fontSize: "0.875rem",
              }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editando ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════ */
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

  const cargar = useCallback(() => {
    setCargando(true);
    setLoadError(null);
    listarUsuarios()
      .then(setUsuarios)
      .catch((err) =>
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar los usuarios.",
        ),
      )
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const toggleEstado = async (u: UsuarioAdmin) => {
    setCambiando(u.id);
    setActionError(null);
    try {
      await cambiarEstadoUsuario(u.id, !u.activo);
      cargar();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "No se pudo cambiar el estado.",
      );
    } finally {
      setCambiando(null);
    }
  };

  const filtrados = usuarios.filter((u) => {
    const nombreCompleto = `${u.nombres} ${u.apellidos}`.toLowerCase();
    const matchB =
      nombreCompleto.includes(busqueda.toLowerCase()) ||
      u.correo.toLowerCase().includes(busqueda.toLowerCase());
    const matchR = filtroRol === "Todos" || u.rol === filtroRol;
    return matchB && matchR;
  });

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
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-foreground">Gestión de Usuarios</h2>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-white transition-all hover:opacity-90 active:scale-95 shrink-0"
          style={{ background: "#10B981", fontSize: "0.875rem" }}
        >
          <Plus size={15} /> Nuevo usuario
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <VoiceSearchInput
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar..."
          className="flex-1"
          style={{ fontSize: "0.875rem" }}
        />
        <div className="relative">
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="appearance-none rounded-xl border border-border bg-card text-foreground px-4 py-2.5 pr-9 outline-none focus:ring-2 transition-all"
            style={
              {
                fontSize: "0.875rem",
                "--tw-ring-color": "#10B981",
              } as React.CSSProperties
            }
          >
            <option value="Todos">Todos los roles</option>
            <option value="ESTUDIANTE">Estudiante</option>
            <option value="TUTOR">Tutor</option>
            <option value="COORDINADOR">Coordinador</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "640px" }}>
            <thead>
              <tr
                className="border-b border-border"
                style={{ background: "rgba(245,158,11,0.1)" }}
              >
                {[
                  "Usuario",
                  "Correo",
                  "Rol",
                  "Detalle",
                  "Estado",
                  "Acción",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-muted-foreground"
                    style={{
                      fontSize: "0.72rem",
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
              {filtrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                    style={{ fontSize: "0.875rem" }}
                  >
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filtrados.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-secondary/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white"
                          style={{
                            background:
                              "linear-gradient(135deg, #1E3A8A, #3B82F6)",
                            fontSize: "0.65rem",
                          }}
                        >
                          {iniciales(u.nombres, u.apellidos)}
                        </div>
                        <span
                          className="text-foreground"
                          style={{ fontSize: "0.875rem" }}
                        >
                          {u.nombres} {u.apellidos}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-5 py-3.5 text-muted-foreground"
                      style={{ fontSize: "0.82rem" }}
                    >
                      {u.correo}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="rounded-full px-2.5 py-1"
                        style={{
                          fontSize: "0.72rem",
                          color: "#3B82F6",
                          background: "rgba(59,130,246,0.1)",
                        }}
                      >
                        {ROL_LABEL[u.rol]}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5 text-muted-foreground"
                      style={{ fontSize: "0.8rem" }}
                    >
                      {u.rol === "ESTUDIANTE" && (u.carnet ?? "—")}
                      {u.rol === "TUTOR" && (u.especialidad ?? "—")}
                      {u.rol === "COORDINADOR" && "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="rounded-full px-2.5 py-1"
                        style={{
                          fontSize: "0.72rem",
                          color: u.activo ? "#10B981" : "#6B7280",
                          background: u.activo
                            ? "rgba(16,185,129,0.12)"
                            : "rgba(122,144,184,0.12)",
                        }}
                      >
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setUsuarioEditando(u)}
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                          aria-label={`Editar a ${u.nombres} ${u.apellidos}`}
                          title="Editar usuario"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => toggleEstado(u)}
                          disabled={cambiando === u.id}
                          className="rounded-lg px-3 py-1.5 transition-all disabled:opacity-50"
                          style={{
                            fontSize: "0.78rem",
                            color: u.activo ? "#EF4444" : "#10B981",
                            background: u.activo
                              ? "rgba(239,68,68,0.08)"
                              : "rgba(16,185,129,0.1)",
                          }}
                        >
                          {cambiando === u.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : u.activo ? (
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
        <div className="px-5 py-3 border-t border-border">
          <p className="text-muted-foreground" style={{ fontSize: "0.78rem" }}>
            Mostrando {filtrados.length} de {usuarios.length} usuarios
          </p>
        </div>
      </div>

      {usuarios.length === 0 && (
        <div className="bg-card rounded-2xl border border-border py-16 text-center">
          <Users size={32} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-foreground" style={{ fontSize: "0.95rem" }}>
            Sin usuarios registrados
          </p>
        </div>
      )}

      {modalOpen && (
        <NuevoUsuarioModal
          onCreated={() => {
            setModalOpen(false);
            cargar();
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
            cargar();
          }}
          onClose={() => setUsuarioEditando(null)}
        />
      )}
    </div>
  );
}
