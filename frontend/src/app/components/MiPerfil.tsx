import { useEffect, useRef, useState } from "react";

import {
  Lock,
  Mail,
  Phone,
  MapPin,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Pencil,
  Camera,
  Code2,
  Database,
  Share2,
  ChevronRight,
  Info,
  UserRound,
  Settings,
  AlertCircle,
  Eye,
  EyeOff,
  Laptop,
  Users,
} from "lucide-react";

import {
  obtenerPerfil,
  actualizarPerfil,
  cambiarContrasena,
} from "../lib/perfil";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

type Rol = "estudiante" | "tutor" | "coordinador";

type PerfilTab = "personal" | "asignaturas" | "seguridad";

const PERFIL_TABS: { id: PerfilTab; label: string; icon: React.ElementType }[] =
  [
    { id: "personal", label: "Información personal", icon: UserRound },

    { id: "asignaturas", label: "Asignaturas en curso", icon: BookOpen },

    { id: "seguridad", label: "Seguridad", icon: Lock },
  ];

/* ─── Design tokens (bronze accent) ───────────────────────────────────── */

const BRONZE = "#14B8A6";

const BRONZE_SOFT = "rgba(20,184,166,0.12)";

const BRONZE_BORDER = "rgba(20,184,166,0.35)";

const NAVY = "rgba(59,130,246,0.1)";

/* ─── Per-role static profile data ────────────────────────────────────── */

interface ProfileData {
  titulo: string;

  departamento: string;

  ciclo: string;

  telefono: string;

  ciudad: string;

  extra: { icon: React.ElementType; label: string; value: string }[];
}

const PROFILE_DATA: Record<Rol, ProfileData> = {
  estudiante: {
    titulo: "Ingeniería de Sistemas",

    departamento: "Facultad de Ingeniería",

    ciclo: "2026-I · Semestre VI",

    telefono: "+503 7123 4567",

    ciudad: "San Salvador, El Salvador",

    extra: [
      { icon: BookOpen, label: "Carrera", value: "Ingeniería de Sistemas" },
    ],
  },

  tutor: {
    titulo: "Tutor Académico Especialista",

    departamento: "Dpto. de Matemáticas y Ciencias",

    ciclo: "Vinculación: 2024-I",

    telefono: "+503 7234 5678",

    ciudad: "Santa Ana, El Salvador",

    extra: [
      { icon: BookOpen, label: "Especialidad", value: "Matemáticas y Cálculo" },

      { icon: Award, label: "Sesiones totales", value: "20 completadas" },

      { icon: Calendar, label: "Vinculación", value: "2024-I" },
    ],
  },

  coordinador: {
    titulo: "Coordinador Académico",

    departamento: "Vicerrectoría Académica",

    ciclo: "Cargo desde: 2022",

    telefono: "+503 2289 0012",

    ciudad: "San Salvador, El Salvador",

    extra: [
      {
        icon: BookOpen,

        label: "Dependencia",

        value: "Vicerrectoría Académica",
      },

      { icon: Award, label: "Tutores a cargo", value: "12 tutores activos" },

      { icon: Calendar, label: "Cargo desde", value: "enero 2022" },
    ],
  },
};

const CARRERAS_EST = [
  "Ingeniería de Sistemas",

  "Ingeniería Civil",

  "Matemáticas",

  "Física",

  "Estadística",

  "Economía",
];

const ESPECIALIDADES = [
  
  "Programación I",
  
  "Estructuras de Datos",
];

const DEPARTAMENTOS = [
  "Vicerrectoría Académica",

  "Dpto. de Ingeniería",

  "Dpto. de Matemáticas y Ciencias",

  "Dpto. de Humanidades",
];

const MATERIAS_EN_CURSO = [
  {
    nombre: "Programación",

    nivel: "Cálculo",

    icon: Code2,

    color: "#5B9BEA",

    colorClaro: "#2563EB",

    fondo: "rgba(91,155,234,0.14)",
  },

  {
    nombre: "Bases de Datos",

    nivel: "Intermedio",

    icon: Database,

    color: "#9B7BEA",

    colorClaro: "#6D28D9",

    fondo: "rgba(155,123,234,0.14)",
  },

  {
    nombre: "Estructuras de Datos",

    nivel: "Avanzado",

    icon: Share2,

    color: "#42C7AF",

    colorClaro: "#0F766E",

    fondo: "rgba(66,199,175,0.14)",
  },
];

