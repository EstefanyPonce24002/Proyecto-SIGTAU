import { useEffect, useState } from "react";
import {
  Lock,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Award,
  BookOpen,
  Calendar,
  Pencil,
  Camera,
  Code2,
  Database,
  Share2,
  Star,
  Users,
  Target,
  CalendarDays,
  ChevronRight,
  Info,
  ChevronDown,
  UserRound,
  Settings,
} from "lucide-react";
import { obtenerPerfil, actualizarPerfil, cambiarContrasena } from "../lib/perfil";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

type Rol = "estudiante" | "tutor" | "coordinador";
type PerfilTab = "personal" | "asignaturas" | "preferencias" | "seguridad";

const PERFIL_TABS: { id: PerfilTab; label: string; icon: React.ElementType }[] =
  [
    { id: "personal", label: "Información personal", icon: UserRound },
    { id: "asignaturas", label: "Asignaturas en curso", icon: BookOpen },
    { id: "preferencias", label: "Preferencias de tutoría", icon: Settings },
    { id: "seguridad", label: "Seguridad", icon: Lock },
  ];

/* ─── Design tokens (bronze accent) ───────────────────────────────────── */
const BRONZE = "#F59E0B";
const BRONZE_SOFT = "rgba(245,158,11,0.1)";
const BRONZE_BORDER = "rgba(245,158,11,0.3)";
const NAVY = "#1E3A8A";

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
      { icon: Award, label: "Promedio acum.", value: "4.1 / 5.0" },
      { icon: Calendar, label: "Ciclo actual", value: "2026-I · Semestre VI" },
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
      { icon: Award, label: "Sesiones totales", value: "217 completadas" },
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

const ROL_LABELS: Record<Rol, string> = {
  estudiante: "Estudiante",
  tutor: "Tutor Académico",
  coordinador: "Coordinador Académico",
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
  "Matemáticas y Cálculo",
  "Álgebra Lineal",
  "Programación y Algoritmos",
  "Bases de Datos",
  "Física Mecánica",
  "Estadística Aplicada",
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
    fondo: "rgba(91,155,234,0.14)",
  },
  {
    nombre: "Bases de Datos",
    nivel: "Intermedio",
    icon: Database,
    color: "#9B7BEA",
    fondo: "rgba(155,123,234,0.14)",
  },
  {
    nombre: "Estructuras de Datos",
    nivel: "Avanzado",
    icon: Share2,
    color: "#42C7AF",
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
  if (pwd.length < 10) return { score: 2, label: "Regular", color: "#F59E0B" };
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd))
    return { score: 4, label: "Fuerte", color: "#10B981" };
  return { score: 3, label: "Buena", color: BRONZE };
}

/* ─── Field input ──────────────────────────────────────────────────────── */
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
      <label className="text-card-foreground" style={{ fontSize: "0.8rem" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        className="w-full rounded-xl border bg-input-background px-4 py-2.5 text-card-foreground outline-none transition-all focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
        style={
          {
            fontSize: "0.875rem",
            borderColor: "var(--border)",
            "--tw-ring-color": BRONZE,
            background: disabled ? "var(--secondary)" : undefined,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

/* ─── Password field ───────────────────────────────────────────────────── */
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
      <label className="text-card-foreground" style={{ fontSize: "0.8rem" }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 pr-11 text-card-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
          style={
            {
              fontSize: "0.875rem",
              "--tw-ring-color": BRONZE,
            } as React.CSSProperties
          }
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        style={{ background: accent ? BRONZE_SOFT : undefined }}
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
        background: saved
          ? `linear-gradient(135deg, ${BRONZE}, #D97706)`
          : `linear-gradient(135deg, ${NAVY}, #3B82F6)`,
        fontSize: "0.875rem",
      }}
    >
      {saved ? "✓ Guardado" : label}
    </button>
  );
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
        {label}
      </p>
      <p
        className="text-card-foreground rounded-xl border border-border bg-secondary/40 px-4 py-2.5"
        style={{ fontSize: "0.875rem" }}
      >
        {value}
      </p>
    </div>
  );
}

