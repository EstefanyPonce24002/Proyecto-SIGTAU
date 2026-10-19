// Importación de hooks de React
// useState: maneja estado local del componente
// useEffect: ejecuta efectos secundarios (carga inicial de datos)
// useCallback: memoriza funciones para evitar recrearlas en cada render
import { useState, useEffect, useCallback } from "react";

// Importación de iconos SVG desde la librería lucide-react
import {
  CheckCircle2, // Icono de check dentro de círculo (éxito/asistencia)
  Circle, // Icono de círculo vacío (inasistencia)
  User, // Icono de usuario
  BookOpen, // Icono de libro (observaciones académicas)
  TrendingUp, // Icono de tendencia (calificación)
  Clock, // Icono de reloj (fecha del día / fecha de sesión)
  Info, // Icono de información (aviso)
  X, // Botón para cerrar el aviso informativo
  Loader2, // Icono de spinner de carga
  AlertCircle, // Icono de error
} from "lucide-react";

// Importación de funciones de la API de sesiones
// historialTutor: obtiene el historial completo del tutor
// registrarSeguimiento: guarda la asistencia, observaciones y calificación
// Sesion: tipo TypeScript que describe la forma de una solicitud
import {
  historialTutor,
  registrarSeguimiento,
  type Sesion,
} from "../lib/sesiones";

// Clase de error personalizada para distinguir errores de API
import { ApiError } from "../lib/api";

// Props que recibe el componente
interface Props {
  idTutor: number; // ID del tutor para consultar sus sesiones
}

// Función que extrae las iniciales de un nombre completo
// Ejemplo: "Carlos Pineda" → "CP"
function iniciales(nombreCompleto: string): string {
  return nombreCompleto
    .split(" ") // Divide el nombre por espacios
    .filter(Boolean) // Elimina elementos vacíos
    .slice(0, 2) // Toma solo las 2 primeras palabras
    .map((w) => w[0]) // Extrae la primera letra de cada una
    .join("") // Une las letras
    .toUpperCase(); // Convierte a mayúsculas
}

// Función que formatea una fecha ISO a formato DD/MM/YYYY
// Ejemplo: "2026-03-15" → "15/03/2026"
function formatFecha(fechaISO: string): string {
  const [y, m, d] = fechaISO.split("-"); // Separa año, mes, día
  return `${d}/${m}/${y}`; // Retorna día/mes/año
}

// Función que recorta una hora a formato HH:MM
// Ejemplo: "14:30:00" → "14:30"
function formatHora(horaISO: string): string {
  return horaISO.slice(0, 5); // Toma solo los primeros 5 caracteres
}

