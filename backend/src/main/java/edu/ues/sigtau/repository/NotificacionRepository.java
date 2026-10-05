package edu.ues.sigtau.repository;

import edu.ues.sigtau.model.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Integer> {
    List<Notificacion> findByUsuario_IdOrderByFechaEnvioDesc(Integer idUsuario);
    List<Notificacion> findByUsuario_IdAndLeidaFalse(Integer idUsuario);
}