/* ─── Password strength ────────────────────────────────────────────────── */

function strengthOf(pwd: string): {
  score: number;

  label: string;

  color: string;
} {
  if (!pwd) return { score: 0, label: "", color: "" };

  if (pwd.length < 6) return { score: 1, label: "Débil", color: "#EF4444" };

  if (pwd.length < 10) return { score: 2, label: "Regular", color: "#14B8A6" };

  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd))
    return { score: 4, label: "Fuerte", color: "#10B981" };

  return { score: 3, label: "Buena", color: BRONZE };
}

/* ─── Field input - Formulario de edición (adaptable a ambos temas) ───── */

function Field({
  label,

  value,

  onChange,

  disabled = false,

  type = "text",
}: {
  label: string;

  value: string;

  onChange?: (v: string) => void;

  disabled?: boolean;

  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-foreground" style={{ fontSize: "0.8rem" }}>
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        placeholder={label}
        className="w-full rounded-xl border border-border

          bg-input-background px-4 py-2.5

          text-foreground placeholder:text-muted-foreground

          outline-none transition-all

          focus:border-primary focus:ring-2 focus:ring-ring

          disabled:cursor-not-allowed disabled:opacity-60

        "
        style={
          {
            fontSize: "0.875rem",

            "--tw-ring-color": BRONZE,

            colorScheme: "light dark",
          } as React.CSSProperties
        }
      />
    </div>
  );
}

/* ─── Campo de contraseña adaptable a ambos temas ─── */

function PwdField({
  label,

  value,

  onChange,
}: {
  label: string;

  value: string;

  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="block text-foreground" style={{ fontSize: "0.8rem" }}>
        {label}
      </label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="

            w-full rounded-xl border border-border

            bg-input-background px-4 py-2.5 pr-11

            text-foreground placeholder:text-muted-foreground

            outline-none transition-all

            focus:border-primary focus:ring-2 focus:ring-ring

          "
          style={
            {
              fontSize: "0.875rem",

              "--tw-ring-color": BRONZE,

              colorScheme: "light dark",
            } as React.CSSProperties
          }
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="

            absolute right-3 top-1/2 -translate-y-1/2

            rounded-md p-1 text-muted-foreground

            transition-colors hover:text-foreground

            focus-visible:outline-none focus-visible:ring-2

            focus-visible:ring-ring

          "
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

/* ─── Section card ─────────────────────────────────────────────────────── */

function SectionCard({
  title,

  icon: Icon,

  accent = false,

  children,
}: {
  title: string;

  icon: React.ElementType;

  accent?: boolean;

  children: React.ReactNode;
}) {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-colors">
      <div
        className="flex items-center gap-3 border-b border-border px-4 py-4 sm:px-6"
        style={{
          background: accent
            ? `linear-gradient(135deg, ${BRONZE_SOFT}, var(--card))`
            : undefined,
        }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: accent ? BRONZE_SOFT : "var(--secondary)",

            border: accent ? `1px solid ${BRONZE_BORDER}` : undefined,
          }}
        >
          <Icon
            size={14}
            style={{ color: accent ? BRONZE : "var(--muted-foreground)" }}
          />
        </div>

        <h3 className="text-card-foreground" style={{ fontSize: "0.95rem" }}>
          {title}
        </h3>
      </div>

      <div className="px-4 py-5 sm:px-6">{children}</div>
    </div>
  );
}

/* ─── Save button ──────────────────────────────────────────────────────── */

