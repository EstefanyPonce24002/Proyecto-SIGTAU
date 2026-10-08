package edu.ues.sigtau.service;

import edu.ues.sigtau.dto.ContactoMensajeResponse;
import edu.ues.sigtau.dto.EnviarMensajeRequest;
import edu.ues.sigtau.dto.MensajeResponse;
import edu.ues.sigtau.model.Mensaje;
import edu.ues.sigtau.model.RolUsuario;
import edu.ues.sigtau.model.Sesion;
import edu.ues.sigtau.model.Usuario;
import edu.ues.sigtau.repository.MensajeRepository;
import edu.ues.sigtau.repository.SesionRepository;
import edu.ues.sigtau.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MensajeService {

    private final MensajeRepository mensajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final SesionRepository sesionRepository;

    @Transactional(readOnly = true)
    public List<ContactoMensajeResponse> contactos(Integer actorId) {
        Usuario actor = usuarioRepository.findById(actorId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        LinkedHashMap<Integer, Usuario> contactos = new LinkedHashMap<>();

        if (actor.getRolUsuario() == RolUsuario.COORDINADOR) {
            usuarioRepository.findByActivoTrueAndRolUsuario(RolUsuario.ESTUDIANTE).forEach(u -> contactos.put(u.getId(), u));
            usuarioRepository.findByActivoTrueAndRolUsuario(RolUsuario.TUTOR).forEach(u -> contactos.put(u.getId(), u));
            usuarioRepository.findByActivoTrueAndRolUsuario(RolUsuario.COORDINADOR).forEach(u -> {
                if (!u.getId().equals(actorId)) contactos.put(u.getId(), u);
            });
        } else {
            List<Sesion> sesiones = actor.getRolUsuario() == RolUsuario.ESTUDIANTE
                    ? sesionRepository.findByEstudiante_Id(actorId)
                    : sesionRepository.findByTutor_Id(actorId);

            for (Sesion sesion : sesiones) {
                Usuario contacto = actor.getRolUsuario() == RolUsuario.ESTUDIANTE
                        ? sesion.getTutor().getUsuario()
                        : sesion.getEstudiante().getUsuario();
                if (Boolean.TRUE.equals(contacto.getActivo())) contactos.put(contacto.getId(), contacto);
            }

            usuarioRepository.findByActivoTrueAndRolUsuario(RolUsuario.COORDINADOR)
                    .forEach(u -> contactos.put(u.getId(), u));
        }

        return contactos.values().stream()
                .sorted((a, b) -> (a.getNombres() + a.getApellidos())
                        .compareToIgnoreCase(b.getNombres() + b.getApellidos()))
                .map(ContactoMensajeResponse::from)
                .toList();
    }

    @Transactional
    public MensajeResponse enviar(EnviarMensajeRequest request, Integer actorId, boolean coordinator) {
        Usuario remitente = usuarioRepository.findById(actorId)
                .orElseThrow(() -> new IllegalArgumentException("Remitente no encontrado"));
        Usuario destinatario = usuarioRepository.findById(request.idDestinatario())
                .filter(Usuario::getActivo)
                .orElseThrow(() -> new IllegalArgumentException("Destinatario no encontrado o inactivo"));

        if (remitente.getId().equals(destinatario.getId())) {
            throw new IllegalArgumentException("No puede enviarse un mensaje a sí mismo");
        }

        Sesion sesion = null;
        if (request.idSesion() != null) {
            sesion = sesionRepository.findById(request.idSesion())
                    .orElseThrow(() -> new IllegalArgumentException("Sesión no encontrada"));

            boolean participante = sesion.getEstudiante().getUsuario().getId().equals(actorId)
                    || sesion.getTutor().getUsuario().getId().equals(actorId);
            if (!coordinator && !participante) {
                throw new IllegalStateException("No tiene acceso a la sesión indicada");
            }

            boolean destinatarioParticipa = sesion.getEstudiante().getUsuario().getId().equals(destinatario.getId())
                    || sesion.getTutor().getUsuario().getId().equals(destinatario.getId());
            if (!coordinator && !destinatarioParticipa && destinatario.getRolUsuario() != RolUsuario.COORDINADOR) {
                throw new IllegalStateException("El destinatario no participa en la sesión indicada");
            }
        } else if (!coordinator && destinatario.getRolUsuario() != RolUsuario.COORDINADOR) {
            boolean contactoPermitido = contactos(actorId).stream()
                    .anyMatch(c -> c.id().equals(destinatario.getId()));
            if (!contactoPermitido) {
                throw new IllegalStateException("Solo puede contactar a usuarios relacionados con sus tutorías o coordinadores");
            }
        }

        Mensaje mensaje = Mensaje.builder()
                .remitente(remitente)
                .destinatario(destinatario)
                .sesion(sesion)
                .contenido(request.contenido().trim())
                .leido(false)
                .build();

        return MensajeResponse.from(mensajeRepository.save(mensaje));
    }

    @Transactional(readOnly = true)
    public List<MensajeResponse> listar(Integer actorId, Integer contactoId, boolean coordinator) {
        List<Mensaje> mensajes = mensajeRepository.findByRemitente_IdOrDestinatario_IdOrderByFechaEnvioAsc(actorId, actorId);
        return mensajes.stream()
                .filter(m -> contactoId == null
                        || (m.getRemitente().getId().equals(contactoId) && m.getDestinatario().getId().equals(actorId))
                        || (m.getDestinatario().getId().equals(contactoId) && m.getRemitente().getId().equals(actorId)))
                .map(MensajeResponse::from)
                .toList();
    }

    @Transactional
    public void marcarLeido(Integer idMensaje, Integer actorId) {
        Mensaje mensaje = mensajeRepository.findById(idMensaje)
                .orElseThrow(() -> new IllegalArgumentException("Mensaje no encontrado"));
        if (!mensaje.getDestinatario().getId().equals(actorId)) {
            throw new IllegalStateException("No puede modificar un mensaje que no recibió");
        }
        mensaje.setLeido(true);
        mensajeRepository.save(mensaje);
    }
}
