import { useState } from "react";
import { Eye, EyeOff, GraduationCap, Moon, Sun, AlertCircle, Loader2, UserRound } from "lucide-react";
import { login as loginApi } from "../lib/auth";
import { ApiError } from "../lib/api";

type Rol = "estudiante" | "tutor" | "coordinador";

interface Props {
  dark: boolean;
  onToggleDark: () => void;
  onLogin: (rol: Rol, nombre: string, idUsuario: number) => void;
  onForgot?: () => void;
}

export function LoginScreen({ dark, onToggleDark, onLogin, onForgot }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError("Debe ingresar su correo electrónico y contraseña para continuar.");
      return;
    }

    setLoading(true);

    try {
      const data = await loginApi(normalizedEmail, password);
      const rol = data.rol.toLowerCase() as Rol; // backend: "ESTUDIANTE" -> frontend: "estudiante"
      onLogin(rol, data.nombreCompleto, data.idUsuario);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "No se pudo conectar con el servidor";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onForgot) {
      onForgot();
    } else {
      setForgotSent(true);
      setTimeout(() => setForgotSent(false), 4000);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background transition-colors duration-300">
      {/* Full-screen campus backdrop */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1562774053-701939374585?w=1800&h=1200&fit=crop&auto=format')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: dark ? "rgba(17,24,39,0.78)" : "rgba(30,58,138,0.58)",
          }}
        />
      </div>

      {/* Left panel — campus image */}
      <div
        className="relative z-20 hidden min-h-screen flex-col justify-between overflow-hidden p-10 lg:flex lg:w-[52%]"
      >
        {/* Logo top */}
        <div className="relative flex flex-col items-start">
          <span className="text-white" style={{ fontSize: "2.00rem", fontWeight: 700, lineHeight: 1, letterSpacing: "0.01em" }}>
            SIG<span style={{ color: "var(--brand-teal)" }}>TAU</span>
          </span>
          <span
            className="mt-1 max-w-[190px] text-left text-white"
            style={{ fontSize: "0.88rem", fontWeight: 600, lineHeight: 1.25, opacity: 0.86 }}
          >
            Sistema Integral de Gestión
            <br />
            de Tutorías Académicas
          </span>
        </div>

        {/* Bottom caption */}
        <p className="relative" style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>
          
        </p>
      </div>

      {/* Right panel — login card */}
      <div
        className="absolute inset-0 z-10 flex min-h-[100dvh] w-full flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10"
      >
        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          aria-label="Cambiar modo"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1E3A8A, #3B82F6)" }}>
            <GraduationCap size={15} className="text-white" />
          </div>
          <span className="text-foreground" style={{ fontSize: "0.95rem" }}>SIGTAU</span>
        </div>

        {/* Card */}
        <div
          className="mx-auto max-h-[calc(100dvh-7rem)] w-full max-w-[400px] overflow-y-auto rounded-2xl border p-6 space-y-6 backdrop-blur-xl shadow-xl sm:p-8"
          style={{
            background: dark ? "rgba(31,41,55,0.72)" : "rgba(255,255,255,0.68)",
            borderColor: dark ? "rgba(249,250,251,0.2)" : "rgba(255,255,255,0.78)",
            boxShadow: dark
              ? "0 24px 60px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)"
              : "0 24px 60px rgba(30,58,138,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          {/* Heading */}
          <div className="text-center">
            <h2 className="text-card-foreground" style={{ letterSpacing: "-0.01em" }}>Iniciar Sesión</h2>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.90rem" }}>
              Accede con tus credenciales institucionales
            </p>
          </div>

          {/* Avatar de acceso */}
          <div className="flex justify-center" aria-hidden="true">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#49666d] shadow-lg ring-4 ring-white/35">
              <UserRound size={43} strokeWidth={1.8} className="text-white" />
            </div>
          </div>

          {/* Error banner */}
          <div
            className="transition-all duration-200 overflow-hidden"
            style={{ maxHeight: error ? "80px" : "0px", opacity: error ? 1 : 0 }}
          >
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle size={15} className="text-destructive shrink-0" />
              <p className="text-destructive" style={{ fontSize: "0.85rem" }}>
                {error ?? "Correo o contraseña incorrectas"}
              </p>
            </div>
          </div>

          {/* Recovery success */}
          <div
            className="transition-all duration-200 overflow-hidden"
            style={{ maxHeight: forgotSent ? "80px" : "0px", opacity: forgotSent ? 1 : 0 }}
          >
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}
              role="status"
            >
              <span style={{ fontSize: "0.85rem", color: "#10B981" }}>
                Enlace de recuperación enviado a tu correo institucional.
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-card-foreground" style={{ fontSize: "0.875rem" }}>
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="usuario@universidad.edu.sv"

                className="w-full rounded-xl border bg-input-background text-card-foreground px-4 py-2.5 outline-none focus:ring-2 transition-all placeholder:text-muted-foreground"
                style={{
                  borderColor: error ? "rgba(239,68,68,0.5)" : "var(--border)",
                  "--tw-ring-color": "#10B981",
                  fontSize: "0.9rem",
                } as React.CSSProperties}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-card-foreground" style={{ fontSize: "0.875rem" }}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••"
                  className="w-full rounded-xl border bg-input-background text-card-foreground px-4 py-2.5 pr-11 outline-none focus:ring-2 transition-all placeholder:text-muted-foreground"
                  style={{
                    borderColor: error ? "rgba(239,68,68,0.5)" : "var(--border)",
                    "--tw-ring-color": "#10B981",
                    fontSize: "0.9rem",
                  } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <a
                href="#"
                onClick={handleForgot}
                className="transition-colors"
                style={{ fontSize: "0.82rem", color: "#383939" }}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="sigtau-accent-button sigtau-focus-ring w-full flex items-center justify-center gap-2 rounded-xl py-3 text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ fontSize: "0.95rem" }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Verificando..." : "Ingresar"}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
