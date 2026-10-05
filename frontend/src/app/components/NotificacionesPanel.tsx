import { useEffect, useRef } from "react";
import { Bell, X, CheckCircle2, Clock, AlertCircle, Info, BookOpen, Users } from "lucide-react";

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
    { id: "n1", tipo: "success", titulo: "Solicitud aprobada",     mensaje: "Tu solicitud TUT-2026-0988 para Programación I fue APROBADA por Prof. Lucas Fernández.",       tiempo: "Hace 2 horas",  leida: false },
    { id: "n2", tipo: "warning", titulo: "Recordatorio de sesión", mensaje: "Tienes una tutoría mañana a las 14:00 con Prof. Andrés Ramírez — Cálculo Diferencial.",          tiempo: "Hace 5 horas",  leida: false },
    { id: "n3", tipo: "info",    titulo: "Sesión completada",      mensaje: "La sesión S-2026-0031 de Álgebra Lineal ha sido marcada como COMPLETADA. Revisa tus observaciones.", tiempo: "Hace 2 días",   leida: true  },
    { id: "n4", tipo: "alert",   titulo: "Solicitud rechazada",    mensaje: "Tu solicitud TUT-2026-0754 de Estadística Aplicada fue RECHAZADA. Consulta la justificación.",    tiempo: "Hace 3 días",   leida: true  },
  ],
  tutor: [
    { id: "n1", tipo: "alert",   titulo: "Nueva solicitud",        mensaje: "María Alejandra Gómez solicitó tutoría de Cálculo Diferencial el 14/06 a las 14:00.",            tiempo: "Hace 1 hora",   leida: false },
    { id: "n2", tipo: "alert",   titulo: "Nueva solicitud",        mensaje: "Santiago Herrera Castro solicitó tutoría de Cálculo Diferencial el 14/06 a las 16:00.",          tiempo: "Hace 3 horas",  leida: false },
    { id: "n3", tipo: "warning", titulo: "Sesiones sin cierre",    mensaje: "Tienes 3 sesiones APROBADAS con fecha pasada pendientes de registrar seguimiento.",              tiempo: "Hace 6 horas",  leida: false },
    { id: "n4", tipo: "info",    titulo: "Bloque bloqueado",       mensaje: "El bloque del Jueves 10:00–12:00 fue bloqueado automáticamente tras aprobar una solicitud.",     tiempo: "Hace 1 día",    leida: true  },
    { id: "n5", tipo: "success", titulo: "Seguimiento registrado", mensaje: "Seguimiento de la sesión S-2026-0037 guardado correctamente. Estado: COMPLETADA.",               tiempo: "Hace 2 días",   leida: true  },
  ],
  coordinador: [
    { id: "n1", tipo: "info",    titulo: "Nuevos registros",       mensaje: "5 nuevos usuarios fueron registrados esta semana en el sistema.",                                 tiempo: "Hace 4 horas",  leida: false },
    { id: "n2", tipo: "warning", titulo: "Tutores inactivos",      mensaje: "Prof. Sofía Mendoza tiene sesiones sin cierre desde hace 5 días.",                               tiempo: "Hace 1 día",    leida: false },
    { id: "n3", tipo: "success", titulo: "Reporte generado",       mensaje: "El reporte de asistencia del Ciclo 2026-I fue generado y enviado a coordinación.",               tiempo: "Hace 2 días",   leida: true  },
    { id: "n4", tipo: "alert",   titulo: "Alta demanda",           mensaje: "La asignatura Cálculo Diferencial tiene 5 solicitudes pendientes sin tutor asignado.",           tiempo: "Hace 3 días",   leida: true  },
  ],
};

const TIPO_CONFIG = {
  success: { icon: CheckCircle2, color: "#10B981",  bg: "rgba(16,185,129,0.1)"  },
  info:    { icon: Info,         color: "#3B82F6",  bg: "rgba(59,130,246,0.1)"  },
  warning: { icon: Clock,        color: "#F59E0B",  bg: "rgba(245,158,11,0.1)"  },
  alert:   { icon: AlertCircle,  color: "#EF4444",  bg: "rgba(239,68,68,0.1)"   },
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
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell size={15} style={{ color: "#10B981" }} />
          <span className="text-foreground" style={{ fontSize: "0.9rem" }}>Notificaciones</span>
          {noLeidas > 0 && (
            <span className="rounded-full px-1.5 py-0.5 text-white"
              style={{ fontSize: "0.65rem", background: "#10B981", lineHeight: 1.4 }}>
              {noLeidas}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Rol tag */}
      <div className="px-4 py-2 border-b border-border" style={{ background: "var(--secondary)" }}>
        <div className="flex items-center gap-1.5">
          {rol === "estudiante" && <BookOpen size={11} className="text-muted-foreground" />}
          {rol === "tutor"      && <Bell     size={11} className="text-muted-foreground" />}
          {rol === "coordinador"&& <Users    size={11} className="text-muted-foreground" />}
          <span className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
            {rol === "estudiante" ? "Panel de Estudiante" : rol === "tutor" ? "Panel de Tutor" : "Panel de Coordinador"}
          </span>
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto divide-y divide-border">
        {notifs.map((n) => {
          const cfg = TIPO_CONFIG[n.tipo];
          return (
            <div key={n.id}
              className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/40"
              style={{ opacity: n.leida ? 0.6 : 1 }}>
              {/* Icon */}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: cfg.bg }}>
                <cfg.icon size={14} style={{ color: cfg.color }} />
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-foreground" style={{ fontSize: "0.82rem", lineHeight: 1.3 }}>{n.titulo}</p>
                  {!n.leida && (
                    <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: "#10B981" }} />
                  )}
                </div>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>{n.mensaje}</p>
                <p className="text-muted-foreground mt-1" style={{ fontSize: "0.68rem" }}>{n.tiempo}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border text-center">
        <button className="text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontSize: "0.78rem" }}>
          Marcar todas como leídas
        </button>
      </div>
    </div>
  );
}

/* Export badge count helper */
export function notifCount(rol: Rol): number {
  return NOTIFS[rol].filter((n) => !n.leida).length;
}
