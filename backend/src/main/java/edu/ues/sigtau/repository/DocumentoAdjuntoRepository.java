package edu.ues.sigtau.repository;

import edu.ues.sigtau.model.DocumentoAdjunto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentoAdjuntoRepository extends JpaRepository<DocumentoAdjunto, Integer> {
    List<DocumentoAdjunto> findBySesion_IdOrderByFechaSubidaAsc(Integer idSesion);
    long countBySesion_Id(Integer idSesion);
}
