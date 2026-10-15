import { useState, useEffect, useCallback } from "react";
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

import { ApiError } from "../lib/api";
import { VoiceSearchInput } from "./VoiceSearchInput";

interface Props {
  idTutor: number;
}

type TipoFiltro = "nombre" | "apellido" | "materia" | "fecha" | "estado";

const COLORES = {
  fondo: "#111C2D",
  panel: "#192B3B",
  fila: "#1D3043",
  filaHover: "#24394D",
  borde: "#30465C",
  texto: "#F1F5F9",
  secundario: "#A8B7C8",
  turquesa: "#20C5E8",
  azul: "#3B82F6",
  naranja: "#F59E0B",
  verde: "#10B981",
  rojo: "#EF4444",
};

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join("")
    .toUpperCase();
}

function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split("-");
  return `${d} ${[
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
  ][Number(m)]} ${y}`;
}

function formatHora(hora: string): string {
  return hora.slice(0, 5);
}

function nombreEstado(estado: Sesion["estado"]): string {
  switch (estado) {
    case "PENDIENTE":
      return "Pendiente";
    case "APROBADA":
      return "Aprobada";
    case "RECHAZADA":
      return "Rechazada";
    default:
      return estado;
  }
}

function estiloEstado(estado: Sesion["estado"]) {
  switch (estado) {
    case "APROBADA":
      return {
        color: "#60A5FA",
        background: "rgba(59,130,246,0.14)",
      };
    case "RECHAZADA":
      return {
        color: "#F87171",
        background: "rgba(239,68,68,0.13)",
      };
    default:
      return {
        color: "#FBBF24",
        background: "rgba(245,158,11,0.14)",
      };
  }
}

