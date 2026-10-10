// IMPORTACIONES
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  CheckCircle2,
  LayoutDashboard,
  GraduationCap,
  CheckSquare,
  ChevronDown,
  BarChart3,
  Calendar,
  CalendarClock,
  User,
  Users,
  ClipboardList,
  History,
  BookOpen,
  Shield,
  BellRing,
  LogOut,
  Settings,
  MessageCircle,
} from "lucide-react";

// Importación de la lógica de autenticación (API)
import { logout as logoutApi } from "./lib/auth";

// Importación de todos los componentes de las pantallas/vistas
import { LoginScreen } from "./components/LoginScreen";
import { RecuperarContrasena } from "./components/RecuperarContrasena";
import { RestablecerContrasena } from "./components/RestablecerContrasena";
import { Inicio } from "./components/Inicio";
import { Ajustes } from "./components/Ajustes";
import { SolicitudTutoria } from "./components/SolicitudTutoria";
import { SeguimientoAcademico } from "./components/SeguimientoAcademico";
import { DashboardReportes } from "./components/DashboardReportes";
import { GestionHorarios } from "./components/GestionHorarios";
import { MiPerfil } from "./components/MiPerfil";
import { HistorialTutorias } from "./components/HistorialTutorias";
import { HistorialSesiones } from "./components/HistorialSesiones";
import { SolicitudesPendientes } from "./components/SolicitudesPendientes";
import { GestionUsuarios } from "./components/GestionUsuarios";
import { NotificacionesBell } from "./components/NotificacionesBell";
import { DashboardCoord } from "./components/DashboardCoord";
import { Asignaturas } from "./components/Asignaturas";
import { Supervision } from "./components/Supervision";
import { Notificaciones } from "./components/Notificaciones";
import { ProximosEventos } from "./components/ProximosEventos";
import { VoiceSearchInput } from "./components/VoiceSearchInput";
import { Mensajes } from "./components/Mensajes";
import { CalendarioTutor } from "./components/CalendarioTutor";

// TIPOS Y CONSTANTES GLOBALES
type Rol = "estudiante" | "tutor" | "coordinador";
type Screen = "login" | "recuperar" | "restablecer" | "app";
type Tab = string;

interface NavItem {
  id: Tab;
  path: string;
  label: string;
  icon: React.ElementType;
  roles: Rol[];
  showInNav?: boolean;
}

// Configuración de todas las rutas de navegación de la app
const NAV_ITEMS: NavItem[] = [
  {
    id: "inicio",
    path: "inicio",
    label: "Inicio",
    icon: LayoutDashboard,
    roles: ["estudiante"],
  },
  {
    id: "historial",
    path: "historial",
    label: "Inicio / Historial",
    icon: LayoutDashboard,
    roles: ["estudiante"],
  },
  {
    id: "solicitud",
    path: "solicitud",
    label: "Solicitar Tutoría",
    icon: GraduationCap,
    roles: ["estudiante"],
  },
  {
    id: "eventos",
    path: "eventos",
    label: "Próximos eventos",
    icon: CalendarClock,
    roles: ["estudiante"],
  },
  {
    id: "solicitudes",
    path: "solicitudes",
    label: "Solicitudes Pendientes",
    icon: ClipboardList,
    roles: ["tutor"],
  },
  {
    id: "seguimiento",
    path: "seguimiento",
    label: "Registrar Seguimiento",
    icon: CheckSquare,
    roles: ["tutor"],
  },
  {
    id: "horarios",
    path: "horarios",
    label: "Mis Horarios",
    icon: Calendar,
    roles: ["tutor"],
  },
  {
    id: "calendario-tutor",
    path: "calendario",
    label: "Calendario",
    icon: Calendar,
    roles: ["tutor"],
  },
  {
    id: "historial-sesiones",
    path: "historial-sesiones",
    label: "Historial de Sesiones",
    icon: History,
    roles: ["tutor"],
  },
  {
    id: "dashboard-coord",
    path: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["coordinador"],
  },
  {
    id: "usuarios",
    path: "usuarios",
    label: "Usuarios",
    icon: Users,
    roles: ["coordinador"],
  },
  {
    id: "reportes",
    path: "reportes",
    label: "Reportes",
    icon: BarChart3,
    roles: ["coordinador"],
  },
  {
    id: "asignaturas",
    path: "asignaturas",
    label: "Asignaturas",
    icon: BookOpen,
    roles: ["coordinador"],
  },
  {
    id: "supervision",
    path: "supervision",
    label: "Supervisión",
    icon: Shield,
    roles: ["coordinador"],
  },
  {
    id: "notificaciones",
    path: "notificaciones",
    label: "Notificaciones",
    icon: BellRing,
    roles: ["coordinador"],
  },
  {
    id: "mensajes",
    path: "mensajes",
    label: "Mensajes",
    icon: MessageCircle,
    roles: ["estudiante", "tutor"],
  },
  {
    id: "perfil",
    path: "perfil",
    label: "Mi Perfil",
    icon: User,
    roles: ["estudiante", "tutor", "coordinador"],
  },
  {
    id: "ajustes",
    path: "ajustes",
    label: "Ajustes",
    icon: Settings,
    roles: ["estudiante", "tutor", "coordinador"],
    showInNav: false,
  },
];

