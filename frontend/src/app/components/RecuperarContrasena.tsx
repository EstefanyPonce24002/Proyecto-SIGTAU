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
      style={{ background: "#1E3A8A" }}
    >
      <div className="absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1562774053-701939374585?w=1800&h=1200&fit=crop&auto=format')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0" style={{ background: "rgba(30,58,138,0.62)" }} />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/60 bg-white/72 shadow-2xl backdrop-blur-xl">
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
                <h2 style={{ color: "#151618", letterSpacing: "-0.01em" }}>Recuperar Contraseña</h2>
                <p className="mx-auto mt-1.5 max-w-[280px]" style={{ fontSize: "0.88rem", color: "#6B7280", lineHeight: 1.45 }}>
                  Ingresa tu correo institucional para recibir un enlace de recuperación.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.48">
                  <label className="block pl-1" style={{ fontSize: "0.875rem", color: "#151618" }}>
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
                        borderColor: error ? "rgba(239,68,68,0.5)" : "var(--border)",
                        background: "rgba(248,250,253,0.82)",
                        color: "#1E3A8A",
                        "--tw-ring-color": "#118AB2",
                      } as React.CSSProperties}
                    />
                  </div>
                  {error && (
                    <p style={{ fontSize: "0.78rem", color: "#EF4444" }}>{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
                  style={{ background: "#118AB2", fontSize: "0.9rem" }}
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
                <CheckCircle2 size={30} style={{ color: "#118AB2" }} />
              </div>
              <div>
                <h3 style={{ color: "#1E3A8A", fontSize: "1.1rem" }}>¡Enlace enviado!</h3>
                <p className="mt-2" style={{ fontSize: "0.875rem", color: "#6B7280", lineHeight: 1.6 }}>
                  Hemos enviado un enlace de recuperación a <br />
                  <strong style={{ color: "#1E3A8A" }}>{email}</strong>
                </p>
                <p className="mt-3" style={{ fontSize: "0.78rem", color: "#6B7280" }}>
                  Revisa también tu carpeta de spam. El enlace expira en 30 minutos.
                </p>
              </div>
            </div>
          )}

          {/* Back link */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 transition-colors w-full justify-center"
            style={{ fontSize: "0.875rem", color: "#6B7280" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#118AB2")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7280")}
          >
            <ArrowLeft size={14} />
            Volver al inicio de sesión
          </button>
        </div>
      </div>

    </div>
  );
}