/* Modal de rechazo */
function RechazarModal({
  sesion,
  onConfirm,
  onClose,
  enviando,
}: {
  sesion: Sesion;
  onConfirm: (justificacion: string) => void;
  onClose: () => void;
  enviando: boolean;
}) {
  const [justificacion, setJustificacion] = useState("");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar ventana"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#30465C] bg-[#192B3B] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#30465C] px-5 py-4">
          <h3 className="font-semibold text-[#F1F5F9]">
            Rechazar solicitud
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="rounded-lg p-2 text-[#A8B7C8] hover:bg-[#24394D] hover:text-white"
            aria-label="Cerrar"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm text-[#A8B7C8]">
            Solicitud de{" "}
            <strong className="text-[#F1F5F9]">
              {sesion.estudianteNombre}
            </strong>{" "}
            — {sesion.asignaturaNombre}
          </p>

          <div className="space-y-2">
            <label
              htmlFor="justificacion-solicitud"
              className="text-sm text-[#F1F5F9]"
            >
              Justificación{" "}
              <span className="text-[#A8B7C8]">(opcional)</span>
            </label>

            <textarea
              id="justificacion-solicitud"
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              rows={4}
              placeholder="Escribe el motivo del rechazo..."
              className="w-full resize-none rounded-xl border border-[#30465C] bg-[#1D3043] px-4 py-3 text-sm text-[#F1F5F9] outline-none placeholder:text-[#91A2B6] focus:border-[#20C5E8] focus:ring-2 focus:ring-[#118AB2]/25"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="flex-1 rounded-xl border border-[#30465C] py-2.5 text-sm text-[#D5DEE8] hover:bg-[#24394D] disabled:opacity-60"
            >
              Cancelar
            </button>

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

/* Ventana emergente de detalles */
function DetallesModal({
  sesion,
  procesando,
  onClose,
  onAprobar,
  onRechazar,
}: {
  sesion: Sesion;
  procesando: boolean;
  onClose: () => void;
  onAprobar: () => void;
  onRechazar: () => void;
}) {
  const campos = [
    { icon: ClipboardList, label: "Código", valor: `#${sesion.id}` },
    { icon: BookOpen, label: "Asignatura", valor: sesion.asignaturaNombre },
    { icon: Calendar, label: "Fecha", valor: formatFecha(sesion.fechaSesion) },
    { icon: Clock, label: "Hora", valor: formatHora(sesion.horaInicio) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar detalles"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalles-solicitud"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#30465C] bg-[#192B3B] shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#30465C] bg-[#192B3B] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
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
              <p className="truncate text-sm text-[#A8B7C8]">
                {sesion.estudianteNombre}
              </p>
            </div>
          </div>

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

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[#A8B7C8]">
              Estado de la tutoría
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={estiloEstado(sesion.estado)}
            >
              {nombreEstado(sesion.estado)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {campos.map((campo) => (
              <div
                key={campo.label}
                className="min-w-0 rounded-xl border border-[#30465C] bg-[#1D3043] p-3.5"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <campo.icon size={14} className="text-[#20C5E8]" />
                  <span className="text-xs uppercase tracking-wide text-[#A8B7C8]">
                    {campo.label}
                  </span>
                </div>
                <p className="break-words text-sm font-medium text-[#F1F5F9]">
                  {campo.valor}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#30465C] bg-[#1D3043] p-4">
            <div className="mb-2 flex items-center gap-2">
              <User size={14} className="text-[#20C5E8]" />
              <span className="text-xs uppercase tracking-wide text-[#A8B7C8]">
                Estudiante
              </span>
            </div>
            <p className="text-sm text-[#F1F5F9]">
              {sesion.estudianteNombre}
            </p>
          </div>

          <div className="rounded-xl border border-[#30465C] bg-[#1D3043] p-4">
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare size={14} className="text-[#20C5E8]" />
              <span className="text-xs uppercase tracking-wide text-[#A8B7C8]">
                Dificultades declaradas
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#E2E8F0]">
              {sesion.descripcionDificultades?.trim() ||
                "El estudiante no indicó dificultades específicas."}
            </p>
          </div>

          {sesion.estado === "PENDIENTE" && (
            <div className="flex flex-col gap-3 border-t border-[#30465C] pt-4 sm:flex-row">
              <button
                type="button"
                onClick={onAprobar}
                disabled={procesando}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {procesando ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Aprobar solicitud
              </button>

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

export function SolicitudesPendientes({ idTutor }: Props) {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("nombre");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [detalleAbierto, setDetalleAbierto] = useState<Sesion | null>(null);
  const [rechazando, setRechazando] = useState<Sesion | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [recienActuado, setRecienActuado] = useState<{
    id: number;
    accion: "APROBADA" | "RECHAZADA";
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setLoadError(null);

    pendientesTutor(idTutor)
      .then(setSesiones)
      .catch((err) =>
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar las solicitudes.",
        ),
      )
      .finally(() => setCargando(false));
  }, [idTutor]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const aprobar = async (id: number) => {
    setProcesando(id);
    setActionError(null);

    try {
      await resolverSolicitud(id, true);
      setDetalleAbierto(null);
      setRecienActuado({ id, accion: "APROBADA" });
      window.setTimeout(() => setRecienActuado(null), 3500);
      cargar();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "No se pudo aprobar la solicitud.",
      );
    } finally {
      setProcesando(null);
    }
  };

  const rechazar = async (id: number, justificacion: string) => {
    setProcesando(id);
    setActionError(null);

    try {
      await resolverSolicitud(id, false, justificacion || undefined);
      setRechazando(null);
      setDetalleAbierto(null);
      setRecienActuado({ id, accion: "RECHAZADA" });
      window.setTimeout(() => setRecienActuado(null), 3500);
      cargar();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "No se pudo rechazar la solicitud.",
      );
    } finally {
      setProcesando(null);
    }
  };

  const termino = busqueda.trim().toLocaleLowerCase();

  const solicitudesVisibles = sesiones
    .filter((sesion) => {
      if (!termino) return true;

      const palabras = sesion.estudianteNombre
        .toLocaleLowerCase()
        .split(/\s+/);

      switch (tipoFiltro) {
        case "nombre":
          return palabras[0]?.includes(termino) ?? false;

        case "apellido":
          return palabras.slice(1).some((palabra) => palabra.includes(termino));

        case "materia":
          return sesion.asignaturaNombre
            .toLocaleLowerCase()
            .includes(termino);

        case "fecha":
          return (
            formatFecha(sesion.fechaSesion)
              .toLocaleLowerCase()
              .includes(termino) || sesion.fechaSesion.includes(termino)
          );

        case "estado":
          return nombreEstado(sesion.estado)
            .toLocaleLowerCase()
            .includes(termino);
      }
    })
    .sort((a, b) => a.fechaSesion.localeCompare(b.fechaSesion));

  if (cargando) {
    return (
      <div className="flex min-h-40 w-full items-center justify-center bg-[#111C2D]">
        <Loader2 size={26} className="animate-spin text-[#20C5E8]" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-[#30465C] bg-[#192B3B] p-8 text-center">
        <AlertCircle className="mx-auto mb-3 text-red-400" size={26} />
        <p className="text-sm text-red-400">{loadError}</p>
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

  return (
    <div className="w-full space-y-5 text-[#F1F5F9]">
      {/* Encabezado descriptivo */}
      <h1 className="text-xl font-medium tracking-tight text-[#F1F5F9] sm:text-2xl">
        Consulta y gestiona las solicitudes de tutoría
      </h1>

      {/* Tabla de historial */}
      <section className="overflow-visible rounded-2xl border border-[#30465C] bg-[#192B3B]">
        {/* Título, búsqueda y filtro */}
        <div className="flex flex-col gap-4 rounded-t-2xl border-b border-[#30465C] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-semibold text-[#F1F5F9]">
                Historial de Solicitudes
              </h2>
              <p className="text-xs text-[#A8B7C8]">
                Consulta y gestiona las solicitudes de tutoría
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="w-full sm:w-[290px]">
              <VoiceSearchInput
                value={busqueda}
                onChange={setBusqueda}
                placeholder="Buscar..."
                className="w-full rounded-2xl border border-[#118AB2] bg-[#1D3043] text-[#F1F5F9] placeholder:text-[#A8B7C8] focus:border-[#20C5E8] focus:outline-none focus:ring-2 focus:ring-[#118AB2]/25"
              />
            </div>

            {/* Filtro desplegable: aplica inmediatamente */}
            <div className="relative w-full sm:w-[150px]">
              <button
                type="button"
                onClick={() => setMostrarFiltros((actual) => !actual)}
                aria-expanded={mostrarFiltros}
                aria-controls="filtro-solicitudes"
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border bg-[#1D3043] px-4 py-3 text-sm text-[#F1F5F9] transition-colors hover:border-[#118AB2] ${
                  mostrarFiltros
                    ? "border-[#118AB2] ring-2 ring-[#118AB2]/20"
                    : "border-[#30465C]"
                }`}
              >
                <span>Filtrar</span>
                <ChevronDown
                  size={16}
                  className={`text-[#A8B7C8] transition-transform ${
                    mostrarFiltros ? "rotate-180" : ""
                  }`}
                />
              </button>

              {mostrarFiltros && (
                <>
                  <button
                    type="button"
                    aria-label="Cerrar filtro"
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setMostrarFiltros(false)}
                  />

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
                          setTipoFiltro(valor);
                          setBusqueda("");
                          setMostrarFiltros(false);
                        }}
                        className={`block w-full px-3 py-2.5 text-left text-sm transition-colors ${
                          tipoFiltro === valor
                            ? "bg-[#118AB2] text-white"
                            : "text-[#F1F5F9] hover:bg-[#263B4F]"
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

        {/* Avisos de operación */}
        {actionError && (
          <div className="mx-4 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 sm:mx-5">
            <p className="text-sm text-red-400">{actionError}</p>
          </div>
        )}

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

        {/* Tabla con estudiante y detalles */}
        {solicitudesVisibles.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Search size={28} className="mx-auto mb-3 text-[#91A2B6]" />
            <p className="text-sm font-medium text-[#F1F5F9]">
              No se encontraron solicitudes
            </p>
            <p className="mt-1 text-sm text-[#A8B7C8]">
              Prueba con otro término de búsqueda o cambia el filtro.
            </p>
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
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left">
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

              <tbody className="divide-y divide-[#30465C]">
                {solicitudesVisibles.map((sesion) => (
                  <tr
                    key={sesion.id}
                    className="bg-[#1D3043] transition-colors hover:bg-[#24394D]"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-[#F1F5F9]">
                      {formatFecha(sesion.fechaSesion)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-[#D5DEE8]">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} className="text-[#A8B7C8]" />
                        {formatHora(sesion.horaInicio)}
                      </span>
                    </td>

                    <td className="max-w-[220px] px-5 py-4 text-sm text-[#F1F5F9]">
                      <span
                        className="block truncate"
                        title={sesion.asignaturaNombre}
                      >
                        {sesion.asignaturaNombre}
                      </span>
                    </td>

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

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={estiloEstado(sesion.estado)}
                      >
                        {nombreEstado(sesion.estado)}
                      </span>
                    </td>

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

        <div className="border-t border-[#30465C] px-5 py-3">
          <p className="text-xs text-[#A8B7C8]">
            Mostrando {solicitudesVisibles.length} de {sesiones.length}{" "}
            registros
          </p>
        </div>
      </section>

      {/* Modal de detalles */}
      {detalleAbierto && (
        <DetallesModal
          sesion={detalleAbierto}
          procesando={procesando === detalleAbierto.id}
          onClose={() => setDetalleAbierto(null)}
          onAprobar={() => aprobar(detalleAbierto.id)}
          onRechazar={() => setRechazando(detalleAbierto)}
        />
      )}

      {/* Modal de rechazo */}
      {rechazando && (
        <RechazarModal
          sesion={rechazando}
          enviando={procesando === rechazando.id}
          onConfirm={(justificacion) =>
            rechazar(rechazando.id, justificacion)
          }
          onClose={() => setRechazando(null)}
        />
      )}
    </div>
  );
}