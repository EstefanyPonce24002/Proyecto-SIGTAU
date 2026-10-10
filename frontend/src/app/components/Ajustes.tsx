import { LockKeyhole, Moon, Palette, Sun, Settings2, Sparkles } from "lucide-react";

type Theme = "light" | "dark";

interface Props {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onChangePassword: () => void;
}

export function Ajustes({ theme, onThemeChange, onChangePassword }: Props) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"><Settings2 size={14} className="text-brand-teal" /> Personalización</div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Ajustes</h1>
        <p
          className="mt-1 text-muted-foreground"
          style={{ fontSize: "0.875rem" }}
        >
          Personaliza tu experiencia en SIGTAU.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10"><Palette size={18} className="text-brand-teal" /></span>
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
            <div className="mt-4 inline-flex max-w-full rounded-xl border border-border bg-secondary p-1">
              <button
                type="button"
                onClick={() => onThemeChange("light")}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10"><LockKeyhole size={18} className="text-brand-teal" /></span>
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
            className="inline-flex w-fit shrink-0 items-center justify-center rounded-xl border border-border px-3.5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cambiar contraseña
          </button>
        </div>
      </section>
    </div>
  );
}