function SaveButton({
  saved,

  label = "Guardar cambios",
}: {
  saved: boolean;

  label?: string;
}) {
  return (
    <button
      type="submit"
      className="rounded-xl px-5 py-2.5 text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={{
        background: "#118ab2",

        fontSize: "0.875rem",
      }}
    >
      {saved ? "✓ Guardado" : label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */

interface Props {
  rol: Rol;

  nombre: string;

  email: string;
}

export function MiPerfil({ rol, nombre, email }: Props) {
  const profile = PROFILE_DATA[rol];
  const perfilTabs = PERFIL_TABS.map((tab) =>
    tab.id === "asignaturas"
      ? {
          ...tab,
          label:
            rol === "estudiante"
              ? "Materias en curso"
              : rol === "tutor"
                ? "Áreas de apoyo"
                : "Áreas de seguimiento",
        }
      : tab,
  );

  const partes = nombre.replace("Prof. ", "").split(" ");

  /* Tema: el modal se renderiza en un portal (fuera de este componente),

     por lo que puede perder la clase "dark" si esta vive en un contenedor

     interno. Se detecta el tema desde el componente y se reaplica al modal. */

  const rootRef = useRef<HTMLDivElement>(null);

  /* Personal data state */

  const [nombres, setNombres] = useState(partes.slice(0, 2).join(" "));

  const [apellidos, setApellidos] = useState(partes.slice(2).join(" ") || "");

  const [telefono, setTelefono] = useState(profile.telefono);

  const [ciudad, setCiudad] = useState(profile.ciudad);

  const [fechaNacimiento, setFechaNacimiento] = useState("2001-03-15");

  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  const [categoria, setCategoria] = useState(
    rol === "tutor"
      ? ESPECIALIDADES[0]
      : rol === "coordinador"
        ? DEPARTAMENTOS[0]
        : CARRERAS_EST[0],
  );

  const [perfilSaved, setPerfilSaved] = useState(false);

  const [perfilError, setPerfilError] = useState("");

  const [emailActual, setEmailActual] = useState(email);

  const [editOpen, setEditOpen] = useState(false);

  const [securityOnly, setSecurityOnly] = useState(false);

  /* Security state */

  const [currentPwd, setCurrentPwd] = useState("");

  const [newPwd, setNewPwd] = useState("");

  const [confirmPwd, setConfirmPwd] = useState("");

  const [pwdError, setPwdError] = useState("");

  const [pwdSaved, setPwdSaved] = useState(false);

  const [activeTab, setActiveTab] = useState<PerfilTab>("personal");

  const strength = strengthOf(newPwd);

  /* true si el componente está dentro de un contenedor (o <html>) con la clase "dark" */

  const esOscuro =
    editOpen &&
    (!!rootRef.current?.closest(".dark") ||
      document.documentElement.classList.contains("dark"));

  useEffect(() => {
    if (rol !== "estudiante") return;

    let activo = true;

    obtenerPerfil()
      .then((data) => {
        if (!activo) return;

        setNombres(data.nombres);

        setApellidos(data.apellidos);

        setEmailActual(data.correo);

        if (data.carrera) setCategoria(data.carrera);
      })

      .catch(() => {
        if (activo)
          setPerfilError("No se pudo cargar la información actual del perfil.");
      });

    return () => {
      activo = false;
    };
  }, [rol]);

  const initials = nombre

    .replace("Prof. ", "")

    .split(" ")

    .map((w) => w[0])

    .join("")

    .slice(0, 2)

    .toUpperCase();

  const fieldLabel =
    rol === "coordinador"
      ? "Dependencia"
      : rol === "tutor"
        ? "Especialidad"
        : "Carrera";

  const opciones =
    rol === "coordinador"
      ? DEPARTAMENTOS
      : rol === "tutor"
        ? ESPECIALIDADES
        : CARRERAS_EST;

  const handlePerfilSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setPerfilError("");

    if (rol !== "estudiante") {
      setPerfilSaved(true);

      setEditOpen(false);

      setTimeout(() => setPerfilSaved(false), 3000);

      return;
    }

    try {
      const data = await actualizarPerfil({
        nombres,

        apellidos,

        carrera: categoria,
      });

      setNombres(data.nombres);

      setApellidos(data.apellidos);

      if (data.carrera) setCategoria(data.carrera);

      setPerfilSaved(true);

      setEditOpen(false);

      setTimeout(() => setPerfilSaved(false), 3000);
    } catch (err) {
      setPerfilError(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar los cambios.",
      );
    }
  };

  const handlePwdSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setPwdError("");

    if (!currentPwd) {
      setPwdError("Ingresa tu contraseña actual");

      return;
    }

    if (newPwd.length < 8) {
      setPwdError("Mínimo 8 caracteres");

      return;
    }

    if (newPwd !== confirmPwd) {
      setPwdError("Las contraseñas no coinciden");

      return;
    }

    try {
      await cambiarContrasena(currentPwd, newPwd);

      setPwdSaved(true);

      setCurrentPwd("");

      setNewPwd("");

      setConfirmPwd("");

      setTimeout(() => setPwdSaved(false), 3000);
    } catch (err) {
      setPwdError(
        err instanceof Error
          ? err.message
          : "No se pudo cambiar la contraseña.",
      );
    }
  };

  const changeTab = (tab: PerfilTab) => setActiveTab(tab);

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = perfilTabs.findIndex((tab) => tab.id === activeTab);

    const nextIndex =
      event.key === "ArrowRight"
        ? (currentIndex + 1) % perfilTabs.length
        : event.key === "ArrowLeft"
          ? (currentIndex - 1 + perfilTabs.length) % perfilTabs.length
          : -1;

    if (nextIndex >= 0) {
      event.preventDefault();

      changeTab(perfilTabs[nextIndex].id);
    }
  };

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-5xl space-y-6">
      {/* ── Page heading ─────────────────────────────────────────────── */}

      <div>
        <h2 className="text-foreground text-2xl font-bold">
          Información personal y Configuración de Seguridad
        </h2>
      </div>

      {/* ── Profile hero card ────────────────────────────────────────── */}

      <div className="bg-card dark:bg-[#1c2734] rounded-2xl overflow-hidden border border-border">
        <div
          className="h-1"
          style={{
            background: "#118ab2",
          }}
        />

        <div className="px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}

            <div className="relative shrink-0">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[rgba(59,130,246,0.1)] font-bold text-[#17365D] dark:bg-[rgba(91,155,234,0.1)] dark:text-white"
                style={{
                  fontSize: "1.4rem",
                }}
              >
                {fotoPerfil ? (
                  <img
                    src={fotoPerfil}
                    alt={`Foto de ${nombre}`}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <div
                className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2"
                style={{ background: "#34D399", borderColor: NAVY }}
              />
            </div>

            {/* Identity */}

            <div className="min-w-0 flex-1">
              <p
                className="break-words text-2xl font-bold leading-tight text-foreground dark:text-white sm:text-3xl"
                style={{ letterSpacing: "-0.01em" }}
              >
                {nombre}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[#0F766E] dark:text-[#14B8A6]"
                  style={{
                    background: BRONZE_SOFT,

                    border: `1px solid ${BRONZE_BORDER}`,

                    fontSize: "0.72rem",
                  }}
                >
                  <BookOpen size={12} />

                  {profile.titulo}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSecurityOnly(false);

                setEditOpen(true);
              }}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: "#118ab2", fontSize: "0.82rem" }}
            >
              <Pencil size={14} />

              <span className="hidden sm:inline">Editar</span>
            </button>
          </div>

          <div className="my-4 border-t border-border dark:border-white/20" />

          {/* Contact information */}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
            <div className="flex items-center gap-3">
              <Mail
                size={15}
                className="text-muted-foreground dark:text-white/60 shrink-0"
              />

              <div className="min-w-0">
                <p
                  className="text-muted-foreground dark:text-white/55"
                  style={{ fontSize: "0.65rem" }}
                >
                  Correo electrónico
                </p>

                <p
                  className="text-foreground dark:text-white truncate font-medium"
                  style={{ fontSize: "0.76rem" }}
                >
                  {emailActual}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone
                size={15}
                className="text-muted-foreground dark:text-white/60 shrink-0"
              />

              <div>
                <p
                  className="text-muted-foreground dark:text-white/55"
                  style={{ fontSize: "0.65rem" }}
                >
                  Teléfono
                </p>

                <p
                  className="text-foreground dark:text-white font-medium"
                  style={{ fontSize: "0.76rem" }}
                >
                  {telefono}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin
                size={15}
                className="text-muted-foreground dark:text-white/60 shrink-0"
              />

              <div>
                <p
                  className="text-muted-foreground dark:text-white/55"
                  style={{ fontSize: "0.65rem" }}
                >
                  Ciudad
                </p>

                <p
                  className="text-foreground dark:text-white font-medium"
                  style={{ fontSize: "0.76rem" }}
                >
                  {profile.ciudad}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs container ───────────────────────────────────────────── */}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div
          role="tablist"
          aria-label="Secciones del perfil"
          className="grid grid-cols-1 gap-1 border-b border-border bg-secondary/30 p-1.5 sm:grid-cols-3"
        >
          {perfilTabs.map(({ id, label, icon: Icon }) => {
            const selected = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={label}
                tabIndex={selected ? 0 : -1}
                onClick={() => changeTab(id)}
                onKeyDown={handleTabKeyDown}
                className={`flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-center transition-all ${
                  selected
                    ? "text-white shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                style={{
                  backgroundColor: selected ? "#118AB2" : undefined,

                  fontSize: "0.78rem",
                }}
              >
                <Icon size={15} className="shrink-0" />

                <span className={selected ? "inline" : "hidden sm:inline"}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Contenido de las pestañas ─────────────────────────────────── */}

        <div className="w-full min-w-0 p-4 sm:p-6">
          {/* 1. Pestaña Personal */}

          {activeTab === "personal" && (
            <div>
              {rol === "estudiante" ? (
                <div className="w-full min-w-0 space-y-3">
                  <p
                    className="whitespace-normal break-words text-muted-foreground"
                    style={{
                      fontSize: "0.93rem",

                      lineHeight: 1.65,

                      overflowWrap: "anywhere",
                    }}
                  >
                    Soy estudiante de Ingeniería de Sistemas y me apasiona
                    aprender. Me enfoco en explicar de forma clara, práctica y
                    adaptada a tu ritmo para que realmente entiendas y avances.
                    Actualmente busco fortalecer mis conocimientos en
                    programación y bases de datos.
                  </p>

                  <br></br>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <SectionCard title="Sobre mí" icon={Info} accent>
                    <p
                      className="text-muted-foreground"
                      style={{ fontSize: "0.78rem", lineHeight: 1.65 }}
                    >
                      {rol === "tutor"
                        ? "Tutor académico especializado en Programación y Estructuras de Datos, comprometido con fortalecer el pensamiento lógico, resolver dudas de manera práctica y convertir cada sesión en un avance real hacia el éxito académico."
                        : "Líder académico enfocado en mejorar los procesos de tutoría, impulsar el desempeño estudiantil y fomentar una cultura de aprendizaje colaborativo."}
                    </p>
                  </SectionCard>

                  <SectionCard
                    title={
                      rol === "tutor" ? "Áreas de apoyo" : "Responsabilidades"
                    }
                    icon={BookOpen}
                    accent
                  >
                    <div className="space-y-3">
                      {profile.extra.map(({ icon: Icon, label, value }) => (
                        <div
                          key={label}
                          className="flex items-center gap-2.5 min-w-0"
                        >
                          <Icon
                            size={15}
                            className="text-muted-foreground shrink-0"
                          />

                          <div className="min-w-0">
                            <p
                              className="text-muted-foreground truncate"
                              style={{ fontSize: "0.68rem" }}
                            >
                              {label}
                            </p>

                            <p
                              className="text-card-foreground break-words font-medium"
                              style={{ fontSize: "0.78rem" }}
                            >
                              {value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              )}
            </div>
          )}

          {/* 2. Pestaña Asignaturas */}
          {activeTab === "asignaturas" && (
            <div className="space-y-3">
              {rol === "estudiante" && (
                <div className="space-y-3">
                  {MATERIAS_EN_CURSO.map(
                    ({
                      nombre: materia,
                      nivel,
                      icon: Icon,
                      color,
                      colorClaro,
                      fondo,
                    }) => (
                      <div
                        key={materia}
                        className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-secondary/50 p-4 transition-all hover:bg-secondary dark:bg-slate-900/30 dark:hover:bg-slate-900/50"
                      >
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[color:var(--cl)] dark:text-[color:var(--c)]"
                          style={
                            {
                              background: fondo,
                              "--c": color,
                              "--cl": colorClaro,
                            } as React.CSSProperties
                          }
                        >
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="font-semibold text-card-foreground"
                            style={{ fontSize: "0.88rem" }}
                          >
                            {materia}
                          </p>
                          <span
                            className="mt-1 inline-flex items-center justify-center rounded-full px-3 py-0.5 font-medium text-[color:var(--cl)] dark:text-[color:var(--c)]"
                            style={
                              {
                                background: fondo,
                                "--c": color,
                                "--cl": colorClaro,
                                fontSize: "0.72rem",
                              } as React.CSSProperties
                            }
                          >
                            {nivel}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
              {/* Sección de Áreas de apoyo del tutor*/}
              {rol === "tutor" && (
                <div className="space-y-3">
                  {ESPECIALIDADES.map((area) => (
                    <div
                      key={area}
                      className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 p-4 transition-colors hover:bg-secondary dark:bg-slate-900/30 dark:hover:bg-slate-900/50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        <BookOpen size={19} />
                      </div>
                      <p className="min-w-0 flex-1 text-sm font-medium text-card-foreground">
                        {area}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {rol === "coordinador" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Departamentos que pueden formar parte de las áreas de
                    seguimiento académico.
                  </p>
                  {DEPARTAMENTOS.map((area) => (
                    <div
                      key={area}
                      className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 p-4 transition-colors hover:bg-secondary dark:bg-slate-900/30 dark:hover:bg-slate-900/50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Users size={19} />
                      </div>
                      <p className="min-w-0 flex-1 text-sm font-medium text-card-foreground">
                        {area}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Pestaña Seguridad */}

          {activeTab === "seguridad" && (
            <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="pl-2 sm:pl-4">
                <p
                  className="text-card-foreground font-medium"
                  style={{ fontSize: "0.88rem" }}
                >
                  Contraseña y acceso
                </p>

                <p
                  className="text-muted-foreground mt-0.5"
                  style={{ fontSize: "0.82rem" }}
                >
                  Actualiza tu contraseña institucional desde el formulario de
                  seguridad.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSecurityOnly(true);

                  setEditOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 min-h-11 rounded-xl border border-[#118AB2] px-4 py-2.5 font-medium text-[#118AB2] transition-all hover:bg-[#118AB2] hover:text-white shrink-0"
                style={{
                  fontSize: "0.8rem",
                }}
              >
                <Pencil size={14} className="shrink-0" />

                <span>Gestionar acceso</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal de Edición (adaptable a modo claro y oscuro) ────────── */}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          className={`${esOscuro ? "dark " : ""}max-h-[90vh] overflow-y-auto border-border bg-background text-foreground shadow-2xl sm:max-w-2xl`}
        >
          <DialogHeader>
            <DialogTitle className="text-foreground text-2xl font-semibold">
              {securityOnly ? "Seguridad de la cuenta" : "Editar información"}
            </DialogTitle>

            {securityOnly && (
              <DialogDescription className="text-muted-foreground">
                Confirma tu correo y actualiza tu contraseña.
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-6">
            {perfilError && (
              <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-destructive text-xs">
                <AlertCircle size={15} className="shrink-0" />

                <span>{perfilError}</span>
              </div>
            )}

            {/* ── Formulario: Editar información personal ── */}

            {!securityOnly && (
              <form onSubmit={handlePerfilSave} className="space-y-4">
                <h3
                  className="text-foreground font-semibold"
                  style={{ fontSize: "0.95rem" }}
                >
                  Datos personales
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-[132px_1fr] gap-4 items-start">
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-secondary/50 p-3">
                    <p
                      className="self-start text-muted-foreground"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Fotografía
                    </p>

                    <div
                      className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden font-bold"
                      style={{
                        background: " #118AB2",

                        color: "#fff",

                        fontSize: "1.15rem",
                      }}
                    >
                      {fotoPerfil ? (
                        <img
                          src={fotoPerfil}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>

                    <label
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary px-2 py-2 text-foreground transition-colors hover:bg-secondary/70"
                      style={{ fontSize: "0.72rem" }}
                    >
                      <Camera size={13} />
                      Cambiar foto
                      <input
                        type="file"
                        accept="image/\*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];

                          if (file) setFotoPerfil(URL.createObjectURL(file));
                        }}
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field
                        label="Nombres"
                        value={nombres}
                        onChange={setNombres}
                      />

                      <Field
                        label="Apellidos"
                        value={apellidos}
                        onChange={setApellidos}
                      />
                    </div>

                    <Field
                      label="Fecha de nacimiento"
                      value={fechaNacimiento}
                      onChange={setFechaNacimiento}
                      type="date"
                    />
                  </div>
                </div>

                <Field
                  label="Correo electrónico"
                  value={emailActual}
                  disabled
                />

                <p
                  className="text-muted-foreground"
                  style={{ fontSize: "0.63rem", marginTop: "-8px" }}
                >
                  El correo institucional no puede modificarse
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Teléfono"
                    value={telefono}
                    onChange={setTelefono}
                    type="tel"
                  />

                  <Field label="Ciudad" value={ciudad} onChange={setCiudad} />
                </div>

                <div className="space-y-1.5">
                  <label
                    className="block text-foreground"
                    style={{ fontSize: "0.8rem" }}
                  >
                    {fieldLabel}
                  </label>

                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-border bg-input-background px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring"
                    style={
                      {
                        fontSize: "0.875rem",

                        "--tw-ring-color": BRONZE,

                        colorScheme: "light dark",
                      } as React.CSSProperties
                    }
                  >
                    {opciones.map((o) => (
                      <option
                        key={o}
                        value={o}
                        className="bg-background text-foreground"
                      >
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end pt-2">
                  <SaveButton saved={perfilSaved} label="Guardar información" />
                </div>
              </form>
            )}

            {/* ── Formulario: Seguridad de la cuenta (Gestionar acceso) ── */}
            {securityOnly && (
              <div className="pt-2">
                <form onSubmit={handlePwdSave} className="space-y-4">
                  <Field label="Correo electrónico" value={email} disabled />

                  {pwdError && (
                    <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive text-xs">
                      <AlertCircle size={14} className="shrink-0" />

                      <span>{pwdError}</span>
                    </div>
                  )}

                  <PwdField
                    label="Contraseña actual"
                    value={currentPwd}
                    onChange={setCurrentPwd}
                  />

                  <PwdField
                    label="Nueva contraseña"
                    value={newPwd}
                    onChange={setNewPwd}
                  />

                  <PwdField
                    label="Confirmar nueva contraseña"
                    value={confirmPwd}
                    onChange={setConfirmPwd}
                  />

                  {/* Indicador de fuerza de la contraseña */}
                  {newPwd.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-1.5 flex-1 rounded-full transition-all duration-300"
                            style={{
                              background:
                                i <= strength.score
                                  ? strength.color
                                  : "var(--border)",
                            }}
                          />
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p
                          style={{
                            fontSize: "0.73rem",

                            color: strength.color,
                          }}
                        >
                          Contraseña {strength.label}
                        </p>

                        <p
                          className="text-muted-foreground"
                          style={{ fontSize: "0.68rem" }}
                        >
                          Usa mayúsculas, números y símbolos
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <SaveButton
                      saved={pwdSaved}
                      label="Actualizar contraseña"
                    />
                  </div>
                </form>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 flex-row justify-end gap-4">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-xl border px-5 py-2.5 bg-red-500/5 transition-colors hover:bg-red-500/15 focus-visible:outline-none

              focus-visible:ring-2 focus-visible:ring-red-400

              text-xs font-medium"
              style={{
                color: "#C96F78",

                borderColor: "rgba(201,111,120,0.35)",
              }}
            >
              Cancelar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
