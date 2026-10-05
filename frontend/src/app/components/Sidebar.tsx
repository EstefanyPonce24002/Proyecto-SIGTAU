import { GraduationCap, LogOut, X } from "lucide-react";

type Rol = "estudiante" | "tutor" | "coordinador";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: Rol[];
}

interface Props {
  items: NavItem[];
  active: string;
  rol: Rol;
  nombre: string;
  onNavigate: (id: string) => void;
  onLogout: () => void;
  open: boolean;
  onClose: () => void;
}

/* ── Bronze / charcoal design tokens ─────────────────────────────────── */
const SIDEBAR_BG      = "#141C2E";          // deep navy-charcoal
const SIDEBAR_SURFACE = "#1C2742";          // slightly lighter panel
const SIDEBAR_BORDER  = "rgba(255,255,255,0.07)";
const BRONZE          = "var(--brand-bronze)";
const BRONZE_SOFT     = "rgba(245,158,11,0.14)";
const MUTED_TEXT      = "rgba(255,255,255,0.42)";
const BODY_TEXT       = "rgba(255,255,255,0.80)";

const ROL_LABELS: Record<Rol, string> = {
  estudiante:  "Estudiante",
  tutor:       "Tutor",
  coordinador: "Coordinador Académico",
};

export function Sidebar({ items, active, rol, nombre, onNavigate, onLogout, open, onClose }: Props) {
  const initials = nombre
    .replace("Prof. ", "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const visibleItems = items.filter((i) => i.roles.includes(rol));

  const inner = (
    <div
      className="flex flex-col h-full"
      style={{ background: SIDEBAR_BG }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 shrink-0"
        style={{ height: "56px", borderBottom: `1px solid ${SIDEBAR_BORDER}` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, var(--brand-bronze), var(--brand-bronze-deep))" }}
          >
            <GraduationCap size={15} className="text-white" />
          </div>
          <div className="leading-tight">
            <p style={{ fontSize: "0.88rem", color: "#fff", letterSpacing: "-0.01em", lineHeight: 1 }}>
              SIGTAU
            </p>
            <p style={{ fontSize: "0.58rem", color: MUTED_TEXT, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {ROL_LABELS[rol]}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center transition-all"
          style={{ color: MUTED_TEXT, background: "rgba(255,255,255,0.05)" }}
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Section label ─────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-2">
        <p style={{ fontSize: "0.65rem", color: MUTED_TEXT, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Menú principal
        </p>
      </div>

      {/* ── Nav items ─────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        {visibleItems.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all relative group"
              style={{
                background: isActive ? BRONZE_SOFT : "transparent",
                color: isActive ? BRONZE : BODY_TEXT,
                border: isActive ? `1px solid rgba(245,158,11,0.22)` : "1px solid transparent",
              }}
            >
              {/* Active left bar */}
              {isActive && (
                <div
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                  style={{ background: BRONZE }}
                />
              )}

              <item.icon
                size={15}
                style={{
                  color: isActive ? BRONZE : MUTED_TEXT,
                  transition: "color 0.15s",
                }}
              />
              <span style={{ fontSize: "0.855rem", fontWeight: isActive ? 500 : 400 }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── Divider ───────────────────────────────────────────────────── */}
      <div style={{ height: "1px", background: SIDEBAR_BORDER, margin: "0 12px" }} />

      {/* ── User card ─────────────────────────────────────────────────── */}
      <div className="px-3 py-4 space-y-1 shrink-0">
        <div
          className="flex items-center gap-3 px-3 py-3 rounded-xl"
          style={{ background: SIDEBAR_SURFACE, border: `1px solid ${SIDEBAR_BORDER}` }}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--brand-bronze), var(--brand-bronze-deep))",
              fontSize: "0.65rem",
              color: "#fff",
            }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="truncate"
              style={{ fontSize: "0.78rem", color: "#fff", lineHeight: 1.2 }}
            >
              {nombre.replace("Prof. ", "").split(" ").slice(0, 2).join(" ")}
            </p>
            <p style={{ fontSize: "0.65rem", color: MUTED_TEXT, marginTop: "1px" }}>
              {ROL_LABELS[rol]}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
          style={{ color: MUTED_TEXT }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#FF7B7B";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,59,59,0.07)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = MUTED_TEXT;
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          <LogOut size={14} />
          <span style={{ fontSize: "0.82rem" }}>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 h-screen sticky top-0">
        {inner}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={onClose}
          />
          <aside className="relative w-56 h-full flex flex-col z-10">
            {inner}
          </aside>
        </div>
      )}
    </>
  );
}
