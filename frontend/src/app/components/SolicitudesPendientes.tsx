import { useState, useEffect, useCallback } from "react";

// Importación de iconos SVG desde la librería lucide-react
import {
  User,
  BookOpen,
  Calendar,
  Clock,
  MessageSquare,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ClipboardList,
  Search,
  ChevronDown,
  Eye,
} from "lucide-react";

import {
  pendientesTutor,
  resolverSolicitud,
  type Sesion,
} from "../lib/sesiones";

// Clase de error personalizada para distinguir errores de API
import { ApiError } from "../lib/api";
// Componente de input con soporte de búsqueda por voz
import { VoiceSearchInput } from "./VoiceSearchInput";

// Props que recibe el componente principal
interface Props {
  idTutor: number; // ID del tutor para consultar sus solicitudes
}

// Tipos de filtro disponibles para la búsqueda
type TipoFiltro = "nombre" | "apellido" | "materia" | "fecha" | "estado";

// Paleta de colores del tema oscuro
const COLORES = {
  fondo: "#111C2D",
  panel: "#192B3B",
  fila: "#1D3043", // Fondo de filas de tabla
  filaHover: "#24394D", // Fondo de fila al pasar el mouse
  borde: "#30465C", // Color de bordes
  texto: "#F1F5F9", // Color de texto principal
  secundario: "#A8B7C8", // Color de texto secundario
  turquesa: "#20C5E8", // Color de acento turquesa
  azul: "#3B82F6", // Color azul
  naranja: "#F59E0B", // Color naranja (pendiente)
  verde: "#10B981", // Color verde (aprobada)
  rojo: "#EF4444", // Color rojo (rechazada)
};

// Función que extrae las iniciales de un nombre completo
// Ejemplo: "Juan Pérez Gómez" → "JP"
function iniciales(nombre: string): string {
  return nombre
    .split(" ") // Divide el nombre por espacios
    .filter(Boolean) // Elimina elementos vacíos
    .slice(0, 2) // Toma solo las 2 primeras palabras
    .map((palabra) => palabra[0]) // Extrae la primera letra de cada una
    .join("") // Une las letras
    .toUpperCase(); // Convierte a mayúsculas
}

// Función que formatea una fecha ISO a formato legible
function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split("-"); // Separa año, mes, día
  return `${d} ${
    [
      "",
      "ene",
      "feb",
      "mar",
      "abr",
      "may",
      "jun",
      "jul",
      "ago",
      "sep",
      "oct",
      "nov",
      "dic",
    ][Number(m)]
  } ${y}`; // Retorna día + mes abreviado + año
}

// Función que recorta una hora a formato HH:MM
function formatHora(hora: string): string {
  return hora.slice(0, 5); // Toma solo los primeros 5 caracteres
}

// Función que traduce el estado técnico a texto mostrable
function nombreEstado(estado: Sesion["estado"]): string {
  switch (estado) {
    case "PENDIENTE":
      return "Pendiente";
    case "APROBADA":
      return "Aprobada";
    case "RECHAZADA":
      return "Rechazada";
    default:
      return estado; // Fallback por seguridad
  }
}

// Función que devuelve los colores (texto y fondo) según el estado
function estiloEstado(estado: Sesion["estado"]) {
  switch (estado) {
    case "APROBADA":
      // Azul claro sobre fondo azul translúcido
      return {
        color: "#60A5FA",
        background: "rgba(59,130,246,0.14)",
      };
    case "RECHAZADA":
      // Rojo claro sobre fondo rojo translúcido
      return {
        color: "#F87171",
        background: "rgba(239,68,68,0.13)",
      };
    default:
      // Ámbar (pendiente) sobre fondo naranja translúcido
      return {
        color: "#FBBF24",
        background: "rgba(245,158,11,0.14)",
      };
  }
}

/* ============================================================
   MODAL DE RECHAZO
   Permite al tutor escribir una justificación opcional antes de
   confirmar el rechazo de una solicitud.
   ============================================================ */