function formatDate(date: string) {
  if (!date) return "No registrada";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

/* ═══════════════════════════════════════════════════════════════════════ */
interface Props {
  rol: Rol;
  nombre: string;
  email: string;
}

export function MiPerfil({ rol, nombre, email }: Props) {
  const profile = PROFILE_DATA[rol];
  const partes = nombre.replace("Prof. ", "").split(" ");

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
  const [sobreMiExpandido, setSobreMiExpandido] = useState(false);

  /* Security state */
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSaved, setPwdSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<PerfilTab>("personal");

  const strength = strengthOf(newPwd);
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
        if (activo) setPerfilError("No se pudo cargar la información actual del perfil.");
      })

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
      setPerfilError(err instanceof Error ? err.message : "No se pudieron guardar los cambios.");
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
      setPwdError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.");
    }
  };

  const changeTab = (tab: PerfilTab) => setActiveTab(tab);

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = PERFIL_TABS.findIndex((tab) => tab.id === activeTab);
    const nextIndex =
      event.key === "ArrowRight"
        ? (currentIndex + 1) % PERFIL_TABS.length
        : event.key === "ArrowLeft"
          ? (currentIndex - 1 + PERFIL_TABS.length) % PERFIL_TABS.length
          : -1;

    if (nextIndex >= 0) {
      event.preventDefault();
      changeTab(PERFIL_TABS[nextIndex].id);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      {/* ── Page heading ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-foreground">Mi Perfil</h2>
        <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
          Información personal y Configuración de Seguridad
        </p>
      </div>

      {/* ── Profile hero card ────────────────────────────────────────── */}
      <div
        className="bg-card rounded-2xl overflow-hidden border border-border"
        style={{
          background: `linear-gradient(145deg, ${NAVY} 0%, #162550 100%)`,
        }}
      >
        {/* Bronze accent strip */}
        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, ${BRONZE}, #D97706, ${BRONZE})`,
          }}
        />

        <div className="px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${BRONZE} 0%, #D97706 100%)`,
                  boxShadow: `0 0 0 3px rgba(245,158,11,0.25)`,
                  fontSize: "1.4rem",
                  color: "#fff",
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
                style={{ background: "#10B981", borderColor: NAVY }}
              />
            </div>

            {/* Identity */}
            <div className="min-w-0 flex-1">
              <p
                className="break-words text-2xl leading-tight sm:text-3xl"
                style={{ color: "#fff", letterSpacing: "-0.01em" }}
              >
                {nombre}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                  style={{
                    background: BRONZE_SOFT,
                    color: BRONZE,
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
              style={{ background: BRONZE, fontSize: "0.82rem" }}
            >
              <Pencil size={14} />
              <span className="hidden sm:inline">Editar</span>
            </button>
          </div>

          <div className="my-4 border-t border-white/20" />

          {/* Contact information */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
            <div className="flex items-center gap-3">
              <Mail size={15} className="text-white/60 shrink-0" />
              <div className="min-w-0">
                <p className="text-white/55" style={{ fontSize: "0.65rem" }}>
                  Correo electrónico
                </p>
                <p
                  className="text-white truncate"
                  style={{ fontSize: "0.76rem" }}
                >
                  {emailActual}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={15} className="text-white/60 shrink-0" />
              <div>
                <p className="text-white/55" style={{ fontSize: "0.65rem" }}>
                  Teléfono
                </p>
                <p className="text-white" style={{ fontSize: "0.76rem" }}>
                  {telefono}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={15} className="text-white/60 shrink-0" />
              <div>
                <p className="text-white/55" style={{ fontSize: "0.65rem" }}>
                  Ciudad
                </p>
                <p className="text-white" style={{ fontSize: "0.76rem" }}>
                  {profile.ciudad}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Secciones del perfil"
        className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-card p-1.5 sm:grid-cols-4"
      >
        {PERFIL_TABS.map(({ id, label, icon: Icon }) => {
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
              className={`flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-center transition-all ${selected ? "text-white shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
              style={{
                background: selected ? "var(--brand-teal)" : undefined,
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

      {/* ── Información en modo lectura ──────────────────────────────── */}
      <div className="w-full">
        {rol === "estudiante" ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {activeTab === "personal" && (
              <SectionCard title="Sobre mí" icon={Info} accent>
                <div className="space-y-3">
                  <p
                    className="text-muted-foreground"
                    style={{ fontSize: "0.78rem", lineHeight: 1.65 }}
                  >
                    Soy estudiante de Ingeniería de Sistemas y me apasiona
                    aprender. Me enfoco en explicar de forma clara, práctica y
                    adaptada a tu ritmo para que realmente entiendas y avances.
                  </p>
                  {sobreMiExpandido && (
                    <p
                      className="text-muted-foreground"
                      style={{ fontSize: "0.78rem", lineHeight: 1.65 }}
                    >
                      Actualmente busco fortalecer mis conocimientos en
                      programación y bases de datos mediante sesiones dinámicas
                      y orientadas a objetivos.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setSobreMiExpandido(!sobreMiExpandido)}
                    className="inline-flex items-center gap-1 text-left transition-colors hover:opacity-75"
                    style={{ color: "#4E91D8", fontSize: "0.74rem" }}
                  >
                    {sobreMiExpandido ? "Ver menos" : "Ver más"}
                    <ChevronDown
                      size={13}
                      className={sobreMiExpandido ? "rotate-180" : ""}
                    />
                  </button>
                </div>
              </SectionCard>
            )}

            {activeTab === "asignaturas" && (
              <SectionCard title="Materias en curso" icon={BookOpen} accent>
                <div className="space-y-3">
                  {MATERIAS_EN_CURSO.map(
                    ({ nombre: materia, nivel, icon: Icon, color, fondo }) => (
                      <div
                        key={materia}
                        className="flex items-center gap-3 rounded-xl border border-border px-3 py-3"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: fondo, color }}
                        >
                          <Icon size={19} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-card-foreground"
                            style={{ fontSize: "0.84rem" }}
                          >
                            {materia}
                          </p>
                          <span
                            className="inline-flex rounded-full px-2 py-0.5 mt-1"
                            style={{
                              background: fondo,
                              color,
                              fontSize: "0.68rem",
                            }}
                          >
                            {nivel}
                          </span>
                        </div>
                        <ChevronRight
                          size={15}
                          className="text-muted-foreground shrink-0"
                        />
                      </div>
                    ),
                  )}
                </div>
              </SectionCard>
            )}

            {activeTab === "preferencias" && (
              <SectionCard title="Preferencias de tutoría" icon={Star} accent>
                <div className="space-y-3 w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BookOpen
                      size={15}
                      className="text-muted-foreground shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-muted-foreground truncate"
                        style={{ fontSize: "0.68rem" }}
                      >
                        Estilo de aprendizaje
                      </p>
                      <p
                        className="text-card-foreground break-words"
                        style={{ fontSize: "0.78rem" }}
                      >
                        Visual / Práctico
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Users
                      size={15}
                      className="text-muted-foreground shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-muted-foreground truncate"
                        style={{ fontSize: "0.68rem" }}
                      >
                        Tutoría
                      </p>
                      <p
                        className="text-card-foreground break-words"
                        style={{ fontSize: "0.78rem" }}
                      >
                        Individual o grupo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Target
                      size={15}
                      className="text-muted-foreground shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-muted-foreground truncate"
                        style={{ fontSize: "0.68rem" }}
                      >
                        Intereses y metas
                      </p>
                      <p
                        className="text-card-foreground break-words"
                        style={{ fontSize: "0.78rem" }}
                      >
                        Mejora académica
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CalendarDays
                      size={15}
                      className="text-muted-foreground shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-muted-foreground truncate"
                        style={{ fontSize: "0.68rem" }}
                      >
                        Disponibilidad
                      </p>
                      <p
                        className="text-card-foreground break-words"
                        style={{ fontSize: "0.78rem" }}
                      >
                        Lun - Vie · horarios flexibles
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            <SectionCard title="Sobre mí" icon={Info} accent>
              <p
                className="text-muted-foreground"
                style={{ fontSize: "0.78rem", lineHeight: 1.65 }}
              >
                {rol === "tutor"
                  ? "Tutor académico comprometido con acompañar a los estudiantes y convertir cada sesión en un avance concreto."
                  : "Coordinador académico enfocado en organizar el acompañamiento y fortalecer la experiencia de aprendizaje."}
              </p>
            </SectionCard>

            <SectionCard
              title={rol === "tutor" ? "Áreas de apoyo" : "Responsabilidades"}
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
                        className="text-card-foreground break-words"
                        style={{ fontSize: "0.78rem" }}
                      >
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Resumen" icon={Award} accent>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <Calendar
                    size={15}
                    className="text-muted-foreground shrink-0"
                  />
                  <div>
                    <p
                      className="text-muted-foreground"
                      style={{ fontSize: "0.68rem" }}
                    >
                      Trayectoria
                    </p>
                    <p
                      className="text-card-foreground"
                      style={{ fontSize: "0.78rem" }}
                    >
                      {profile.ciclo}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone size={15} className="text-muted-foreground shrink-0" />
                  <div>
                    <p
                      className="text-muted-foreground"
                      style={{ fontSize: "0.68rem" }}
                    >
                      Contacto
                    </p>
                    <p
                      className="text-card-foreground"
                      style={{ fontSize: "0.78rem" }}
                    >
                      {telefono}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin
                    size={15}
                    className="text-muted-foreground shrink-0"
                  />
                  <div>
                    <p
                      className="text-muted-foreground"
                      style={{ fontSize: "0.68rem" }}
                    >
                      Ubicación
                    </p>
                    <p
                      className="text-card-foreground"
                      style={{ fontSize: "0.78rem" }}
                    >
                      {profile.ciudad}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === "seguridad" && (
          <SectionCard title="Seguridad" icon={Lock} accent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Lock size={18} className="mt-0.5 text-muted-foreground" />
                <div>
                  <p
                    className="text-card-foreground"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Contraseña y acceso
                  </p>
                  <p
                    className="text-muted-foreground"
                    style={{ fontSize: "0.75rem" }}
                  >
                    Actualiza tu contraseña institucional desde el formulario de
                    seguridad.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSecurityOnly(true);
                  setEditOpen(true);
                }}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-white transition-all hover:opacity-90"
                style={{ background: NAVY, fontSize: "0.8rem" }}
              >
                <Pencil size={14} />
                Gestionar acceso
              </button>
            </div>
          </SectionCard>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card text-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {securityOnly ? "Seguridad de la cuenta" : "Editar información"}
            </DialogTitle>
            <DialogDescription>
              {securityOnly
                ? "Confirma tu correo y actualiza tu contraseña."
                : "Actualiza tus datos personales o cambia tu contraseña."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {!securityOnly && (
              <form onSubmit={handlePerfilSave} className="space-y-4">
                <h3
                  className="text-card-foreground"
                  style={{ fontSize: "0.95rem" }}
                >
                  Datos personales
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-[132px_1fr] gap-4 items-start">
                  <div className="rounded-xl border border-border bg-secondary/30 p-3 flex flex-col items-center gap-2">
                    <p
                      className="text-muted-foreground self-start"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Fotografía
                    </p>
                    <div
                      className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${BRONZE} 0%, #D97706 100%)`,
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
                      className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg border border-border px-2 py-2 text-muted-foreground hover:bg-secondary cursor-pointer transition-colors"
                      style={{ fontSize: "0.72rem" }}
                    >
                      <Camera size={13} />
                      Cambiar foto
                      <input
                        type="file"
                        accept="image/*"
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
                <Field label="Correo electrónico" value={emailActual} disabled />
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
                    className="text-card-foreground"
                    style={{ fontSize: "0.8rem" }}
                  >
                    {fieldLabel}
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full rounded-xl border border-border bg-input-background text-card-foreground px-4 py-2.5 outline-none focus:ring-2 appearance-none transition-all"
                    style={
                      {
                        fontSize: "0.875rem",
                        "--tw-ring-color": BRONZE,
                      } as React.CSSProperties
                    }
                  >
                    {opciones.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end">
                  <SaveButton saved={perfilSaved} label="Guardar información" />
                </div>
              </form>
            )}

            {securityOnly && (
              <div className="border-t border-border pt-6">
                <form onSubmit={handlePwdSave} className="space-y-4">
                  <h3
                    className="text-card-foreground"
                    style={{ fontSize: "0.95rem" }}
                  >
                    Seguridad
                  </h3>

                  {securityOnly && (
                    <Field label="Correo electrónico" value={email} disabled />
                  )}

                  {/* Error */}
                  <div
                    className="overflow-hidden transition-all duration-200"
                    style={{
                      maxHeight: pwdError ? "60px" : "0px",
                      opacity: pwdError ? 1 : 0,
                    }}
                  >
                    <div
                      className="flex items-center gap-2.5 rounded-xl px-4 py-3"
                      style={{
                        background: "rgba(239,68,68,0.07)",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      <AlertCircle
                        size={13}
                        className="text-destructive shrink-0"
                      />
                      <p
                        className="text-destructive"
                        style={{ fontSize: "0.82rem" }}
                      >
                        {pwdError}
                      </p>
                    </div>
                  </div>

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

                  {/* Strength bar */}
                  {newPwd.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="flex-1 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              background:
                                i <= strength.score
                                  ? strength.color
                                  : "var(--border)",
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <p
                          style={{ fontSize: "0.73rem", color: strength.color }}
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

                  <div className="flex justify-end pt-1">
                    <SaveButton
                      saved={pwdSaved}
                      label="Actualizar contraseña"
                    />
                  </div>
                </form>
              </div>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-xl border px-5 py-2.5 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                fontSize: "0.875rem",
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
