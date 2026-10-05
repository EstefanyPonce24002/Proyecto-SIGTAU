import { LockKeyhole, Moon, Palette, Sun } from "lucide-react";

type Theme = "light" | "dark";

interface Props {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onChangePassword: () => void;
}

export function Ajustes({ theme, onThemeChange, onChangePassword }: Props) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div>
        <h1 className="text-foreground">Ajustes</h1>
        <p
          className="mt-1 text-muted-foreground"
          style={{ fontSize: "0.875rem" }}
        >
          Personaliza tu experiencia en SIGTAU.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Palette size={18} className="mt-0.5 text-brand-teal" />
          <div className="min-w-0 flex-1">
            <h2 className="text-foreground" style={{ fontSize: "1rem" }}>
              Apariencia
            </h2>
            <p
              className="mt-1 text-muted-foreground"
              style={{ fontSize: "0.82rem" }}
            >
              Elige cómo quieres ver la aplicación.
            </p>
            <div className="mt-4 inline-flex rounded-xl border border-border bg-secondary p-1">
              <button
                type="button"
                onClick={() => onThemeChange("light")}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
                style={{
                  background: theme === "light" ? "var(--card)" : "transparent",
                  color:
                    theme === "light"
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                  boxShadow:
                    theme === "light" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                }}
              >
                <Sun size={15} />
                Claro
              </button>
              <button
                type="button"
                onClick={() => onThemeChange("dark")}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
                style={{
                  background: theme === "dark" ? "var(--card)" : "transparent",
                  color:
                    theme === "dark"
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                  boxShadow:
                    theme === "dark" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                }}
              >
                <Moon size={15} />
                Oscuro
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <LockKeyhole size={18} className="mt-0.5 text-brand-teal" />
            <div>
              <h2 className="text-foreground" style={{ fontSize: "1rem" }}>
                Contraseña
              </h2>
              <p
                className="mt-1 text-muted-foreground"
                style={{ fontSize: "0.82rem" }}
              >
                Actualiza tus credenciales de acceso.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onChangePassword}
            className="shrink-0 rounded-xl border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
          >
            Cambiar contraseña
          </button>
        </div>
      </section>
    </div>
  );
}
