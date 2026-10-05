// Importamos el componente de navegación rápida y su tipo de dato para las pestañas.
import { QuickAccessNav, type QuickAccessTab } from "./QuickAccessNav";

// Definimos la interfaz (Props) que recibe este componente.
interface Props {
  onNavigate: (tab: QuickAccessTab) => void; // Función para cambiar de pestaña.
  nombre: string; // Nombre del usuario (no se usa directamente en el renderizado actual, pero se recibe).
}

// Array con la información de las tarjetas destacadas que se mostrarán en la sección inferior.
const DESTACADOS = [
  {
    title: "Tutorías académicas",
    description: "Encuentra orientación clara para avanzar en tus asignaturas.",
  },
  {
    title: "Seguimiento continuo",
    description:
      "Acompañamos tu progreso antes, durante y después de cada sesión.",
  },
  {
    title: "Apoyo especializado",
    description:
      "Recibe ayuda enfocada en tus necesidades y objetivos de aprendizaje.",
  },
];

// Componente principal de la página de Inicio.
export function Inicio({ onNavigate, nombre }: Props) {
  return (
    // Contenedor principal de la página.
    <div className="w-full max-w-none">
      {/* --- SECCIÓN 1: Barra de Navegación Rápida --- */}
      <QuickAccessNav activeTab="inicio" onNavigate={onNavigate} />

      {/* --- SECCIÓN 2: Título Principal (Hero) --- */}
      <div className="mb-7">
        <h1
          className="max-w-[1050px] text-3xl leading-[1.12] text-foreground sm:text-[2rem]"
          style={{ fontWeight: 500 }}
        >
          Explora nuevas oportunidades de aprendizaje, mantente al día con tus
          actividades y continúa impulsando tu desarrollo académico.
        </h1>
      </div>

      {/* --- SECCIÓN 3: Banner de Imagen con Texto Superpuesto --- */}
      <div className="relative mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Imagen de fondo del banner */}
        <img
          src="/tutores.jpg"
          alt="Estudiantes trabajando con su tutor"
          className="block aspect-[3/1] w-full object-cover object-center sm:aspect-[16/6]"
        />

     {/* Capa de degradado y texto superpuesto */}
        <div className="absolute inset-0 flex items-start justify-end bg-gradient-to-l from-black/80 via-black/40 to-transparent p-5 sm:p-8">
          <p className="max-w-[min(90%,30rem)] text-right text-lg leading-tight sm:text-2xl md:text-3xl">
            <span 
              className="block font-semibold text-white" 
              style={{ textShadow: "1px 1px 4px rgba(0,0,0,0.5)" }}
            >
              Tu aprendizaje
            </span>
            <span 
              className="block font-bold" 
              style={{ color: "#118AB2", textShadow: "1px 1px 4px rgba(0,0,0,0.6)" }}
            >
              también cuenta
            </span>
            <span 
              className="mt-2 block text-xs font-medium leading-relaxed text-blue-50 sm:text-sm md:text-base" 
              style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.2)" }}
            >
              Acompañamos tu desarrollo académico.
            </span>
          </p>
        </div>
      </div>

      {/* --- SECCIÓN 4: Tarjetas de Características Destacadas --- */}
      <section className="mt-7" aria-labelledby="destacados-title">
        {/* Encabezado de la sección */}
        <div className="mb-3 flex items-center justify-between px-1">
          <h2
            id="destacados-title"
            className="text-foreground"
            style={{ fontSize: "2.25rem" }}
          >
            Tu camino de aprendizaje
          </h2>
        </div>
        {/* Contenedor de las tarjetas con scroll horizontal en pantallas pequeñas */}
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {DESTACADOS.map(({ title, description }) => (
            <article
              key={title}
              className="info-card min-w-[85%] snap-center sm:min-w-[calc(50%-0.5rem)] lg:min-w-0 lg:flex-1"
            >
              <h3 className="info-card__title">{title}</h3>
              <p className="info-card__desc mt-3">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
