import { useState, useEffect, useCallback } from "react";
import { Plus, Users, X, Loader2, AlertCircle, BookOpen, Check } from "lucide-react";
import {
  listarTodasLasAsignaturas, crearAsignatura, cambiarEstadoAsignatura,
  listarTutoresPorAsignatura, listarTodosLosTutores,
  asignarTutorAAsignatura, quitarTutorDeAsignatura,
  type Asignatura, type TutorOption,
} from "../lib/catalogo";
import { ApiError } from "../lib/api";

function NuevaAsignaturaModal({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true);
    setError(null);
    try {
      await crearAsignatura(nombre.trim(), codigo.trim());
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la asignatura.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Nueva asignatura" className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-xl">
        <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-4">
          <h3 className="text-card-foreground" style={{ fontSize: "0.95rem" }}>Nueva asignatura</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar nueva asignatura" className="text-muted-foreground hover:text-foreground transition-colors"><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {error && (
            <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-destructive" style={{ fontSize: "0.82rem" }}>{error}</p>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-card-foreground" style={{ fontSize: "0.85rem" }}>Nombre</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Estructuras de Datos"
              className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 text-card-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
              style={{ fontSize: "0.875rem", "--tw-ring-color": "#10B981" } as React.CSSProperties} />
          </div>
          <div className="space-y-1.5">
            <label className="text-card-foreground" style={{ fontSize: "0.85rem" }}>Código <span className="text-muted-foreground">(opcional)</span></label>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: SIS-210"
              className="w-full rounded-xl border border-border bg-input-background text-card-foreground px-4 py-2.5 outline-none focus:ring-2 transition-all placeholder:text-muted-foreground"
              style={{ fontSize: "0.875rem", "--tw-ring-color": "#10B981" } as React.CSSProperties} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-border py-2.5 text-foreground hover:bg-secondary transition-all"
              style={{ fontSize: "0.875rem" }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #1E3A8A, #3B82F6)", fontSize: "0.875rem" }}>
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
  asignatura, onClose,
}: { asignatura: Asignatura; onClose: () => void }) {
  const [asignados,  setAsignados]  = useState<TutorOption[]>([]);
  const [todos,      setTodos]      = useState<TutorOption[]>([]);
  const [cargando,   setCargando]   = useState(true);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    Promise.all([listarTutoresPorAsignatura(asignatura.id), listarTodosLosTutores()])
      .then(([asig, all]) => { setAsignados(asig); setTodos(all); })
      .catch(() => setError("No se pudo cargar la lista de tutores."))
      .finally(() => setCargando(false));
  }, [asignatura.id]);

  useEffect(() => { cargar(); }, [cargar]);

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
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar la asignación.");
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Gestionar tutores" className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-card-foreground" style={{ fontSize: "0.95rem" }}>Gestionar tutores</h3>
            <p className="text-muted-foreground" style={{ fontSize: "0.78rem" }}>{asignatura.nombre}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar gestión de tutores" className="text-muted-foreground hover:text-foreground transition-colors"><X size={15} /></button>
        </div>

        {error && (
          <div className="mx-5 mt-4 rounded-xl px-3 py-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-destructive" style={{ fontSize: "0.82rem" }}>{error}</p>
          </div>
        )}

        {cargando ? (
          <div className="py-12 flex justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {todos.length === 0 && (
              <p className="text-muted-foreground text-center py-8" style={{ fontSize: "0.85rem" }}>No hay tutores registrados.</p>
            )}
            {todos.map((t) => {
              const asignado = idsAsignados.has(t.id);
              return (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-foreground" style={{ fontSize: "0.875rem" }}>{t.nombreCompleto}</p>
                    {t.especialidad && <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{t.especialidad}</p>}
                  </div>
                  <button onClick={() => toggle(t.id, asignado)} disabled={procesando === t.id}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all disabled:opacity-60"
                    style={{
                      background: asignado ? "rgba(16,185,129,0.12)" : "var(--secondary)",
                      color: asignado ? "#10B981" : "var(--muted-foreground)",
                      fontSize: "0.78rem",
                    }}>
                    {procesando === t.id ? <Loader2 size={13} className="animate-spin" /> : asignado ? <Check size={13} /> : <Plus size={13} />}
                    {asignado ? "Asignado" : "Asignar"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="px-5 py-4 border-t border-border">
          <button onClick={onClose} className="w-full rounded-xl py-2.5 text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #1E3A8A, #3B82F6)", fontSize: "0.875rem" }}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

export function Asignaturas() {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [cargando,    setCargando]    = useState(true);
  const [loadError,   setLoadError]   = useState<string | null>(null);
  const [modalNueva,  setModalNueva]  = useState(false);
  const [gestionando, setGestionando] = useState<Asignatura | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setLoadError(null);
    listarTodasLasAsignaturas()
      .then(setAsignaturas)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "No se pudieron cargar las asignaturas."))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const toggleActiva = async (a: Asignatura) => {
    try {
      await cambiarEstadoAsignatura(a.id, !a.activa);
      cargar();
    } catch {
      setLoadError("No se pudo cambiar el estado de la asignatura.");
    }
  };

  if (cargando) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground">Asignaturas</h2>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            RF-05 / RF-12 · {asignaturas.length} registradas
          </p>
        </div>
        <button onClick={() => setModalNueva(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "#10B981", fontSize: "0.875rem" }}>
          <Plus size={15} /> Nueva asignatura
        </button>
      </div>

      {loadError && (
        <div className="rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-destructive" style={{ fontSize: "0.85rem" }}>{loadError}</p>
        </div>
      )}

      {asignaturas.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border py-16 text-center">
          <BookOpen size={32} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-foreground" style={{ fontSize: "0.95rem" }}>Sin asignaturas registradas</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {asignaturas.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(16,185,129,0.1)" }}>
                  <BookOpen size={15} style={{ color: "#10B981" }} />
                </div>
                <div>
                  <p className="text-foreground" style={{ fontSize: "0.9rem" }}>{a.nombre}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                    {a.codigo ?? "Sin código"} · {a.activa ? "Activa" : "Inactiva"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setGestionando(a)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                  style={{ fontSize: "0.78rem" }}>
                  <Users size={13} /> Tutores
                </button>
                <button onClick={() => toggleActiva(a)}
                  className="rounded-lg px-3 py-1.5 transition-all"
                  style={{
                    fontSize: "0.78rem",
                    color: a.activa ? "#EF4444" : "#10B981",
                    background: a.activa ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.1)",
                  }}>
                  {a.activa ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalNueva && <NuevaAsignaturaModal onCreated={() => { setModalNueva(false); cargar(); }} onClose={() => setModalNueva(false)} />}
      {gestionando && <GestionarTutoresModal asignatura={gestionando} onClose={() => setGestionando(null)} />}
    </div>
  );
}
