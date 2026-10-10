// Importamos los iconos necesarios de la librería lucide-react.
import {
  CalendarClock,
  GraduationCap,
  History,
  Home,
  MessageCircle,
} from "lucide-react";

export type QuickAccessTab =
  | "inicio"
  | "solicitud"
  | "historial"
  | "eventos"
  | "mensajes";

interface Props {
  activeTab: QuickAccessTab;
  onNavigate: (tab: QuickAccessTab) => void;
}

const ACCESOS: {
  id: QuickAccessTab;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: "inicio",
    label: "Inicio",
    description: "Ir a la página principal.",
    icon: Home,
  },
  {
    id: "solicitud",
    label: "Solicitar tutoría",
    description: "Encuentra un tutor y reserva un horario.",
    icon: GraduationCap,
  },
  {
    id: "historial",
    label: "Mis tutorías",
    description: "Consulta el estado de tus solicitudes.",
    icon: History,
  },
  {
    id: "mensajes",
    label: "Mensajes",
    description: "Comunícate únicamente con los tutores de tus tutorías.",
    icon: MessageCircle,
  },
  {
    id: "eventos",
    label: "Próximos eventos",
    description: "Revisa tus sesiones pendientes y confirmadas.",
    icon: CalendarClock,
  },
];
// Componente de navegación rápida que permite al usuario cambiar entre diferentes secciones de la aplicación.
export function QuickAccessNav({ activeTab, onNavigate }: Props) {
  return (
    <nav
      className="mb-4 flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-card px-4 sm:px-5"
      aria-label="Accesos rápidos"
    >
      {ACCESOS.map(({ id, label, description, icon: Icon }) => {
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            aria-current={isActive ? "page" : undefined}
            title={description}
            className={`relative flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? "border-brand-blue text-brand-blue-text"
                : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Icon size={15} strokeWidth={1.8} className="shrink-0" />

            <span className="whitespace-nowrap font-semibold">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
