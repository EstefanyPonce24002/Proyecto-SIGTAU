package edu.ues.sigtau.service;

import edu.ues.sigtau.model.EstadoSesion;
import edu.ues.sigtau.model.Notificacion;
import edu.ues.sigtau.model.Sesion;
import edu.ues.sigtau.model.TipoNotificacion;
import edu.ues.sigtau.repository.NotificacionRepository;
import edu.ues.sigtau.repository.SesionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecordatorioService {

    private final SesionRepository sesionRepository;
    private final NotificacionRepository notificacionRepository;

    /**
     * Genera un recordatorio aproximadamente 24 horas antes de cada tutoría
     * aprobada. La consulta se ejecuta cada 10 minutos y el repositorio evita
     * duplicar el recordatorio para cada participante.
     */
    @Scheduled(
            fixedDelayString = "${sigtau.reminders.fixed-delay-ms:600000}",
            initialDelayString = "${sigtau.reminders.initial-delay-ms:60000}"
    )
    @Transactional
    public void generarRecordatorios() {
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime limiteInferior = ahora.plusHours(23);
        LocalDateTime limiteSuperior = ahora.plusHours(25);

        List<Sesion> sesiones = sesionRepository.findByFechaSesionBetween(
                limiteInferior.toLocalDate(),
                limiteSuperior.toLocalDate()
        );

        for (Sesion sesion : sesiones) {
            if (sesion.getEstado() != EstadoSesion.APROBADA) {
                continue;
            }

            LocalDateTime inicio = LocalDateTime.of(sesion.getFechaSesion(), sesion.getHoraInicio());
            if (inicio.isBefore(limiteInferior) || inicio.isAfter(limiteSuperior)) {
                continue;
            }

            String mensaje = "Recordatorio: tienes una tutoría de "
                    + sesion.getAsignatura().getNombre()
                    + " el " + sesion.getFechaSesion()
                    + " de " + sesion.getHoraInicio()
                    + " a " + sesion.getHoraFin() + ".";

            crearSiNoExiste(sesion, sesion.getEstudiante().getUsuario(), mensaje);
            crearSiNoExiste(sesion, sesion.getTutor().getUsuario(), mensaje);
        }
    }

    private void crearSiNoExiste(Sesion sesion, edu.ues.sigtau.model.Usuario usuario, String mensaje) {
        if (notificacionRepository.existsBySesion_IdAndUsuario_IdAndTipo(
                sesion.getId(), usuario.getId(), TipoNotificacion.RECORDATORIO)) {
            return;
        }

        notificacionRepository.save(Notificacion.builder()
                .usuario(usuario)
                .sesion(sesion)
                .tipo(TipoNotificacion.RECORDATORIO)
                .mensaje(mensaje)
                .leida(false)
                .build());
    }
}
