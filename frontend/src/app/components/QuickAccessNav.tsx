// Importamos los iconos necesarios de la librería lucide-react.
import { CalendarClock, GraduationCap, History, Home } from "lucide-react";

// Definimos los tipos de pestañas disponibles en la aplicación.
export type QuickAccessTab = "inicio" | "solicitud" | "historial" | "eventos";

// Definimos la interfaz de las props que recibe este componente.
interface Props {
  activeTab: QuickAccessTab; // Indica qué pestaña está activa actualmente.
  onNavigate: (tab: QuickAccessTab) => void; // Función que se ejecuta al hacer clic en una pestaña.
}

// Array con la configuración de cada botón de acceso rápido.
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
    id: "eventos",
    label: "Próximos eventos",
    description: "Revisa tus sesiones pendientes y confirmadas.",
    icon: CalendarClock,
  },
];

// Componente principal de la barra de navegación rápida.
export function QuickAccessNav({ activeTab, onNavigate }: Props) {
  return (
    // --- SECCIÓN 1: Contenedor de la Barra de Navegación ---
    // Es un elemento <nav> con scroll horizontal si es necesario.
    <nav
      className="mb-4 flex justify-start overflow-x-auto border-b border-border"
      aria-label="Accesos rápidos"
    >
      {/* --- SECCIÓN 2: Mapeo de los Botones de Navegación --- */}
      {/* Iteramos sobre el array ACCESOS para crear un botón por cada pestaña. */}
      {ACCESOS.map(({ id, label, description, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onNavigate(id)} // Al hacer clic, navega a la pestaña correspondiente.
          aria-current={activeTab === id ? "page" : undefined} // Indica accesibilidad para la pestaña activa.
          title={description} // Tooltip que muestra la descripción al pasar el mouse.
          className={`group relative flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 py-2 text-left text-sm transition-all first:pl-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:scale-105 ${activeTab === id ? "border-[var(--brand-navy)] text-[#57595B]" : "border-transparent text-[#57595B] hover:bg-white/5 hover:text-[#57595B]"}`}
        >
          {/* --- SECCIÓN 3: Icono del Botón --- */}
          <Icon size={17} strokeWidth={1.8} className="shrink-0" />

          {/* --- SECCIÓN 4: Texto del Botón --- */}
          <span className="whitespace-nowrap" style={{ fontWeight: 600 }}>
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
}
