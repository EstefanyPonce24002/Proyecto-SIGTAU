package edu.ues.sigtau.service;

import edu.ues.sigtau.dto.NotificacionResponse;
import edu.ues.sigtau.model.Notificacion;
import edu.ues.sigtau.repository.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;

    @Transactional(readOnly = true)
    public List<NotificacionResponse> listarPropias(Integer idUsuario) {
        return notificacionRepository.findByUsuario_IdOrderByFechaEnvioDesc(idUsuario).stream()
                .map(NotificacionResponse::from)
                .toList();
    }

    @Transactional
    public NotificacionResponse marcarLeida(Integer idNotificacion, Integer idUsuario) {
        Notificacion notificacion = notificacionRepository.findById(idNotificacion)
                .orElseThrow(() -> new IllegalArgumentException("Notificación no encontrada"));

        if (!notificacion.getUsuario().getId().equals(idUsuario)) {
            throw new IllegalStateException("Esta notificación no pertenece al usuario autenticado");
        }

        notificacion.setLeida(true);
        return NotificacionResponse.from(notificacionRepository.save(notificacion));
    }

    @Transactional
    public void marcarTodasLeidas(Integer idUsuario) {
        List<Notificacion> pendientes = notificacionRepository.findByUsuario_IdAndLeidaFalse(idUsuario);
        pendientes.forEach(n -> n.setLeida(true));
        notificacionRepository.saveAll(pendientes);
    }
}
