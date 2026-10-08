package edu.ues.sigtau.service;

import edu.ues.sigtau.dto.CrearHorarioRequest;
import edu.ues.sigtau.dto.HorarioResponse;
import edu.ues.sigtau.model.Horario;
import edu.ues.sigtau.model.Tutor;
import edu.ues.sigtau.repository.HorarioRepository;
import edu.ues.sigtau.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HorarioService {

    private final HorarioRepository horarioRepository;
    private final TutorRepository tutorRepository;

    @Transactional(readOnly = true)
    public List<HorarioResponse> listarPorTutor(Integer idTutor, Integer actorId, boolean coordinator) {
        ensureTutorAccess(idTutor, actorId, coordinator);
        return horarioRepository.findByTutor_Id(idTutor).stream()
                .map(HorarioResponse::from)
                .toList();
    }

    /**
     * RF-06: valida que el nuevo bloque no se superponga con uno existente del
     * mismo tutor y día.
     */
    @Transactional
    public HorarioResponse crear(CrearHorarioRequest request, Integer actorId, boolean coordinator) {
        ensureTutorAccess(request.idTutor(), actorId, coordinator);
        Tutor tutor = tutorRepository.findById(request.idTutor())
                .orElseThrow(() -> new IllegalArgumentException("Tutor no encontrado"));

        if (!request.horaFin().isAfter(request.horaInicio())) {
            throw new IllegalArgumentException("La hora de fin debe ser posterior a la hora de inicio");
        }

        boolean solapa = horarioRepository.findByTutor_Id(tutor.getId()).stream()
                .filter(h -> h.getDiaSemana() == request.diaSemana())
                .anyMatch(h -> request.horaInicio().isBefore(h.getHoraFin())
                        && h.getHoraInicio().isBefore(request.horaFin()));

        if (solapa) {
            throw new IllegalStateException("El bloque se superpone con un horario ya registrado ese día");
        }

        Horario horario = Horario.builder()
                .tutor(tutor)
                .diaSemana(request.diaSemana())
                .horaInicio(request.horaInicio())
                .horaFin(request.horaFin())
                .disponible(true)
                .build();

        return HorarioResponse.from(horarioRepository.save(horario));
    }

    /**
     * No permite eliminar un bloque que ya está bloqueado por una sesión
     * aprobada/pendiente.
     */
    @Transactional
    public void eliminar(Integer idHorario, Integer actorId, boolean coordinator) {
        Horario horario = horarioRepository.findById(idHorario)
                .orElseThrow(() -> new IllegalArgumentException("Horario no encontrado"));

        ensureTutorAccess(horario.getTutor().getId(), actorId, coordinator);

        if (!Boolean.TRUE.equals(horario.getDisponible())) {
            throw new IllegalStateException("No se puede eliminar un bloque que tiene una sesión asociada");
        }

        horarioRepository.delete(horario);
    }

    private void ensureTutorAccess(Integer idTutor, Integer actorId, boolean coordinator) {
        if (!coordinator && !idTutor.equals(actorId)) {
            throw new IllegalStateException("El horario no pertenece al tutor autenticado");
        }

        if (!coordinator) {
            Tutor tutor = tutorRepository.findById(idTutor)
                    .orElseThrow(() -> new IllegalArgumentException("Tutor no encontrado"));
            if (tutor.getUsuario() == null || !Boolean.TRUE.equals(tutor.getUsuario().getActivo())) {
                throw new IllegalStateException("El tutor no está activo");
            }
        }
    }
}
