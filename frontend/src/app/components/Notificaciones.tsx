import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, Clock, Bell, CheckCheck, Loader2 } from "lucide-react";
import { listarNotificaciones, marcarNotificacionLeida, marcarTodasLeidas, type Notificacion, type TipoNotificacion } from "../lib/notificaciones";
import { ApiError } from "../lib/api";

const ICONO: Record<TipoNotificacion, React.ElementType> = {
  APROBACION: CheckCircle2,
  CANCELACION: AlertCircle,
  RECHAZO: AlertCircle,
  CAMBIO_HORARIO: Clock,
  RECORDATORIO: Clock,
  OBSERVACION: Info,
};

const COLOR: Record<TipoNotificacion, string> = {
  APROBACION: "#10B981",
  CANCELACION: "#EF4444",
  RECHAZO: "#EF4444",
  CAMBIO_HORARIO: "#F59E0B",
  RECORDATORIO: "#F59E0B",
  OBSERVACION: "#3B82F6",
};

const TITULO: Record<TipoNotificacion, string> = {
  APROBACION: "Solicitud aprobada",
  CANCELACION: "Tutoría cancelada",
  RECHAZO: "Solicitud rechazada",
  CAMBIO_HORARIO: "Cambio de horario",
  RECORDATORIO: "Recordatorio",
  OBSERVACION: "Seguimiento registrado",
};

function formatFechaHora(fechaISO: string): string {
  const d = new Date(fechaISO);
  return d.toLocaleString("es-SV", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"todas" | "no_leidas">("todas");

  const cargar = useCallback(() => {
    setCargando(true);
    setLoadError(null);
    listarNotificaciones()
      .then(setNotificaciones)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "No se pudieron cargar las notificaciones."))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const marcarLeida = async (id: number) => {
    try {
      await marcarNotificacionLeida(id);
      setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    } catch {
      setLoadError("No se pudo marcar como leída.");
    }
  };

  const marcarTodas = async () => {
    try {
      await marcarTodasLeidas();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch {
      setLoadError("No se pudieron marcar todas como leídas.");
    }
  };

  const noLeidas = notificaciones.filter((n) => !n.leida).length;
  const mostradas = filtro === "no_leidas" ? notificaciones.filter((n) => !n.leida) : notificaciones;

  if (cargando) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Notificaciones
            {noLeidas > 0 && (
              <span className="rounded-full px-2 py-0.5 text-white" style={{ fontSize: "0.72rem", background: "#10B981" }}>
                {noLeidas}
              </span>
            )}
          </h2>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            {noLeidas > 0 ? `${noLeidas} sin leer` : "Todas leídas"}
          </p>
        </div>
        {noLeidas > 0 && (
          <button onClick={marcarTodas}
            className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ fontSize: "0.78rem" }}>
            <CheckCheck size={13} /> Marcar todas
          </button>
        )}
      </div>

      {loadError && (
        <div className="rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-destructive" style={{ fontSize: "0.85rem" }}>{loadError}</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex w-fit max-w-full gap-1 rounded-xl border border-border bg-card p-1">
        {[
          { id: "todas" as const, label: "Todas", count: notificaciones.length },
          { id: "no_leidas" as const, label: "Sin leer", count: noLeidas },
        ].map((t) => (
          <button key={t.id} onClick={() => setFiltro(t.id)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all"
            style={{
              background: filtro === t.id ? "var(--secondary)" : "transparent",
              fontSize: "0.82rem",
              color: filtro === t.id ? "var(--foreground)" : "var(--muted-foreground)",
            }}>
            {t.label}
            <span className="rounded-full px-1.5 py-0.5 text-white"
              style={{ fontSize: "0.65rem", background: filtro === t.id ? "#10B981" : "var(--muted)", color: filtro === t.id ? "#fff" : "var(--muted-foreground)" }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {mostradas.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-5 py-16 text-center shadow-sm">
          <Bell size={28} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-foreground" style={{ fontSize: "0.95rem" }}>Sin notificaciones</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.82rem" }}>
            {filtro === "no_leidas" ? "Todas las notificaciones han sido leídas" : "No hay notificaciones aún"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {mostradas.map((n) => {
            const Icon = ICONO[n.tipo];
            const color = COLOR[n.tipo];
            return (
              <div key={n.id} className="rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md"
                style={{ borderColor: !n.leida ? `${color}30` : "var(--border)", opacity: n.leida ? 0.75 : 1 }}>
                <div className="flex items-start gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${color}15` }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <p className="text-foreground" style={{ fontSize: "0.875rem", fontWeight: n.leida ? 400 : 500 }}>{TITULO[n.tipo]}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!n.leida && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />}
                        <span className="text-muted-foreground whitespace-nowrap" style={{ fontSize: "0.72rem" }}>{formatFechaHora(n.fechaEnvio)}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-1" style={{ fontSize: "0.82rem", lineHeight: 1.55 }}>{n.mensaje}</p>
                    {!n.leida && (
                      <div className="flex items-center gap-3 mt-2.5">
                        <button onClick={() => marcarLeida(n.id)}
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          style={{ fontSize: "0.73rem" }}>
                          <CheckCircle2 size={12} /> Marcar como leída
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
