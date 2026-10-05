package edu.ues.sigtau.repository;

import edu.ues.sigtau.model.Asignatura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AsignaturaRepository extends JpaRepository<Asignatura, Integer> {
    List<Asignatura> findByActivaTrue();
}
