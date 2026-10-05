package edu.ues.sigtau.repository;

import edu.ues.sigtau.model.Estudiante;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EstudianteRepository extends JpaRepository<Estudiante, Integer> {
    boolean existsByCarnet(String carnet);
}
