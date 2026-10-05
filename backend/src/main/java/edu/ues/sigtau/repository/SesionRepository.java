package edu.ues.sigtau.repository;

import edu.ues.sigtau.model.EstadoSesion;
import edu.ues.sigtau.model.Sesion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface SesionRepository extends JpaRepository<Sesion, Integer> {
    List<Sesion> findByEstudiante_Id(Integer idEstudiante);
    List<Sesion> findByTutor_Id(Integer idTutor);
    List<Sesion> findByTutor_IdAndEstado(Integer idTutor, EstadoSesion estado);
    List<Sesion> findByEstado(EstadoSesion estado);
    List<Sesion> findByFechaSesionBetween(LocalDate inicio, LocalDate fin);
}
