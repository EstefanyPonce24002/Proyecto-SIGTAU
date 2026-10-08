import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { restablecerContrasena } from "../lib/auth";
import { ApiError } from "../lib/api";

interface Props { onBack: () => void; }

export function RestablecerContrasena({ onBack }: Props) {
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") ?? "", []);
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!token) return setError("El enlace de recuperación no contiene un token válido.");
    if (nueva.length < 8) return setError("La nueva contraseña debe tener al menos 8 caracteres.");
    if (nueva !== confirmacion) return setError("Las contraseñas no coinciden.");

    setLoading(true);
    try {
      await restablecerContrasena(token, nueva);
      setGuardado(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-[#1E3A8A] px-4 py-8">
      <div className="w-full max-w-[420px] rounded-2xl border border-white/60 bg-white/90 p-6 shadow-2xl sm:p-8">
        {guardado ? (
          <div className="space-y-5 py-5 text-center">
            <CheckCircle2 size={48} className="mx-auto text-[#10B981]" />
            <div>
              <h2 className="text-[#1E3A8A]">Contraseña actualizada</h2>
              <p className="mt-2 text-sm text-gray-600">Ya puedes iniciar sesión con tu nueva contraseña.</p>
            </div>
            <button onClick={onBack} className="w-full rounded-xl bg-[#10B981] py-3 text-white">
              Ir a iniciar sesión
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-[#1E3A8A]">Restablecer contraseña</h2>
              <p className="mt-2 text-sm text-gray-600">Crea una nueva contraseña para tu cuenta SIGTAU.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

              <div>
                <label className="mb-1.5 block text-sm text-[#1E3A8A]">Nueva contraseña</label>
                <div className="relative">
                  <input type={mostrar ? "text" : "password"} value={nueva} onChange={(e) => setNueva(e.target.value)}
                    className="w-full rounded-xl border px-4 py-2.5 pr-11" minLength={8} required />
                  <button type="button" onClick={() => setMostrar(!mostrar)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-[#1E3A8A]">Confirmar contraseña</label>
                <div className="relative">
                  <input type={mostrarConfirmacion ? "text" : "password"} value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)}
                    className="w-full rounded-xl border px-4 py-2.5 pr-11" minLength={8} required />
                  <button type="button" onClick={() => setMostrarConfirmacion(!mostrarConfirmacion)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {mostrarConfirmacion ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10B981] py-3 text-white disabled:opacity-70">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </form>

            <button onClick={onBack} className="mt-5 flex w-full items-center justify-center gap-2 text-sm text-gray-600">
              <ArrowLeft size={14} /> Volver al inicio de sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
}
