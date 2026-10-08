import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, X, CheckCircle2, Clock, AlertCircle, Info, Loader2, CheckCheck } from "lucide-react";
import { listarNotificaciones, marcarNotificacionLeida, marcarTodasLeidas, type Notificacion, type TipoNotificacion } from "../lib/notificaciones";
import { ApiError } from "../lib/api";

const TIPO_CONFIG: Record<TipoNotificacion, { icon: React.ElementType; color: string; bg: string }> = {
  APROBACION:     { icon: CheckCircle2, color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  CANCELACION:    { icon: AlertCircle,  color: "#EF4444", bg: "rgba(239,68,68,0.1)"  },
  RECHAZO:        { icon: AlertCircle,  color: "#EF4444", bg: "rgba(239,68,68,0.1)"  },
  CAMBIO_HORARIO: { icon: Clock,        color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  RECORDATORIO:   { icon: Clock,        color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  OBSERVACION:    { icon: Info,         color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
};

function tiempoRelativo(fechaISO: string): string {
  const diffMs = Date.now() - new Date(fechaISO).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} día${dias > 1 ? "s" : ""}`;
}

export function NotificacionesBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    listarNotificaciones()
      .then(setNotifs)
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudieron cargar las notificaciones."))
      .finally(() => setCargando(false));
  }, []);

  // Carga inicial (para el contador del badge) y cada vez que se abre el panel
  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { if (open) cargar(); }, [open, cargar]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const noLeidas = notifs.filter((n) => !n.leida).length;

  const marcarUna = async (id: number) => {
    try {
      await marcarNotificacionLeida(id);
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    } catch {
      // silencioso: no es crítico si falla marcar una sola
    }
  };

  const marcarTodas = async () => {
    try {
      await marcarTodasLeidas();
      setNotifs((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch {
      setError("No se pudieron marcar todas como leídas.");
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        aria-label="Notificaciones">
        <Bell size={15} />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white"
            style={{ background: "#10B981", fontSize: "0.55rem" }}>
            {noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell size={15} style={{ color: "#10B981" }} />
              <span className="text-foreground" style={{ fontSize: "0.9rem" }}>Notificaciones</span>
              {noLeidas > 0 && (
                <span className="rounded-full px-1.5 py-0.5 text-white" style={{ fontSize: "0.65rem", background: "#10B981" }}>
                  {noLeidas}
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={14} />
            </button>
          </div>

          {cargando ? (
            <div className="py-10 flex justify-center"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
          ) : error ? (
            <p className="text-destructive text-center py-6 px-4" style={{ fontSize: "0.8rem" }}>{error}</p>
          ) : notifs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8" style={{ fontSize: "0.82rem" }}>Sin notificaciones</p>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-border">
              {notifs.map((n) => {
                const cfg = TIPO_CONFIG[n.tipo];
                const Icon = cfg.icon;
                return (
                  <button key={n.id} onClick={() => !n.leida && marcarUna(n.id)}
                    className="w-full flex gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/40 text-left"
                    style={{ opacity: n.leida ? 0.6 : 1 }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                      <Icon size={14} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-foreground" style={{ fontSize: "0.82rem", lineHeight: 1.3 }}>
                          {n.tipo === "APROBACION" ? "Solicitud aprobada" :
                           n.tipo === "RECHAZO" ? "Solicitud rechazada" :
                           n.tipo === "OBSERVACION" ? "Seguimiento registrado" :
                           n.tipo === "CAMBIO_HORARIO" ? "Cambio de horario" : "Recordatorio"}
                        </p>
                        {!n.leida && <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: "#10B981" }} />}
                      </div>
                      <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>{n.mensaje}</p>
                      <p className="text-muted-foreground mt-1" style={{ fontSize: "0.68rem" }}>{tiempoRelativo(n.fechaEnvio)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="px-4 py-3 border-t border-border text-center">
            <button onClick={marcarTodas} disabled={noLeidas === 0}
              className="flex items-center justify-center gap-1.5 w-full text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              style={{ fontSize: "0.78rem" }}>
              <CheckCheck size={13} /> Marcar todas como leídas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
