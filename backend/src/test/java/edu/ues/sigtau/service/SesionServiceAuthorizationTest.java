package edu.ues.sigtau.service;

import edu.ues.sigtau.model.EstadoSesion;
import edu.ues.sigtau.model.Sesion;
import edu.ues.sigtau.model.Tutor;
import edu.ues.sigtau.repository.AsignaturaRepository;
import edu.ues.sigtau.repository.EstudianteRepository;
import edu.ues.sigtau.repository.HorarioRepository;
import edu.ues.sigtau.repository.NotificacionRepository;
import edu.ues.sigtau.repository.SesionRepository;
import edu.ues.sigtau.repository.TutorAsignaturaRepository;
import edu.ues.sigtau.repository.TutorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
class SesionServiceAuthorizationTest {

    @Mock
    private SesionRepository sesionRepository;
    @Mock
    private EstudianteRepository estudianteRepository;
    @Mock
    private TutorRepository tutorRepository;
    @Mock
    private AsignaturaRepository asignaturaRepository;
    @Mock
    private HorarioRepository horarioRepository;
    @Mock
    private TutorAsignaturaRepository tutorAsignaturaRepository;
    @Mock
    private NotificacionRepository notificacionRepository;

    @InjectMocks
    private SesionService sesionService;

    @Test
    void rechazaSolicitudCuandoElEstudianteNoCoincideConElActor() {
        var request = new edu.ues.sigtau.dto.SolicitarSesionRequest(
                10, 20, 30, 40, java.time.LocalDate.now(),
                java.time.LocalTime.of(8, 0), java.time.LocalTime.of(9, 0), "Necesito apoyo");

        assertThrows(IllegalStateException.class, () -> sesionService.solicitar(request, 99));
        verifyNoInteractions(estudianteRepository, tutorRepository, asignaturaRepository,
                horarioRepository, sesionRepository, notificacionRepository);
    }

    @Test
    void rechazaSolicitudCuandoFechaNoCoincideConHorario() {
        var usuarioTutor = edu.ues.sigtau.model.Usuario.builder()
                .id(20)
                .activo(true)
                .build();
        var tutor = Tutor.builder().id(20).usuario(usuarioTutor).build();
        var estudiante = edu.ues.sigtau.model.Estudiante.builder().id(10).build();
        var asignatura = edu.ues.sigtau.model.Asignatura.builder()
                .id(30)
                .activa(true)
                .build();
        var horario = edu.ues.sigtau.model.Horario.builder()
                .id(40)
                .tutor(tutor)
                .diaSemana(edu.ues.sigtau.model.DiaSemana.LUNES)
                .horaInicio(java.time.LocalTime.of(8, 0))
                .horaFin(java.time.LocalTime.of(9, 0))
                .disponible(true)
                .build();

        when(estudianteRepository.findById(10)).thenReturn(Optional.of(estudiante));
        when(tutorRepository.findById(20)).thenReturn(Optional.of(tutor));
        when(asignaturaRepository.findById(30)).thenReturn(Optional.of(asignatura));
        when(horarioRepository.findById(40)).thenReturn(Optional.of(horario));
        when(tutorAsignaturaRepository.findByTutor_Id(20)).thenReturn(List.of(
                edu.ues.sigtau.model.TutorAsignatura.builder()
                        .tutor(tutor)
                        .asignatura(asignatura)
                        .build()));

        var request = new edu.ues.sigtau.dto.SolicitarSesionRequest(
                10, 20, 30, 40,
                java.time.LocalDate.of(2026, 10, 7),
                java.time.LocalTime.of(8, 0),
                java.time.LocalTime.of(9, 0),
                "Necesito apoyo");

        assertThrows(IllegalStateException.class, () -> sesionService.solicitar(request, 10));
        verify(sesionRepository, never()).save(any());
        verify(notificacionRepository, never()).save(any());
    }

    @Test
    void rechazaHistorialDeOtroEstudiante() {
        assertThrows(IllegalStateException.class,
                () -> sesionService.historialEstudiante(10, 99, false));
        verifyNoInteractions(sesionRepository);
    }

    @Test
    void rechazaResolverSesionDeOtroTutor() {
        Sesion sesion = Sesion.builder()
                .id(1)
                .estado(EstadoSesion.PENDIENTE)
                .tutor(Tutor.builder().id(20).build())
                .build();
        when(sesionRepository.findById(1)).thenReturn(Optional.of(sesion));

        assertThrows(IllegalStateException.class,
                () -> sesionService.resolverSolicitud(1, true, null, 99, false));
        verify(sesionRepository).findById(1);
        verifyNoInteractions(horarioRepository, notificacionRepository);
    }

    @Test
    void permiteConsultaDeHistorialAlCoordinador() {
        when(sesionRepository.findByEstudiante_Id(10)).thenReturn(List.of());

        sesionService.historialEstudiante(10, 99, true);

        verify(sesionRepository).findByEstudiante_Id(10);
    }
}
