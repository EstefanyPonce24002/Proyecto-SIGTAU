package edu.ues.sigtau.repository;

import edu.ues.sigtau.model.TutorAsignatura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TutorAsignaturaRepository
        extends JpaRepository<TutorAsignatura, TutorAsignatura.TutorAsignaturaId> {

    // Tutores habilitados para una asignatura -- resuelve RF-05
    List<TutorAsignatura> findByAsignatura_Id(Integer idAsignatura);

    // Asignaturas que puede impartir un tutor -- resuelve parte de RF-12
    List<TutorAsignatura> findByTutor_Id(Integer idTutor);
}
