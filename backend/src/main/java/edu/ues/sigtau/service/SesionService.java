package edu.ues.sigtau.service;

import edu.ues.sigtau.dto.SesionResponse;
import edu.ues.sigtau.dto.SolicitarSesionRequest;
import edu.ues.sigtau.model.*;
import edu.ues.sigtau.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SesionService {

        private final SesionRepository sesionRepository;
        private final EstudianteRepository estudianteRepository;
        private final TutorRepository tutorRepository;
        private final AsignaturaRepository asignaturaRepository;
        private final HorarioRepository horarioRepository;
        private final TutorAsignaturaRepository tutorAsignaturaRepository;
        private final NotificacionRepository notificacionRepository;

        /**
         * RF-04: Solicitar Tutoría.
         * Valida que el tutor esté habilitado para la asignatura (tabla
         * tutor_asignatura) y que el horario elegido siga disponible antes
         * de crear la sesión en estado PENDIENTE.
         */
        @Transactional
        public SesionResponse solicitar(SolicitarSesionRequest request, Integer actorId) {
                if (!request.idEstudiante().equals(actorId)) {
                        throw new IllegalStateException("El estudiante autenticado no coincide con la solicitud");
                }

                Estudiante estudiante = estudianteRepository.findById(request.idEstudiante())
                                .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado"));
                Tutor tutor = tutorRepository.findById(request.idTutor())
                                .orElseThrow(() -> new IllegalArgumentException("Tutor no encontrado"));
                Asignatura asignatura = asignaturaRepository.findById(request.idAsignatura())
                                .orElseThrow(() -> new IllegalArgumentException("Asignatura no encontrada"));
                Horario horario = horarioRepository.findById(request.idHorario())
                                .orElseThrow(() -> new IllegalArgumentException("Horario no encontrado"));

                boolean tutorHabilitado = tutorAsignaturaRepository
                                .findByTutor_Id(tutor.getId())
                                .stream()
                                .anyMatch(ta -> ta.getAsignatura().getId().equals(asignatura.getId()));

                if (!tutorHabilitado) {
                        throw new IllegalStateException("El tutor no está habilitado para esta asignatura");
                }

                if (!Boolean.TRUE.equals(horario.getDisponible())) {
                        throw new IllegalStateException("El bloque de horario ya no está disponible");
                }

                Sesion sesion = Sesion.builder()
                                .estudiante(estudiante)
                                .tutor(tutor)
                                .asignatura(asignatura)
                                .horario(horario)
                                .fechaSesion(request.fecha())
                                .horaInicio(request.horaInicio())
                                .horaFin(request.horaFin())
                                .estado(EstadoSesion.PENDIENTE)
                                .build();

                sesion = sesionRepository.save(sesion);

                horario.setDisponible(false);
                horarioRepository.save(horario);

                notificacionRepository.save(Notificacion.builder()
                                .usuario(tutor.getUsuario())
                                .sesion(sesion)
                                .tipo(TipoNotificacion.APROBACION)
                                .mensaje("Nueva solicitud de tutoría de " + estudiante.getUsuario().getNombres()
                                                + " para " + asignatura.getNombre())
                                .build());

                return SesionResponse.from(sesion);
        }

        /** RF-07: Aceptar o Rechazar Solicitud */
        @Transactional
        public SesionResponse resolverSolicitud(Integer idSesion, boolean aprobar, String justificacion,
                        Integer actorId, boolean coordinator) {
                Sesion sesion = sesionRepository.findById(idSesion)
                                .orElseThrow(() -> new IllegalArgumentException("Sesión no encontrada"));

                if (!coordinator && !sesion.getTutor().getId().equals(actorId)) {
                        throw new IllegalStateException("La sesión no pertenece al tutor autenticado");
                }

                if (sesion.getEstado() != EstadoSesion.PENDIENTE) {
                        throw new IllegalStateException("Solo se pueden resolver solicitudes PENDIENTES");
                }

                sesion.setEstado(aprobar ? EstadoSesion.APROBADA : EstadoSesion.RECHAZADA);

                if (!aprobar && sesion.getHorario() != null) {
                        Horario horario = sesion.getHorario();
                        horario.setDisponible(true);
                        horarioRepository.save(horario);
                }

                sesion = sesionRepository.save(sesion);

                notificacionRepository.save(Notificacion.builder()
                                .usuario(sesion.getEstudiante().getUsuario())
                                .sesion(sesion)
                                .tipo(aprobar ? TipoNotificacion.APROBACION : TipoNotificacion.RECHAZO)
                                .mensaje(aprobar
                                                ? "Tu solicitud fue aprobada."
                                                : "Tu solicitud fue rechazada."
                                                                + (justificacion != null ? " Motivo: " + justificacion
                                                                                : ""))
                                .build());

                return SesionResponse.from(sesion);
        }

        /** Cancelar sesión -- solo en PENDIENTE o APROBADA. */
        @Transactional
        public SesionResponse cancelar(Integer idSesion, Integer actorId, boolean coordinator) {
                Sesion sesion = sesionRepository.findById(idSesion)
                                .orElseThrow(() -> new IllegalArgumentException("Sesión no encontrada"));

                boolean participante = sesion.getEstudiante().getId().equals(actorId)
                                || sesion.getTutor().getId().equals(actorId);
                if (!coordinator && !participante) {
                        throw new IllegalStateException("La sesión no pertenece al usuario autenticado");
                }

                if (sesion.getEstado() != EstadoSesion.PENDIENTE && sesion.getEstado() != EstadoSesion.APROBADA) {
                        throw new IllegalStateException("Solo se puede cancelar una sesión PENDIENTE o APROBADA");
                }

                sesion.setEstado(EstadoSesion.CANCELADA);

                if (sesion.getHorario() != null) {
                        Horario horario = sesion.getHorario();
                        horario.setDisponible(true);
                        horarioRepository.save(horario);
                }

                return SesionResponse.from(sesionRepository.save(sesion));
        }

        /**
         * RF-08: Registrar Observaciones y Evaluar Progreso -- marca la sesión como
         * COMPLETADA.
         */
        @Transactional
        public SesionResponse registrarSeguimiento(Integer idSesion, Boolean asistencia, String observaciones,
                        java.math.BigDecimal calificacion, Integer actorId,
                        boolean coordinator) {
                Sesion sesion = sesionRepository.findById(idSesion)
                                .orElseThrow(() -> new IllegalArgumentException("Sesión no encontrada"));

                if (!coordinator && !sesion.getTutor().getId().equals(actorId)) {
                        throw new IllegalStateException("La sesión no pertenece al tutor autenticado");
                }

                if (sesion.getEstado() != EstadoSesion.APROBADA) {
                        throw new IllegalStateException("Solo se puede registrar seguimiento de una sesión APROBADA");
                }

                sesion.setAsistencia(asistencia);
                sesion.setObservacionesTutor(observaciones);
                sesion.setCalificacionProgreso(calificacion);
                sesion.setEstado(EstadoSesion.COMPLETADA);

                sesion = sesionRepository.save(sesion);

                notificacionRepository.save(Notificacion.builder()
                                .usuario(sesion.getEstudiante().getUsuario())
                                .sesion(sesion)
                                .tipo(TipoNotificacion.OBSERVACION)
                                .mensaje("Tu tutor registró el seguimiento de la sesión de "
                                                + sesion.getAsignatura().getNombre() + ".")
                                .build());

                return SesionResponse.from(sesion);
        }

        @Transactional(readOnly = true)
        public List<SesionResponse> historialEstudiante(Integer idEstudiante, Integer actorId, boolean coordinator) {
                if (!coordinator && !idEstudiante.equals(actorId)) {
                        throw new IllegalStateException("No puede consultar el historial de otro estudiante");
                }

                return sesionRepository.findByEstudiante_Id(idEstudiante).stream()
                                .map(SesionResponse::from).toList();
        }

        @Transactional(readOnly = true)
        public List<SesionResponse> historialTutor(Integer idTutor, Integer actorId, boolean coordinator) {
                if (!coordinator && !idTutor.equals(actorId)) {
                        throw new IllegalStateException("No puede consultar el historial de otro tutor");
                }

                return sesionRepository.findByTutor_Id(idTutor).stream()
                                .map(SesionResponse::from).toList();
        }

        @Transactional(readOnly = true)
        public List<SesionResponse> pendientesTutor(Integer idTutor, Integer actorId, boolean coordinator) {
                if (!coordinator && !idTutor.equals(actorId)) {
                        throw new IllegalStateException("No puede consultar las solicitudes de otro tutor");
                }

                return sesionRepository.findByTutor_IdAndEstado(idTutor, EstadoSesion.PENDIENTE).stream()
                                .map(SesionResponse::from).toList();
        }
}