// Componente principal de Seguimiento Académico
export function SeguimientoAcademico({ idTutor }: Props) {
  // Lista completa de sesiones del tutor
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  // Indicador de carga inicial
  const [cargando, setCargando] = useState(true);
  // Mensaje de error al cargar
  const [loadError, setLoadError] = useState<string | null>(null);
  // ID de la sesión seleccionada en el panel izquierdo
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Controla la visibilidad del aviso con las reglas de seguimiento
  const [showRulesNotice, setShowRulesNotice] = useState(false);
  // Estado booleano de asistencia (true = asistió)
  const [asistio, setAsistio] = useState(true);
  // Texto de observaciones académicas
  const [observaciones, setObservaciones] = useState("");
  // Valor numérico de la calificación (para sliders y barras)
  const [calificacion, setCalificacion] = useState(7.0);
  // Valor del input como string (permite escribir decimales)
  const [calInput, setCalInput] = useState("7.0");
  // Indicador de guardado en proceso
  const [saving, setSaving] = useState(false);
  // Mensaje de error al guardar
  const [saveError, setSaveError] = useState<string | null>(null);

  // Función memorizada para cargar el historial del tutor
  const cargar = useCallback(() => {
    setCargando(true); // Activa spinner
    setLoadError(null); // Limpia error previo

    historialTutor(idTutor) // Llama a la API
      .then((data) => {
        setSesiones(data); // Guarda las sesiones en estado

        // Filtra solo las sesiones APROBADAS (elegibles para seguimiento)
        const elegibles = data.filter((s) => s.estado === "APROBADA");

        // Selecciona automáticamente la primera elegible si no hay ninguna seleccionada
        setSelectedId((prev) => prev ?? elegibles[0]?.id ?? null);
      })
      .catch((err) =>
        // Maneja el error mostrando mensaje adecuado
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el listado.",
        ),
      )
      .finally(() => setCargando(false)); // Desactiva spinner
  }, [idTutor]); // Se recrea solo si cambia idTutor

  // Carga el historial al montar el componente (o si cambia idTutor)
  useEffect(() => {
    cargar();
  }, [cargar]);

  // Lista filtrada de sesiones elegibles (solo APROBADAS)
  const elegibles = sesiones.filter((s) => s.estado === "APROBADA");

  // Sesión actualmente seleccionada para el formulario
  const sesion = elegibles.find((s) => s.id === selectedId);

  // Porcentaje de la calificación para la barra de progreso (0–100%)
  const progressPct = (calificacion / 10) * 100;

  // Maneja el cambio en el input de calificación
  const handleCalificacionChange = (val: string) => {
    setCalInput(val); // Actualiza el string del input
    const num = parseFloat(val); // Convierte a número
    // Solo actualiza el valor numérico si es válido (0–10)
    if (!isNaN(num) && num >= 0 && num <= 10) setCalificacion(num);
  };

  // Maneja el envío del formulario de seguimiento
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita recarga de página
    if (!sesion) return; // Salida si no hay sesión seleccionada

    setSaving(true); // Activa estado de guardado
    setSaveError(null); // Limpia error previo

    try {
      // Llama a la API para registrar el seguimiento
      await registrarSeguimiento(
        sesion.id,
        asistio,
        observaciones,
        calificacion,
      );

      // Limpia el formulario tras guardar
      setObservaciones("");
      setCalificacion(7.0);
      setCalInput("7.0");
      setAsistio(true);

      cargar(); // Recarga el historial (la sesión pasa a COMPLETADA)
      setSelectedId(null); // Deselecciona la sesión actual
    } catch (err) {
      // Muestra error de la acción
      setSaveError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar el seguimiento.",
      );
    } finally {
      setSaving(false); // Desactiva estado de guardado
    }
  };

  // Cancela la edición sin guardar y limpia los datos del formulario
  const handleCancel = () => {
    if (saving) return;
    setObservaciones("");
    setCalificacion(7.0);
    setCalInput("7.0");
    setAsistio(true);
    setSaveError(null);
    setSelectedId(null);
  };

  // Render condicional: spinner mientras carga
  if (cargando) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Render condicional: mensaje de error de carga
  if (loadError) {
    return (
      <div className="w-full rounded-2xl border border-border bg-card p-8 text-center">
        <AlertCircle size={24} className="mx-auto mb-2 text-destructive" />
        <p className="text-destructive" style={{ fontSize: "0.9rem" }}>
          {loadError}
        </p>
      </div>
    );
  }

  // Render principal
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Cabecera con título y fecha actual */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Documenta la asistencia y el progreso académico de cada estudiante
            </h2>
          </div>
        </div>
        {/* Badge con la fecha actual */}
        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
          <Clock size={14} className="text-muted-foreground" />
          <span
            className="text-muted-foreground"
            style={{ fontSize: "0.82rem" }}
          >
            {new Date().toLocaleDateString("es-SV")}
          </span>
        </div>
      </div>

      {/* Condicional: sin sesiones elegibles o grid con lista + formulario */}
      {elegibles.length === 0 ? (
        // Estado vacío: todas las sesiones ya completadas
        <div className="rounded-2xl border border-border bg-card px-5 py-16 text-center shadow-sm">
          <CheckCircle2 size={32} className="mx-auto mb-3 text-brand-blue" />
          <p className="text-foreground" style={{ fontSize: "0.95rem" }}>
            Sin sesiones pendientes de cierre
          </p>
          <p
            className="text-muted-foreground mt-1"
            style={{ fontSize: "0.82rem" }}
          >
            Todas las sesiones aprobadas han sido completadas
          </p>
        </div>
      ) : (
        // Grid de 5 columnas: 2 para lista, 3 para formulario
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Columna izquierda: Lista de sesiones pendientes */}
          <div className="lg:col-span-2 space-y-2">
            {/* Etiqueta de la lista */}
            <p
              className="text-muted-foreground px-1"
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Sesiones pendientes de cierre
            </p>

            {/* Iteración sobre las sesiones elegibles */}
            {elegibles.map((s) => {
              const isSelected = s.id === selectedId; // ¿Está seleccionada?
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedId(s.id); // Cambia la sesión seleccionada
                    setShowRulesNotice(true); // Muestra las reglas al abrir una tarjeta
                  }}
                  className="w-full rounded-xl border p-4 text-left transition-all hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{
                    // Fondo del color de tarjeta si está seleccionada
                    background: isSelected ? "var(--card)" : "transparent",
                    // Borde azul si está seleccionada, gris si no
                    borderColor: isSelected
                      ? "var(--brand-blue)"
                      : "var(--border)",
                    // Anillo azul si está seleccionada
                    boxShadow: isSelected
                      ? "0 0 0 1px var(--brand-blue)"
                      : "none",
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar con iniciales */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
                      style={{
                        background: isSelected
                          ? "var(--brand-blue-dark)"
                          : "var(--muted)",
                        color: isSelected ? "#fff" : "var(--muted-foreground)",
                        fontSize: "0.7rem",
                      }}
                    >
                      {iniciales(s.estudianteNombre)}
                    </div>

                    {/* Información de la sesión */}
                    <div className="flex-1 min-w-0">
                      {/* Nombre del estudiante truncado */}
                      <p
                        className="text-foreground truncate"
                        style={{ fontSize: "0.875rem" }}
                      >
                        {s.estudianteNombre}
                      </p>
                      {/* Nombre de la asignatura truncado */}
                      <p
                        className="text-muted-foreground truncate"
                        style={{ fontSize: "0.78rem" }}
                      >
                        {s.asignaturaNombre}
                      </p>
                      {/* Badge de estado y fecha/hora */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className="rounded-full px-2 py-0.5"
                          style={{
                            fontSize: "0.68rem",
                            color: "#3B82F6", // Azul
                            background: "rgba(59,130,246,0.12)", // Azul translúcido
                          }}
                        >
                          Aprobada
                        </span>
                        <span
                          className="text-muted-foreground"
                          style={{ fontSize: "0.72rem" }}
                        >
                          {formatFecha(s.fechaSesion)} ·{" "}
                          {formatHora(s.horaInicio)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Columna derecha: Panel del formulario */}
          <div className="lg:col-span-3">
            {sesion && (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Cabecera del panel con datos del estudiante y toggle de asistencia */}
                <div
                  className="border-b border-border px-5 py-5 sm:px-6"
                  style={{
                    // Degradado sutil azul de fondo
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--brand-blue) 10%, transparent), color-mix(in srgb, var(--brand-blue) 2%, transparent))",
                  }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      {/* Avatar grande con iniciales */}
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--brand-blue-dark), var(--brand-blue))",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                        }}
                      >
                        {iniciales(sesion.estudianteNombre)}
                      </div>
                      <div className="min-w-0">
                        {/* Nombre del estudiante */}
                        <p className="truncate text-base font-semibold text-card-foreground">
                          {sesion.estudianteNombre}
                        </p>
                        {/* Asignatura */}
                        <p
                          className="truncate text-muted-foreground"
                          style={{ fontSize: "0.8rem" }}
                        >
                          {sesion.asignaturaNombre}
                        </p>
                        {/* Badges con fecha, hora e ID de la sesión */}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-muted-foreground"
                            style={{ fontSize: "0.72rem" }}
                          >
                            <Clock size={12} />{" "}
                            {formatFecha(sesion.fechaSesion)}
                          </span>
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-muted-foreground"
                            style={{ fontSize: "0.72rem" }}
                          >
                            <Clock size={12} /> {formatHora(sesion.horaInicio)}
                          </span>
                          <span
                            className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground"
                            style={{ fontSize: "0.72rem" }}
                          >
                            #{sesion.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formulario de seguimiento */}
                <form
                  onSubmit={handleSave}
                  className="space-y-5 px-5 py-5 sm:px-6"
                >
                  {/* Aviso de error al guardar */}
                  {saveError && (
                    <div
                      className="rounded-xl px-4 py-3"
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      <p
                        className="text-destructive"
                        style={{ fontSize: "0.85rem" }}
                      >
                        {saveError}
                      </p>
                    </div>
                  )}

                  {/* Grid de 2 columnas: calificación (izquierda) y observaciones (derecha) */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-[0.85fr_1.25fr]">
                    {/* Sección: Calificación */}
                    <section className="min-w-0 space-y-4">
                      <label
                        className="flex items-center gap-2 text-card-foreground"
                        style={{ fontSize: "0.9rem", fontWeight: 600 }}
                      >
                        Calificación de progreso{" "}
                        <span className="text-destructive">*</span>
                      </label>

                      {/* Tarjeta con input numérico grande y clasificación */}
                      <div className="rounded-2xl border border-border bg-input-background px-4 py-3">
                        <div className="flex items-end justify-between gap-3">
                          {/* Input numérico principal */}
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            required
                            value={calInput}
                            onChange={(e) =>
                              handleCalificacionChange(e.target.value)
                            }
                            aria-label="Calificación de progreso de 0 a 10"
                            className="w-32 min-w-0 border-0 bg-transparent p-0 font-semibold leading-none text-emerald-500 outline-none focus:ring-0"
                            style={{
                              fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                              fontFamily: "var(--font-mono)",
                            }}
                          />
                          {/* Etiqueta dinámica según el valor */}
                          <div className="pb-1 text-right">
                            <p
                              className="font-semibold"
                              style={{
                                fontSize: "0.8rem",
                                color:
                                  calificacion >= 9
                                    ? "#3B82F6" // Azul
                                    : calificacion >= 7
                                      ? "#10B981" // Verde
                                      : calificacion >= 5
                                        ? "#F59E0B" // Naranja
                                        : "#EF4444", // Rojo
                              }}
                            >
                              {calificacion >= 9
                                ? "Excelente"
                                : calificacion >= 7
                                  ? "Bueno"
                                  : calificacion >= 5
                                    ? "Regular"
                                    : "Bajo"}
                            </p>
                            <p
                              className="text-muted-foreground"
                              style={{
                                fontSize: "0.7rem",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              0.0 – 10.0
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Slider para ajustar la calificación */}
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={0.1}
                        value={calificacion}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setCalificacion(value);
                          setCalInput(value.toFixed(1));
                        }}
                        aria-label="Ajustar calificación de progreso"
                        className="h-2 w-full cursor-pointer"
                        style={{
                          accentColor:
                            calificacion >= 9
                              ? "#3B82F6"
                              : calificacion >= 7
                                ? "#10B981"
                                : calificacion >= 5
                                  ? "#F59E0B"
                                  : "#EF4444",
                        }}
                      />

                      {/* Asistencia debajo del slider */}
                      <div className="mt-5 space-y-2">
                        <p
                          className="flex flex-wrap items-center gap-1.5 text-card-foreground"
                          style={{ fontSize: "0.8rem", fontWeight: 600 }}
                        >
                          Asistencia <span className="text-destructive">*</span>
                        </p>

                        {/* Grupo de botones segmentados */}
                        <div className="grid grid-cols-2 rounded-xl border border-border bg-input-background p-1">
                          <button
                            type="button"
                            onClick={() => setAsistio(true)}
                            aria-pressed={asistio}
                            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition-colors"
                            style={{
                              background: asistio
                                ? "rgba(16,185,129,0.14)"
                                : "transparent",
                              color: asistio
                                ? "#10B981"
                                : "var(--muted-foreground)",
                              fontSize: "0.78rem",
                              fontWeight: asistio ? 600 : 400,
                            }}
                          >
                            <CheckCircle2 size={14} />
                            Asistió
                          </button>

                          <button
                            type="button"
                            onClick={() => setAsistio(false)}
                            aria-pressed={!asistio}
                            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition-colors"
                            style={{
                              background: !asistio
                                ? "rgba(239,68,68,0.12)"
                                : "transparent",
                              color: !asistio
                                ? "#EF4444"
                                : "var(--muted-foreground)",
                              fontSize: "0.78rem",
                              fontWeight: !asistio ? 600 : 400,
                            }}
                          >
                            <Circle size={14} />
                            No asistió
                          </button>
                        </div>
                      </div>
                    </section>

                    {/* Sección: Observaciones académicas */}
                    <section className="flex min-w-0 flex-col space-y-2">
                      <label
                        htmlFor="observaciones-seguimiento"
                        className="flex items-center gap-2 text-card-foreground"
                        style={{ fontSize: "0.9rem", fontWeight: 600 }}
                      >
                        Observaciones académicas
                      </label>
                      {/* Textarea con límite de 1000 caracteres */}
                      <textarea
                        id="observaciones-seguimiento"
                        value={observaciones}
                        onChange={(e) =>
                          setObservaciones(e.target.value.slice(0, 1000))
                        }
                        maxLength={1000}
                        rows={10}
                        placeholder="Describe el desempeño del estudiante, temas abordados, avances y áreas de mejora..."
                        className="min-h-[220px] w-full flex-1 resize-none rounded-xl border border-border-strong bg-input-background px-4 py-3 text-card-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
                      />
                      {/* Contador de caracteres */}
                      <p
                        className="text-right text-muted-foreground"
                        style={{ fontSize: "0.73rem" }}
                      >
                        {observaciones.length}/1000
                      </p>
                    </section>
                  </div>

                  {/* Acciones del formulario */}
                  <div className="flex flex-col-reverse items-stretch justify-end gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        fontSize: "0.95rem",
                        borderColor: "rgba(239,68,68,0.28)",
                        background: "rgba(239,68,68,0.08)",
                        color: "#EF4444",
                        minWidth: "106px",
                      }}
                      onMouseEnter={(e) => {
                        if (!saving) {
                          e.currentTarget.style.background = "rgba(239,68,68,0.16)";
                          e.currentTarget.style.borderColor = "rgba(239,68,68,0.45)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                        e.currentTarget.style.borderColor = "rgba(239,68,68,0.28)";
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      // Deshabilita si: guardando, input vacío, fuera de rango o no numérico
                      disabled={
                        saving ||
                        !calInput.trim() ||
                        Number(calInput) < 0 ||
                        Number(calInput) > 10 ||
                        !Number.isFinite(Number(calInput))
                      }
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl px-6 font-semibold text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      style={{
                        fontSize: "1rem",
                        background: "#118ab2",
                        minWidth: "200px",
                      }}
                    >
                      {/* Texto dinámico del botón */}
                      {saving
                        ? "Guardando seguimiento..."
                        : "Guardar información"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Ventana emergente con las reglas de seguimiento */}
      {showRulesNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
          onClick={() => setShowRulesNotice(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reglas-seguimiento-titulo"
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 pr-14 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Cerrar aviso informativo"
              onClick={() => setShowRulesNotice(false)}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X size={18} />
            </button>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                <Info size={18} />
              </div>
              <div>
                <h3
                  id="reglas-seguimiento-titulo"
                  className="text-base font-semibold text-card-foreground"
                >
                  Reglas de seguimiento
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Solo puedes registrar seguimiento en sesiones{" "}
                  <strong className="text-brand-blue-text">APROBADAS</strong>.
                  Al guardar, el estado cambia a{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    COMPLETADA
                  </strong>{" "}
                  y las observaciones se envían al estudiante.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