function RechazarModal({
  sesion, // Solicitud que se va a rechazar
  onConfirm, // Callback al confirmar (recibe justificación)
  onClose, // Callback para cerrar el modal
  enviando, // Booleano para deshabilitar botones mientras se procesa
}: {
  sesion: Sesion;
  onConfirm: (justificacion: string) => void;
  onClose: () => void;
  enviando: boolean;
}) {
  // Estado local para el texto de la justificación
  const [justificacion, setJustificacion] = useState("");

  return (
    // Contenedor fijo de pantalla completa con z-index alto
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Botón invisible que cubre toda la pantalla para cerrar al hacer clic fuera */}
      <button
        type="button"
        aria-label="Cerrar ventana"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Tarjeta del modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#30465C] bg-[#192B3B] shadow-2xl">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-[#30465C] px-5 py-4">
          <h3 className="font-semibold text-[#F1F5F9]">Rechazar solicitud</h3>
          {/* Botón de cerrar (X) con fondo rojo tenue y resaltado al hacer clic */}
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="rounded-lg bg-red-500/10 p-2 text-red-400 transition-colors hover:bg-red-500/20 active:bg-red-500/40 active:text-white disabled:opacity-60"
            aria-label="Cerrar"
          >
            <X size={17} />
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="space-y-4 p-5">
          {/* Resumen de la solicitud a rechazar */}
          <p className="text-sm text-[#A8B7C8]">
            Solicitud de{" "}
            <strong className="text-[#F1F5F9]">
              {sesion.estudianteNombre}
            </strong>{" "}
            — {sesion.asignaturaNombre}
          </p>

          {/* Campo de justificación */}
          <div className="space-y-2">
            <label
              htmlFor="justificacion-solicitud"
              className="text-sm text-[#F1F5F9]"
            >
              Justificación <span className="text-[#A8B7C8]">(opcional)</span>
            </label>

            {/* Textarea para el motivo del rechazo */}
            <textarea
              id="justificacion-solicitud"
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              rows={4}
              placeholder="Escribe el motivo del rechazo..."
              className="w-full resize-none rounded-xl border border-[#30465C] bg-[#1D3043] 
              px-4 py-3 text-sm text-[#F1F5F9] outline-none placeholder:text-[#91A2B6] 
              focus:border-[#20C5E8] focus:ring-2 focus:ring-[#118AB2]/25"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            {/* Botón Cancelar */}
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="flex-1 rounded-xl border border-[#30465C] py-2.5 text-sm text-[#D5DEE8] hover:bg-[#24394D] disabled:opacity-60"
            >
              Cancelar
            </button>

            {/* Botón Confirmar rechazo (muestra spinner si enviando) */}
            <button
              type="button"
              onClick={() => onConfirm(justificacion)}
              disabled={enviando}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm text-white hover:bg-red-700 disabled:opacity-60"
            >
              {enviando && <Loader2 size={15} className="animate-spin" />}
              Confirmar rechazo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODAL DE DETALLES
   Muestra toda la información de una solicitud y permite
   aprobarla o rechazarla si está pendiente.
   ============================================================ */
function DetallesModal({
  sesion, // Solicitud a mostrar
  procesando, // Si se está ejecutando una acción
  onClose, // Callback para cerrar
  onAprobar, // Callback para aprobar
  onRechazar, // Callback para abrir modal de rechazo
}: {
  sesion: Sesion;
  procesando: boolean;
  onClose: () => void;
  onAprobar: () => void;
  onRechazar: () => void;
}) {
  // Definición de los campos básicos a mostrar en tarjetas
  const campos = [
    { icon: ClipboardList, label: "Código", valor: `#${sesion.id}` },
    { icon: BookOpen, label: "Asignatura", valor: sesion.asignaturaNombre },
    { icon: Calendar, label: "Fecha", valor: formatFecha(sesion.fechaSesion) },
    { icon: Clock, label: "Hora", valor: formatHora(sesion.horaInicio) },
  ];

  return (
    // Contenedor fijo de pantalla completa
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fondo oscuro clickeable para cerrar */}
      <button
        type="button"
        aria-label="Cerrar detalles"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Tarjeta del modal con scroll interno */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalles-solicitud"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#30465C] bg-[#192B3B] shadow-2xl"
      >
        {/* Cabecera sticky con avatar, nombre y botón cerrar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#30465C] bg-[#192B3B] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {/* Avatar con iniciales del estudiante */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#118AB2] text-xs font-semibold text-white">
              {iniciales(sesion.estudianteNombre)}
            </div>
            <div className="min-w-0">
              <h3
                id="titulo-detalles-solicitud"
                className="font-semibold text-[#F1F5F9]"
              >
                Detalles de la solicitud
              </h3>
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            type="button"
            onClick={onClose}
            disabled={procesando}
            aria-label="Cerrar"
            className="ml-3 rounded-lg p-2 text-[#A8B7C8] hover:bg-[#24394D] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="space-y-5 p-5 sm:p-6">
          {/* Estado de la tutoría */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[#A8B7C8]">Estado de la tutoría</span>
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={estiloEstado(sesion.estado)}
            >
              {nombreEstado(sesion.estado)}
            </span>
          </div>

          {/* Tarjeta de dificultades declaradas */}
          <div className="overflow-hidden rounded-xl border border-[#30465C] bg-[#1D3043]">
            {/* Sección: Estudiante */}
            <div className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <User size={14} className="text-[#20C5E8]" />
                <span className="text-xs uppercase tracking-wide text-[#A8B7C8]">
                  Estudiante
                </span>
              </div>
              <p className="text-sm font-medium text-[#F1F5F9]">
                {sesion.estudianteNombre}
              </p>
            </div>

            {/* Sección: Dificultades académicas (separada por línea suave) */}
            <div className="border-t border-[#30465C]/60 p-4">
              <div className="mb-2 flex items-center gap-2">
                <MessageSquare size={14} className="text-[#20C5E8]" />
                <span className="text-xs uppercase tracking-wide text-[#A8B7C8]">
                  Dificultades académicas del estudiante
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#E2E8F0]">
                {sesion.descripcionDificultades?.trim() ||
                  "El estudiante no indicó dificultades específicas."}
              </p>
            </div>
          </div>

          {/* Solo si la solicitud está PENDIENTE se muestran botones de acción */}
          {sesion.estado === "PENDIENTE" && (
            <div className="flex flex-col gap-3 border-t border-[#30465C] pt-4 sm:flex-row">
              {/* Botón Aprobar con color #118AB2 */}
              <button
                type="button"
                onClick={onAprobar}
                disabled={procesando}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#118AB2] py-3 text-sm font-medium text-white transition-colors hover:bg-[#0E6F8F] active:bg-[#0B5A75] disabled:opacity-60"
              >
                {procesando ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Aprobar solicitud
              </button>

              {/* Botón Rechazar */}
              <button
                type="button"
                onClick={onRechazar}
                disabled={procesando}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/60 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-60"
              >
                <X size={16} />
                Rechazar solicitud
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENTE PRINCIPAL
   Muestra la tabla de solicitudes pendientes del tutor, permite
   buscar, filtrar, ver detalles, aprobar y rechazar.
   ============================================================ */
export function SolicitudesPendientes({ idTutor }: Props) {
  // Lista de solicitudes cargadas desde el backend
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  // Indicador de carga inicial
  const [cargando, setCargando] = useState(true);
  // Mensaje de error al cargar
  const [loadError, setLoadError] = useState<string | null>(null);
  // Texto del buscador
  const [busqueda, setBusqueda] = useState("");
  // Criterio de filtro actual
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("nombre");
  // Controla visibilidad del dropdown de filtros
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  // Solicitud abierta en el modal de detalles
  const [detalleAbierto, setDetalleAbierto] = useState<Sesion | null>(null);
  // Solicitud abierta en el modal de rechazo
  const [rechazando, setRechazando] = useState<Sesion | null>(null);
  // ID de la solicitud que se está procesando (aprobando/rechazando)
  const [procesando, setProcesando] = useState<number | null>(null);
  // Toast de éxito tras aprobar/rechazar (se oculta a los 3.5s)
  const [recienActuado, setRecienActuado] = useState<{
    id: number;
    accion: "APROBADA" | "RECHAZADA";
  } | null>(null);
  // Mensaje de error tras una acción fallida
  const [actionError, setActionError] = useState<string | null>(null);

  // Función memorizada para cargar las solicitudes del tutor
  const cargar = useCallback(() => {
    setCargando(true); // Activa spinner
    setLoadError(null); // Limpia error previo

    pendientesTutor(idTutor) // Llama a la API
      .then(setSesiones) // Guarda el resultado en estado
      .catch((err) =>
        // Maneja el error mostrando mensaje adecuado
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar las solicitudes.",
        ),
      )
      .finally(() => setCargando(false)); // Desactiva spinner
  }, [idTutor]); // Se recrea solo si cambia idTutor

  // Carga las solicitudes al montar el componente (o si cambia idTutor)
  useEffect(() => {
    cargar();
  }, [cargar]);

  // Función para aprobar una solicitud
  const aprobar = async (id: number) => {
    setProcesando(id); // Marca la solicitud como en proceso
    setActionError(null); // Limpia error previo

    try {
      await resolverSolicitud(id, true); // Llama API con aprobada=true
      setDetalleAbierto(null); // Cierra modal de detalles
      setRecienActuado({ id, accion: "APROBADA" }); // Muestra toast
      window.setTimeout(() => setRecienActuado(null), 3500); // Oculta a los 3.5s
      cargar(); // Recarga la lista
    } catch (err) {
      // Muestra error de la acción
      setActionError(
        err instanceof ApiError
          ? err.message
          : "No se pudo aprobar la solicitud.",
      );
    } finally {
      setProcesando(null); // Limpia estado de procesamiento
    }
  };

  // Función para rechazar una solicitud con justificación opcional
  const rechazar = async (id: number, justificacion: string) => {
    setProcesando(id); // Marca la solicitud como en proceso
    setActionError(null); // Limpia error previo

    try {
      // Llama API con aprobada=false y justificación si existe
      await resolverSolicitud(id, false, justificacion || undefined);
      setRechazando(null); // Cierra modal de rechazo
      setDetalleAbierto(null); // Cierra modal de detalles
      setRecienActuado({ id, accion: "RECHAZADA" }); // Muestra toast
      window.setTimeout(() => setRecienActuado(null), 3500); // Oculta a los 3.5s
      cargar(); // Recarga la lista
    } catch (err) {
      // Muestra error de la acción
      setActionError(
        err instanceof ApiError
          ? err.message
          : "No se pudo rechazar la solicitud.",
      );
    } finally {
      setProcesando(null); // Limpia estado de procesamiento
    }
  };

  // Término de búsqueda normalizado (minúsculas y sin espacios extremos)
  const termino = busqueda.trim().toLocaleLowerCase();

  // Lista filtrada y ordenada según el término y tipo de filtro
  const solicitudesVisibles = sesiones
    .filter((sesion) => {
      if (!termino) return true; // Si no hay término, mostrar todo

      // Divide el nombre del estudiante en palabras
      const palabras = sesion.estudianteNombre.toLocaleLowerCase().split(/\s+/);

      // Evalúa según el tipo de filtro seleccionado
      switch (tipoFiltro) {
        case "nombre":
          // Busca en la primera palabra del nombre
          return palabras[0]?.includes(termino) ?? false;

        case "apellido":
          // Busca en las palabras desde la segunda en adelante
          return palabras.slice(1).some((palabra) => palabra.includes(termino));

        case "materia":
          // Busca en el nombre de la asignatura
          return sesion.asignaturaNombre.toLocaleLowerCase().includes(termino);

        case "fecha":
          // Busca tanto en formato legible como ISO
          return (
            formatFecha(sesion.fechaSesion)
              .toLocaleLowerCase()
              .includes(termino) || sesion.fechaSesion.includes(termino)
          );

        case "estado":
          // Busca en el nombre legible del estado
          return nombreEstado(sesion.estado)
            .toLocaleLowerCase()
            .includes(termino);
      }
    })
    // Ordena cronológicamente por fecha (formato ISO se ordena lexicográficamente)
    .sort((a, b) => a.fechaSesion.localeCompare(b.fechaSesion));

  // Render condicional: spinner mientras carga
  if (cargando) {
    return (
      <div className="flex min-h-40 w-full items-center justify-center bg-[#111C2D]">
        <Loader2 size={26} className="animate-spin text-[#20C5E8]" />
      </div>
    );
  }

  // Render condicional: mensaje de error de carga
  if (loadError) {
    return (
      <div className="rounded-2xl border border-[#30465C] bg-[#192B3B] p-8 text-center">
        <AlertCircle className="mx-auto mb-3 text-red-400" size={26} />
        <p className="text-sm text-red-400">{loadError}</p>
        {/* Botón para reintentar la carga */}
        <button
          type="button"
          onClick={cargar}
          className="mt-4 rounded-xl border border-[#30465C] px-4 py-2 text-sm text-[#F1F5F9] hover:bg-[#24394D]"
        >
          Intentar nuevamente
        </button>
      </div>
    );
  }

  // Render principal
  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 text-[#F1F5F9]">
      {/* Encabezado descriptivo */}
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-2xl">
        Consulta y gestiona las solicitudes de tutoría
      </h2>

      {/* Sección principal (tabla) */}
      <section className="overflow-visible rounded-2xl border border-[#30465C] bg-[#192B3B]">
        {/* Cabecera con título, búsqueda y filtro */}
        <div className="flex flex-col gap-4 rounded-t-2xl border-b border-[#30465C] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-semibold text-base text-[#F1F5F9]">
                Historial de Solicitudes
              </h3>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {/* Input de búsqueda con soporte de voz */}
            <div className="w-full sm:w-[260px]">
              <VoiceSearchInput
                value={busqueda}
                onChange={setBusqueda}
                placeholder="Buscar..."
                className="min-w-0 flex-1 sm:w-64"
                style={
                  {
                    fontSize: "0.8rem",
                    borderColor: "#118AB2",
                    "--tw-ring-color": "#118AB2",
                  } as React.CSSProperties
                }
              />
            </div>

            {/* Dropdown de filtro */}
            <div className="relative w-full sm:w-[150px]">
              {/* Botón que abre/cierra el dropdown */}
              <button
                type="button"
                onClick={() => setMostrarFiltros((actual) => !actual)}
                aria-expanded={mostrarFiltros}
                aria-controls="filtro-solicitudes"
                className={`flex h-[42px] w-full items-center justify-between gap-3 rounded-2xl border bg-[#1D3043] px-4 py-3 text-sm text-[#F1F5F9] transition-colors hover:border-[#118AB2] ${
                  mostrarFiltros
                    ? "border-[#118AB2] ring-2 ring-[#118AB2]/20"
                    : "border-[#30465C]"
                }`}
                style={
                  {
                    fontSize: "0.8rem",
                    borderColor: "#118AB2",
                    "--tw-ring-color": "#118AB2",
                  } as React.CSSProperties
                }
              >
                <span>Filtrar</span>
                {/* Icono chevron que rota cuando está abierto */}
                <ChevronDown
                  size={16}
                  className={`text-[#A8B7C8] transition-transform ${
                    mostrarFiltros ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Menú desplegable de opciones */}
              {mostrarFiltros && (
                <>
                  {/* Capa invisible para cerrar al hacer clic fuera */}
                  <button
                    type="button"
                    aria-label="Cerrar filtro"
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setMostrarFiltros(false)}
                  />

                  {/* Lista de opciones de filtro */}
                  <div
                    id="filtro-solicitudes"
                    className="absolute right-0 z-30 mt-1 w-full min-w-[180px] overflow-hidden border border-[#91A2B6] bg-[#1D3043] shadow-xl"
                  >
                    {(
                      [
                        ["nombre", "Nombre"],
                        ["apellido", "Apellido"],
                        ["materia", "Asignatura"],
                        ["fecha", "Fecha"],
                        ["estado", "Estado"],
                      ] as [TipoFiltro, string][]
                    ).map(([valor, etiqueta]) => (
                      <button
                        key={valor}
                        type="button"
                        onClick={() => {
                          setTipoFiltro(valor); // Cambia el filtro
                          setBusqueda(""); // Limpia la búsqueda
                          setMostrarFiltros(false); // Cierra el dropdown
                        }}
                        className={`block w-full px-3 py-2.5 text-left text-sm transition-colors ${
                          tipoFiltro === valor
                            ? "bg-[#118AB2] text-white" // Opción seleccionada
                            : "text-[#F1F5F9] hover:bg-[#263B4F]" // Normal
                        }`}
                      >
                        {etiqueta}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Aviso de error tras una acción */}
        {actionError && (
          <div className="mx-4 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 sm:mx-5">
            <p className="text-sm text-red-400">{actionError}</p>
          </div>
        )}

        {/* Toast de éxito tras aprobar/rechazar */}
        {recienActuado && (
          <div
            className={`mx-4 mt-4 flex items-center gap-2.5 rounded-xl border px-4 py-3 sm:mx-5 ${
              recienActuado.accion === "APROBADA"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            <CheckCircle2 size={16} />
            <p className="text-sm">
              {recienActuado.accion === "APROBADA"
                ? `Solicitud #${recienActuado.id} aprobada correctamente.`
                : `Solicitud #${recienActuado.id} rechazada correctamente.`}
            </p>
          </div>
        )}

        {/* Tabla o estado vacío */}
        {solicitudesVisibles.length === 0 ? (
          // Estado vacío: no hay resultados
          <div className="px-5 py-12 text-center">
            <Search size={28} className="mx-auto mb-3 text-[#91A2B6]" />
            <p className="text-sm font-medium text-[#F1F5F9]">
              No se encontraron solicitudes
            </p>
            <p className="mt-1 text-sm text-[#A8B7C8]">
              Prueba con otro término de búsqueda o cambia el filtro.
            </p>
            {/* Botón para limpiar la búsqueda si existe */}
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="mt-3 text-sm text-[#20C5E8] hover:underline"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          // Tabla con resultados (con scroll horizontal en pantallas pequeñas)
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left">
              {/* Cabecera de la tabla */}
              <thead>
                <tr className="border-b border-[#30465C] bg-[#192B3B]">
                  {[
                    "Fecha",
                    "Hora",
                    "Asignatura",
                    "Estudiante",
                    "Estado",
                    "Acciones",
                  ].map((columna) => (
                    <th
                      key={columna}
                      className="whitespace-nowrap px-5 py-4 text-xs font-medium text-[#A8B7C8]"
                    >
                      {columna}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Cuerpo de la tabla: una fila por solicitud */}
              <tbody className="divide-y divide-[#30465C]">
                {solicitudesVisibles.map((sesion) => (
                  <tr
                    key={sesion.id}
                    className="bg-[#1D3043] transition-colors hover:bg-[#24394D]"
                  >
                    {/* Columna Fecha */}
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-[#F1F5F9]">
                      {formatFecha(sesion.fechaSesion)}
                    </td>

                    {/* Columna Hora con icono */}
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-[#D5DEE8]">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} className="text-[#A8B7C8]" />
                        {formatHora(sesion.horaInicio)}
                      </span>
                    </td>

                    {/* Columna Asignatura (truncada con tooltip) */}
                    <td className="max-w-[220px] px-5 py-4 text-sm text-[#F1F5F9]">
                      <span
                        className="block truncate"
                        title={sesion.asignaturaNombre}
                      >
                        {sesion.asignaturaNombre}
                      </span>
                    </td>

                    {/* Columna Estudiante con avatar */}
                    <td className="max-w-[240px] px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#118AB2] text-[10px] font-semibold text-white">
                          {iniciales(sesion.estudianteNombre)}
                        </div>
                        <span
                          className="truncate text-sm text-[#F1F5F9]"
                          title={sesion.estudianteNombre}
                        >
                          {sesion.estudianteNombre}
                        </span>
                      </div>
                    </td>

                    {/* Columna Estado con píldora de color */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={estiloEstado(sesion.estado)}
                      >
                        {nombreEstado(sesion.estado)}
                      </span>
                    </td>

                    {/* Columna Acciones: botón Detalles */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setDetalleAbierto(sesion)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#118AB2] bg-[#192B3B] px-3.5 py-2 text-xs font-medium text-[#20C5E8] transition-colors hover:bg-[#118AB2]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C5E8]"
                      >
                        <Eye size={14} />
                        Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pie con conteo de registros */}
        <div className="border-t border-[#30465C] px-5 py-3">
          <p className="text-xs text-[#A8B7C8]">
            Mostrando {solicitudesVisibles.length} de {sesiones.length}{" "}
            registros
          </p>
        </div>
      </section>

      {/* Modal de detalles (si hay una solicitud abierta) */}
      {detalleAbierto && (
        <DetallesModal
          sesion={detalleAbierto}
          procesando={procesando === detalleAbierto.id}
          onClose={() => setDetalleAbierto(null)}
          onAprobar={() => aprobar(detalleAbierto.id)}
          onRechazar={() => setRechazando(detalleAbierto)}
        />
      )}

      {/* Modal de rechazo (si hay una solicitud en proceso de rechazo) */}
      {rechazando && (
        <RechazarModal
          sesion={rechazando}
          enviando={procesando === rechazando.id}
          onConfirm={(justificacion) => rechazar(rechazando.id, justificacion)}
          onClose={() => setRechazando(null)}
        />
      )}
    </div>
  );
}
