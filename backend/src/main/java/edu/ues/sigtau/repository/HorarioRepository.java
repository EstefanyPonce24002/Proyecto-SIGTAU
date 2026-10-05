package edu.ues.sigtau.repository;

import edu.ues.sigtau.model.Horario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HorarioRepository extends JpaRepository<Horario, Integer> {
    List<Horario> findByTutor_IdAndDisponibleTrue(Integer idTutor);
    List<Horario> findByTutor_Id(Integer idTutor);
}
