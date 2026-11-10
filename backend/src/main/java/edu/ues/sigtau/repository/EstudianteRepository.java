package edu.ues.sigtau.repository;

import edu.ues.sigtau.model.Estudiante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface EstudianteRepository extends JpaRepository<Estudiante, Integer> {
    boolean existsByCarnet(String carnet);

    /** Carreras registradas en los estudiantes, sin repetir (filtro de reportes RF-11). */
    @Query("SELECT DISTINCT e.carrera FROM Estudiante e WHERE e.carrera IS NOT NULL AND TRIM(e.carrera) <> '' ORDER BY e.carrera")
    List<String> findCarrerasDistintas();
}
