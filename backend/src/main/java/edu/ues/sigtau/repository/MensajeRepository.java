package edu.ues.sigtau.repository;

import edu.ues.sigtau.model.Mensaje;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MensajeRepository extends JpaRepository<Mensaje, Integer> {
    List<Mensaje> findByRemitente_IdOrDestinatario_IdOrderByFechaEnvioAsc(Integer remitenteId, Integer destinatarioId);
    List<Mensaje> findByDestinatario_IdAndLeidoFalseOrderByFechaEnvioDesc(Integer idUsuario);
}
