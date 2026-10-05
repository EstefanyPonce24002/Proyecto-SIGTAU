package edu.ues.sigtau.service;

import edu.ues.sigtau.model.Horario;
import edu.ues.sigtau.model.Tutor;
import edu.ues.sigtau.repository.HorarioRepository;
import edu.ues.sigtau.repository.TutorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HorarioServiceAuthorizationTest {

    @Mock
    private HorarioRepository horarioRepository;
    @Mock
    private TutorRepository tutorRepository;

    @InjectMocks
    private HorarioService horarioService;

    @Test
    void rechazaListadoDeHorariosDeOtroTutor() {
        assertThrows(IllegalStateException.class,
                () -> horarioService.listarPorTutor(20, 99, false));
        verifyNoInteractions(horarioRepository);
    }

    @Test
    void rechazaEliminacionDeHorarioDeOtroTutor() {
        Horario horario = Horario.builder()
                .id(1)
                .tutor(Tutor.builder().id(20).build())
                .disponible(true)
                .build();
        when(horarioRepository.findById(1)).thenReturn(Optional.of(horario));

        assertThrows(IllegalStateException.class,
                () -> horarioService.eliminar(1, 99, false));
        verify(horarioRepository).findById(1);
        verifyNoInteractions(tutorRepository);
    }
}
