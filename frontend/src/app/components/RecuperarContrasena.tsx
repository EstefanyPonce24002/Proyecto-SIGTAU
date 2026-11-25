import { useState } from "react";
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { solicitarRecuperacion } from "../lib/auth";

interface Props {
  onBack: () => void;
}

export function RecuperarContrasena({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Ingresa un correo electrónico válido");
      return;
    }

    setLoading(true);
    try {
      await solicitarRecuperacion(email.trim());
      setSent(true);
    } catch {
      // El backend responde de forma genérica por seguridad.
      setError("No se pudo procesar la solicitud. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8 sm:px-6"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-[-8px]"
          style={{
            backgroundImage: "url('Colaboracion_uni.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "blur(5px)",
          }}
        />
        <div className="absolute inset-0" style={{ background: "rgba(17,24,39,0.55)" }} />
      </div>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl"
        style={{
          background: "rgba(31,41,55,0.72)",
          borderColor: "rgba(249,250,251,0.2)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <div className="space-y-6 p-6 sm:p-8">

          {!sent ? (
            <>
              {/* Icon and heading */}
              <div className="text-center">
                <div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: "rgba(74, 102, 109, 0.29)" }}
                >
                  <Mail size={27} style={{ color: "#49666d" }} />
                </div>
                <h2 style={{ color: "#F9FAFB", letterSpacing: "-0.01em" }}>Recuperar Contraseña</h2>
                <p className="mx-auto mt-1.5 max-w-[280px]" style={{ fontSize: "0.88rem", color: "#D1D5DB", lineHeight: 1.45 }}>
                  Ingresa tu correo institucional para recibir un enlace de recuperación.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.48">
                  <label className="block pl-1" style={{ fontSize: "0.875rem", color: "#F9FAFB" }}>
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="usuario@universidad.edu.sv"
                      className="w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 transition-all placeholder:text-muted-foreground"
                      style={{
                        fontSize: "0.85rem",
                        borderColor: error ? "rgba(248,113,113,0.65)" : "#374151",
                        background: "#263746",
                        color: "#F9FAFB",
                        "--tw-ring-color": "#38BFE3",
                      } as React.CSSProperties}
                    />
                  </div>
                  {error && (
                    <p style={{ fontSize: "0.78rem", color: "#F87171" }}>{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
                  style={{ background: "#0E7799", fontSize: "0.9rem" }}
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                </button>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="text-center space-y-5 py-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: "rgba(16,185,129,0.1)" }}
              >
                <CheckCircle2 size={30} style={{ color: "var(--brand-blue-text)" }} />
              </div>
              <div>
                <h3 style={{ color: "#F9FAFB", fontSize: "1.1rem" }}>¡Enlace enviado!</h3>
                <p className="mt-2" style={{ fontSize: "0.875rem", color: "#D1D5DB", lineHeight: 1.6 }}>
                  Hemos enviado un enlace de recuperación a <br />
                  <strong style={{ color: "#38BFE3" }}>{email}</strong>
                </p>
                <p className="mt-3" style={{ fontSize: "0.78rem", color: "#9CA3AF" }}>
                  Revisa también tu carpeta de spam. El enlace expira en 30 minutos.
                </p>
              </div>
            </div>
          )}

          {/* Back link */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 transition-colors w-full justify-center"
            style={{ fontSize: "0.875rem", color: "#D6DEE5" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#38BFE3")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#D6DEE5")}
          >
            <ArrowLeft size={14} />
            Volver al inicio de sesión
          </button>
        </div>
      </div>

    </div>
  );
}
