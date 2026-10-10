import { useEffect, useRef } from "react";
import {
  Bell,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Info,
  BookOpen,
  Users,
} from "lucide-react";

type Rol = "estudiante" | "tutor" | "coordinador";

interface Notif {
  id: string;
  tipo: "success" | "info" | "warning" | "alert";
  titulo: string;
  mensaje: string;
  tiempo: string;
  leida: boolean;
}

const NOTIFS: Record<Rol, Notif[]> = {
  estudiante: [
    { id: "n1", tipo: "success", titulo: "Solicitud aprobada", mensaje: "Tu solicitud TUT-2026-0988 para Programación I fue APROBADA por Prof. Lucas Fernández.", tiempo: "Hace 2 horas", leida: false },
    { id: "n2", tipo: "warning", titulo: "Recordatorio de sesión", mensaje: "Tienes una tutoría mañana a las 14:00 con Prof. Andrés Ramírez — Cálculo Diferencial.", tiempo: "Hace 5 horas", leida: false },
    { id: "n3", tipo: "info", titulo: "Sesión completada", mensaje: "La sesión S-2026-0031 de Álgebra Lineal ha sido marcada como COMPLETADA. Revisa tus observaciones.", tiempo: "Hace 2 días", leida: true },
    { id: "n4", tipo: "alert", titulo: "Solicitud rechazada", mensaje: "Tu solicitud TUT-2026-0754 de Estadística Aplicada fue RECHAZADA. Consulta la justificación.", tiempo: "Hace 3 días", leida: true },
  ],
  tutor: [
    { id: "n1", tipo: "alert", titulo: "Nueva solicitud", mensaje: "María Alejandra Gómez solicitó tutoría de Cálculo Diferencial el 14/06 a las 14:00.", tiempo: "Hace 1 hora", leida: false },
    { id: "n2", tipo: "alert", titulo: "Nueva solicitud", mensaje: "Santiago Herrera Castro solicitó tutoría de Cálculo Diferencial el 14/06 a las 16:00.", tiempo: "Hace 3 horas", leida: false },
    { id: "n3", tipo: "warning", titulo: "Sesiones sin cierre", mensaje: "Tienes 3 sesiones APROBADAS con fecha pasada pendientes de registrar seguimiento.", tiempo: "Hace 6 horas", leida: false },
    { id: "n4", tipo: "info", titulo: "Bloque bloqueado", mensaje: "El bloque del Jueves 10:00–12:00 fue bloqueado automáticamente tras aprobar una solicitud.", tiempo: "Hace 1 día", leida: true },
    { id: "n5", tipo: "success", titulo: "Seguimiento registrado", mensaje: "Seguimiento de la sesión S-2026-0037 guardado correctamente. Estado: COMPLETADA.", tiempo: "Hace 2 días", leida: true },
  ],
  coordinador: [
    { id: "n1", tipo: "info", titulo: "Nuevos registros", mensaje: "5 nuevos usuarios fueron registrados esta semana en el sistema.", tiempo: "Hace 4 horas", leida: false },
    { id: "n2", tipo: "warning", titulo: "Tutores inactivos", mensaje: "Prof. Sofía Mendoza tiene sesiones sin cierre desde hace 5 días.", tiempo: "Hace 1 día", leida: false },
    { id: "n3", tipo: "success", titulo: "Reporte generado", mensaje: "El reporte de asistencia del Ciclo 2026-I fue generado y enviado a coordinación.", tiempo: "Hace 2 días", leida: true },
    { id: "n4", tipo: "alert", titulo: "Alta demanda", mensaje: "La asignatura Cálculo Diferencial tiene 5 solicitudes pendientes sin tutor asignado.", tiempo: "Hace 3 días", leida: true },
  ],
};

const TIPO_CONFIG = {
  success: {
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  info: {
    icon: Info,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
  },
  warning: {
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  alert: {
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
  },
};

interface Props {
  rol: Rol;
  onClose: () => void;
}

export function NotificacionesPanel({ rol, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const notifs = NOTIFS[rol];
  const noLeidas = notifs.filter((n) => !n.leida).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const tituloRol =
    rol === "estudiante"
      ? "Panel de estudiante"
      : rol === "tutor"
        ? "Panel de tutor"
        : "Panel de coordinación";

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Panel de notificaciones"
      className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl"
    >
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
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Cerrar notificaciones"
        >
          <X size={16} />
        </button>
      </div>

      <div className="border-b border-border bg-secondary/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          {rol === "estudiante" ? (
            <BookOpen size={13} className="text-muted-foreground" />
          ) : rol === "tutor" ? (
            <Bell size={13} className="text-muted-foreground" />
          ) : (
            <Users size={13} className="text-muted-foreground" />
          )}
          <span className="text-xs font-medium text-muted-foreground">
            {tituloRol}
          </span>
        </div>
      </div>

      <div className="max-h-96 divide-y divide-border overflow-y-auto">
        {notifs.map((n) => {
          const cfg = TIPO_CONFIG[n.tipo];
          const Icon = cfg.icon;

          return (
            <div
              key={n.id}
              className={`flex gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/60 ${
                n.leida ? "opacity-70" : "bg-primary/[0.03]"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}
              >
                <Icon size={16} className={cfg.color} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug text-foreground">
                    {n.titulo}
                  </p>
                  {!n.leida && (
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                      aria-label="No leída"
                    />
                  )}
                </div>
                <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
                  {n.mensaje}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {n.tiempo}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border bg-card px-4 py-3 text-center">
        <button
          type="button"
          disabled={noLeidas === 0}
          className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
        >
          Marcar todas como leídas
        </button>
      </div>
    </div>
  );
}

export function notifCount(rol: Rol): number {
  return NOTIFS[rol].filter((n) => !n.leida).length;
}