// Pestaña por defecto según el rol del usuario al iniciar sesión
const DEFAULT_TAB: Record<Rol, Tab> = {
  estudiante: "inicio",
  tutor: "solicitudes",
  coordinador: "dashboard-coord",
};

// Correos de prueba para cada rol
const EMAILS: Record<Rol, string> = {
  estudiante: "maria.gomez@universidad.edu.sv",
  tutor: "andres.ramirez@universidad.edu.sv",
  coordinador: "coordinacion@universidad.edu.sv",
};

const SESSION_KEY = "sigtau_session";
type Session = { rol: Rol; nombre: string; idUsuario: number };

// Función para normalizar texto (quitar acentos y minúsculas) para búsquedas
function normalizarBusqueda(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// COMPONENTE PRINCIPAL APP
export default function App() {
  // --- SECCIÓN 1: HOOKS Y ESTADO GLOBAL ---
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    localStorage.getItem("sigtau_theme") === "dark" ? "dark" : "light",
  );
  const [session, setSession] = useState<Session | null>(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? (JSON.parse(stored) as Session) : null;
  });
  const [solicitudOk, setSolicitudOk] = useState(false);
  const [busquedaGlobal, setBusquedaGlobal] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // --- SECCIÓN 2: EFECTOS (useEffect) ---
  // Persistir el tema en localStorage
  useEffect(() => {
    localStorage.setItem("sigtau_theme", theme);
  }, [theme]);

  // Cerrar el menú de perfil al cambiar de ruta
  useEffect(() => {
    setProfileMenuOpen(false);
  }, [pathname]);

  // Cerrar el menú de perfil al hacer clic fuera de él
  useEffect(() => {
    if (!profileMenuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [profileMenuOpen]);

  // --- SECCIÓN 3: LÓGICA DE RUTAS Y NAVEGACIÓN ---
  const isAppPath = pathname.startsWith("/app/");
  const isHomePath = pathname === "/home";
  const requestedPath =
    isHomePath && session
      ? (NAV_ITEMS.find((item) => item.id === DEFAULT_TAB[session.rol])?.path ??
        "")
      : isAppPath
        ? pathname.replace("/app/", "")
        : "";
  const activeItem = NAV_ITEMS.find((item) => item.path === requestedPath);
  const activeTab = activeItem?.id ?? "";
  const screen: Screen =
    pathname === "/recuperar"
      ? "recuperar"
      : pathname === "/restablecer"
        ? "restablecer"
        : isAppPath || isHomePath
          ? "app"
          : "login";

  // --- SECCIÓN 4: MANEJADORES DE SESIÓN ---
  const handleLogin = (rol: Rol, nombre: string, idUsuario: number) => {
    const nextSession = { rol, nombre, idUsuario };
    setSession(nextSession);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSolicitudOk(false);
    navigate(
      `/app/${NAV_ITEMS.find((item) => item.id === DEFAULT_TAB[rol])!.path}`,
    );
  };

  const handleLogout = () => {
    logoutApi();
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    navigate("/login");
  };

  // Redirigir si no hay sesión o si el rol no tiene permiso para la ruta
  useEffect(() => {
    if (screen === "app" && !session) {
      navigate("/login", { replace: true });
      return;
    }
    if (screen === "app" && session) {
      const allowed = activeItem?.roles.includes(session.rol) ?? false;
      if (!allowed) {
        const defaultItem = NAV_ITEMS.find(
          (item) => item.id === DEFAULT_TAB[session.rol],
        );
        navigate(`/app/${defaultItem!.path}`, { replace: true });
      }
    }
  }, [activeItem, navigate, screen, session]);

  // --- SECCIÓN 5: RENDERIZADO DE PANTALLAS DE AUTENTICACIÓN ---
  /* ── Pantalla de Login ── */
  if (screen === "login") {
    return (
      <div className={theme === "dark" ? "dark" : ""}>
        <LoginScreen
          dark={theme === "dark"}
          onToggleDark={() => setTheme(theme === "dark" ? "light" : "dark")}
          onLogin={handleLogin}
          onForgot={() => navigate("/recuperar")}
        />
      </div>
    );
  }

  /* ── Pantalla de Restablecer Contraseña ── */
  if (screen === "restablecer") {
    return (
      <div className={theme === "dark" ? "dark" : ""}>
        <RestablecerContrasena onBack={() => navigate("/login")} />
      </div>
    );
  }

  /* ── Pantalla de Recuperar Contraseña ── */
  if (screen === "recuperar") {
    return (
      <div className={theme === "dark" ? "dark" : ""}>
        <RecuperarContrasena onBack={() => navigate("/login")} />
      </div>
    );
  }

  if (!session) return null;

  // --- SECCIÓN 6: PREPARACIÓN DE DATOS PARA LA APP ---
  const { rol, nombre, idUsuario } = session!;
  const email = EMAILS[rol];
  const nombreCompleto = nombre.trim() || "Usuario";
  const rolLabel =
    rol === "estudiante"
      ? "Estudiante"
      : rol === "tutor"
        ? "Tutor"
        : "Coordinador";

  // Filtro para la barra de búsqueda global
  const resultadosBusqueda = busquedaGlobal.trim()
    ? NAV_ITEMS.filter((item) => {
        const texto = normalizarBusqueda(
          `${item.label} ${item.id} ${item.path}`,
        );
        return texto.includes(normalizarBusqueda(busquedaGlobal.trim()));
      })
        .filter((item) => item.roles.includes(rol))
        .slice(0, 6)
    : [];

  const handleNavigate = (tab: Tab) => {
    const nextItem = NAV_ITEMS.find((item) => item.id === tab);
    if (!nextItem) return;
    navigate(`/app/${nextItem.path}`);
    setSolicitudOk(false);
  };

  // --- SECCIÓN 7: RENDERIZADO PRINCIPAL (APP SHELL) ---
  return (
    <div
      className={theme === "dark" ? "dark" : ""}
      style={{ minHeight: "100vh" }}
    >
      <div className="min-h-screen bg-background transition-colors duration-300 flex">
        {/* ── COLUMNA PRINCIPAL ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ── HEADER FIJO ── */}
          <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center gap-3 border-b border-border/70 bg-background px-4 sm:px-5 transition-colors duration-300">
            {/* Logo SIGTAU */}
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="flex flex-col items-start gap-0 rounded-xl px-3 py-2 text-left transition-opacity hover:bg-secondary hover:opacity-90"
                aria-label="Ir al inicio"
              >
                <span
                  className="shrink-0 text-foreground"
                  style={{
                    fontSize: "1.45rem",
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: "0.01em",
                  }}
                >
                  SIG<span style={{ color: "var(--brand-blue)" }}>TAU</span>
                </span>
                <span className="mt-1 max-w-[210px] text-[0.65rem] font-semibold leading-tight text-muted-foreground sm:text-[0.70rem]">
                  Sistema Integral de Gestión
                  <br />
                  de Tutorías Académicas
                </span>
              </button>
            </div>

            {/* Barra de Búsqueda Global */}
            <div className="relative ml-auto min-w-0 max-w-md flex-1">
              <VoiceSearchInput
                value={busquedaGlobal}
                onChange={setBusquedaGlobal}
                placeholder="Buscar tutoría, tutor o asignatura..."
                className="rounded-xl border-border-strong bg-input-background py-2.5 text-sm hover:border-primary focus:border-primary sm:py-2.5"
              />
              {busquedaGlobal.trim() && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-lg">
                  {resultadosBusqueda.length > 0 ? (
                    resultadosBusqueda.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            handleNavigate(item.id);
                            setBusquedaGlobal("");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
                        >
                          <Icon
                            size={15}
                            className="shrink-0 text-brand-blue"
                          />
                          <span>{item.label}</span>
                        </button>
                      );
                    })
                  ) : (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      No se encontraron secciones relacionadas.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Menú de Perfil y Notificaciones */}
            <div className="flex shrink-0 items-center gap-2">
              {/* Menú de Perfil */}
              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex h-10 max-w-[46vw] items-center gap-2 rounded-xl border border-border px-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground sm:max-w-60 sm:px-3"
                  aria-label={`Abrir menú de perfil de ${nombreCompleto}`}
                  aria-expanded={profileMenuOpen}
                  title={nombreCompleto}
                >
                  <User size={16} />
                  <span className="hidden min-w-0 flex-col text-left sm:flex">
                    <span className="text-[0.62rem] leading-tight text-muted-foreground">
                      {rolLabel}
                    </span>
                    <span className="max-w-40 truncate text-sm leading-tight text-foreground">
                      {nombreCompleto}
                    </span>
                  </span>
                  <ChevronDown
                    size={14}
                    className={`shrink-0 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate("/app/perfil");
                      }}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
                    >
                      <User size={15} className="mr-2 text-muted-foreground" />{" "}
                      Mi perfil
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate("/app/ajustes");
                      }}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
                    >
                      <Settings
                        size={15}
                        className="mr-2 text-muted-foreground"
                      />{" "}
                      Ajustes
                    </button>
                    <div className="my-1 border-t border-border px-3 py-2">
                      <p className="mb-2 text-xs text-muted-foreground">
                        Apariencia
                      </p>
                      <div className="flex gap-1 rounded-lg bg-secondary p-1">
                        {(["light", "dark"] as const).map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setTheme(option)}
                            className="flex-1 rounded-md px-2 py-1.5 text-xs transition-colors"
                            style={{
                              background:
                                theme === option
                                  ? "var(--card)"
                                  : "transparent",
                              color:
                                theme === option
                                  ? "var(--foreground)"
                                  : "var(--muted-foreground)",
                            }}
                          >
                            {option === "light" ? "Claro" : "Oscuro"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut size={15} className="mr-2" /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
              {/* Campana de Notificaciones */}
              <NotificacionesBell />
            </div>
          </header>

          {/* ── NAVEGACIÓN SECUNDARIA */}

          {/* NAVEGACIÓN SECUNDARIA */}
          {rol !== "estudiante" ? (
            <nav
              className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-card px-4 sm:px-5"
              aria-label="Navegación principal"
            >
              {NAV_ITEMS.filter(
                (item) => item.roles.includes(rol) && item.showInNav !== false,
              ).map((item) => {
                const Icon = item.icon;
                const activo = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    aria-current={activo ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      activo
                        ? "border-brand-blue text-brand-blue-text"
                        : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon size={15} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          ) : activeTab === "mensajes" ? (
            <nav
              className="flex shrink-0 gap-1 overflow-x-auto border-t-2 border-b border-border bg-card px-4 sm:px-5"
              aria-label="Accesos rápidos"
            >
              {[
                { id: "inicio", label: "Inicio", icon: LayoutDashboard },
                {
                  id: "solicitud",
                  label: "Solicitar tutoría",
                  icon: GraduationCap,
                },
                { id: "historial", label: "Mis tutorías", icon: History },
                { id: "mensajes", label: "Mensajes", icon: MessageCircle },
                {
                  id: "eventos",
                  label: "Próximos eventos",
                  icon: CalendarClock,
                },
              ].map(({ id, label, icon: Icon }) => {
                const activo = activeTab === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleNavigate(id)}
                    aria-current={activo ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      activo
                        ? "border-brand-blue text-brand-blue-text"
                        : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                );
              })}
            </nav>
          ) : null}

          {/* ── CONTENIDO PRINCIPAL (RUTAS) ── */}
          <main className="min-h-0 flex-1 overflow-y-auto px-5 py-7">
            {/* VISTAS DE ESTUDIANTE */}
            {activeTab === "inicio" && (
              <Inicio onNavigate={handleNavigate} nombre={nombreCompleto} />
            )}
            {activeTab === "ajustes" && (
              <Ajustes
                theme={theme}
                onThemeChange={setTheme}
                onChangePassword={() => navigate("/recuperar")}
              />
            )}
            {activeTab === "historial" && (
              <HistorialTutorias
                idEstudiante={idUsuario}
                onNavigate={handleNavigate}
              />
            )}
            {activeTab === "eventos" && (
              <ProximosEventos
                idEstudiante={idUsuario}
                onVerHistorial={() => handleNavigate("historial")}
                onSolicitar={() => handleNavigate("solicitud")}
                onNavigate={handleNavigate}
              />
            )}

            {/* VISTA DE SOLICITUD DE TUTORÍA (CON ESTADO DE ÉXITO) */}
            {activeTab === "solicitud" && !solicitudOk && (
              <SolicitudTutoria
                idEstudiante={idUsuario}
                onSuccess={() => setSolicitudOk(true)}
                onCancel={() => handleNavigate("historial")}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === "solicitud" && solicitudOk && (
              <div className="w-full max-w-lg mx-auto">
                <div className="bg-card rounded-2xl border border-border p-10 text-center space-y-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ background: "rgba(16,185,129,0.12)" }}
                  >
                    <CheckCircle2
                      size={32}
                      style={{ color: "var(--brand-teal)" }}
                    />
                  </div>
                  <div>
                    <h2 className="text-foreground mb-2">
                      ¡Solicitud enviada!
                    </h2>
                    <p
                      className="text-muted-foreground"
                      style={{ fontSize: "0.875rem" }}
                    >
                      Tu tutoría fue registrada como{" "}
                      <strong style={{ color: "#F59E0B" }}>PENDIENTE</strong>.
                      Recibirás una notificación cuando el tutor la confirme.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary p-4 text-left space-y-1">
                    <p
                      className="text-muted-foreground"
                      style={{
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Código de seguimiento
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "1rem",
                        color: "var(--foreground)",
                      }}
                    >
                      TUT-2026-{Math.floor(1000 + Math.random() * 9000)}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleNavigate("historial")}
                      className="flex-1 rounded-xl border border-border py-2.5 text-foreground hover:bg-secondary transition-all"
                      style={{ fontSize: "0.875rem" }}
                    >
                      Ver historial
                    </button>
                    <button
                      onClick={() => setSolicitudOk(false)}
                      className="sigtau-primary-button flex-1 rounded-xl py-2.5 text-white hover:opacity-90 transition-all"
                      style={{ fontSize: "0.875rem" }}
                    >
                      Nueva solicitud
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VISTAS DE TUTOR */}
            {activeTab === "solicitudes" && (
              <SolicitudesPendientes idTutor={idUsuario} />
            )}
            {activeTab === "seguimiento" && (
              <SeguimientoAcademico idTutor={idUsuario} />
            )}
            {activeTab === "horarios" && (
              <GestionHorarios idTutor={idUsuario} />
            )}
            {activeTab === "calendario-tutor" && (
              <CalendarioTutor idTutor={idUsuario} />
            )}
            {activeTab === "historial-sesiones" && (
              <HistorialSesiones idTutor={idUsuario} />
            )}

            {/* VISTAS DE COORDINADOR */}
            {activeTab === "dashboard-coord" && <DashboardCoord />}
            {activeTab === "usuarios" && <GestionUsuarios />}
            {activeTab === "reportes" && <DashboardReportes />}
            {activeTab === "asignaturas" && <Asignaturas />}
            {activeTab === "supervision" && <Supervision />}
            {activeTab === "notificaciones" && <Notificaciones />}

            {activeTab === "mensajes" && <Mensajes idUsuario={idUsuario} />}

            {/* VISTAS COMUNES (TODOS LOS ROLES) */}
            {activeTab === "perfil" && (
              <MiPerfil rol={rol} nombre={nombre} email={email} />
            )}
          </main>

          {/* ── PIE DE PÁGINA ── */}
          <footer className="flex flex-col items-center justify-center gap-1 border-t border-border bg-background px-5 py-4 text-center text-xs text-muted-foreground transition-colors duration-300 sm:flex-row sm:items-center sm:justify-center">
            <span>
              <strong className="text-foreground">SIGTAU</strong>
              <br></br>Sistema Integral de Gestión de Tutorías Académicas
              <br></br>
              Sistema desarrollado con fines educativos.
              <br></br>© {new Date().getFullYear()}
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}
