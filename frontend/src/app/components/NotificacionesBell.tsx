import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Info,
  Loader2,
  CheckCheck,
} from "lucide-react";
import {
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  type Notificacion,
  type TipoNotificacion,
} from "../lib/notificaciones";
import { ApiError } from "../lib/api";

const TIPO_CONFIG: Record<
  TipoNotificacion,
  {
    icon: React.ElementType;
    color: string;
    bg: string;
  }
> = {
  APROBACION: {
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  CANCELACION: {
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
  },
  RECHAZO: {
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
  },
  CAMBIO_HORARIO: {
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  RECORDATORIO: {
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  OBSERVACION: {
    icon: Info,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
  },
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
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar las notificaciones.",
        ),
      )
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (open) cargar();
  }, [open, cargar]);

  useEffect(() => {
    if (!open) return;

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const noLeidas = notifs.filter((n) => !n.leida).length;

  const marcarUna = async (id: number) => {
    try {
      await marcarNotificacionLeida(id);
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
      );
    } catch {
      // Se conserva el estado si la operación falla.
    }
  };

  const marcarTodas = async () => {
    try {
      await marcarTodasLeidas();
      setNotifs((prev) => prev.map((n) => ({ ...n, leida: true })));
      setError(null);
    } catch {
      setError("No se pudieron marcar todas como leídas.");
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={
          noLeidas > 0
            ? `Notificaciones, ${noLeidas} sin leer`
            : "Notificaciones"
        }
        aria-expanded={open}
      >
        <Bell size={17} />

        {noLeidas > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground shadow-sm"
            aria-label={`${noLeidas} notificaciones sin leer`}
          >
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-2">
              <Bell size={16} className="shrink-0 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Notificaciones
              </span>

              {noLeidas > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                  {noLeidas}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Cerrar notificaciones"
            >
              <X size={16} />
            </button>
          </div>

          {cargando ? (
            <div className="flex justify-center py-10">
              <Loader2
                size={20}
                className="animate-spin text-muted-foreground"
              />
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <button
                type="button"
                onClick={cargar}
                className="mt-3 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Reintentar
              </button>
            </div>
          ) : notifs.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-9 text-center">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <Bell size={18} />
              </span>
              <p className="text-sm font-medium text-foreground">
                Sin notificaciones
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Aquí aparecerán tus avisos importantes.
              </p>
            </div>
          ) : (
            <div className="max-h-96 divide-y divide-border overflow-y-auto">
              {notifs.map((n) => {
                const cfg = TIPO_CONFIG[n.tipo];
                const Icon = cfg.icon;

                const titulo =
                  n.tipo === "APROBACION"
                    ? "Solicitud aprobada"
                    : n.tipo === "RECHAZO"
                      ? "Solicitud rechazada"
                      : n.tipo === "CANCELACION"
                        ? "Solicitud cancelada"
                        : n.tipo === "OBSERVACION"
                          ? "Seguimiento registrado"
                          : n.tipo === "CAMBIO_HORARIO"
                            ? "Cambio de horario"
                            : "Recordatorio";

                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => !n.leida && marcarUna(n.id)}
                    aria-label={`${titulo}${n.leida ? "" : ", marcar como leída"}`}
                    className={`flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                      n.leida ? "opacity-70" : "bg-primary/[0.03]"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}
                    >
                      <Icon size={16} className={cfg.color} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium leading-snug text-foreground">
                          {titulo}
                        </span>

                        {!n.leida && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </span>

                      <span className="mt-1 block break-words text-xs leading-relaxed text-muted-foreground">
                        {n.mensaje}
                      </span>

                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        {tiempoRelativo(n.fechaEnvio)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="border-t border-border bg-card px-4 py-3">
            <button
              type="button"
              onClick={marcarTodas}
              disabled={noLeidas === 0 || cargando}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck size={14} />
              Marcar todas como leídas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
