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
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MensajeService {

    private final MensajeRepository mensajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final SesionRepository sesionRepository;

    private boolean rolesPermitidos(Usuario a, Usuario b) {
        return (a.getRolUsuario() == RolUsuario.ESTUDIANTE && b.getRolUsuario() == RolUsuario.TUTOR)
                || (a.getRolUsuario() == RolUsuario.TUTOR && b.getRolUsuario() == RolUsuario.ESTUDIANTE);
    }

    @Transactional(readOnly = true)
    public List<ContactoMensajeResponse> contactos(Integer actorId) {
        Usuario actor = usuarioRepository.findById(actorId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (actor.getRolUsuario() != RolUsuario.ESTUDIANTE && actor.getRolUsuario() != RolUsuario.TUTOR) {
            return List.of();
        }

        LinkedHashMap<Integer, Usuario> contactos = new LinkedHashMap<>();
        List<Sesion> sesiones = actor.getRolUsuario() == RolUsuario.ESTUDIANTE
                ? sesionRepository.findByEstudiante_Id(actorId)
                : sesionRepository.findByTutor_Id(actorId);

        for (Sesion sesion : sesiones) {
            Usuario contacto = actor.getRolUsuario() == RolUsuario.ESTUDIANTE
                    ? sesion.getTutor().getUsuario()
                    : sesion.getEstudiante().getUsuario();
            if (Boolean.TRUE.equals(contacto.getActivo()) && rolesPermitidos(actor, contacto)) {
                contactos.put(contacto.getId(), contacto);
            }
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

        if (!rolesPermitidos(remitente, destinatario)) {
            throw new IllegalStateException("La mensajería solo está permitida entre estudiantes y tutores");
        }

        Sesion sesion = null;
        if (request.idSesion() != null) {
            sesion = sesionRepository.findById(request.idSesion())
                    .orElseThrow(() -> new IllegalArgumentException("Sesión no encontrada"));
            Integer estudianteId = sesion.getEstudiante().getUsuario().getId();
            Integer tutorId = sesion.getTutor().getUsuario().getId();
            boolean parejaDeLaSesion = (remitente.getId().equals(estudianteId) && destinatario.getId().equals(tutorId))
                    || (remitente.getId().equals(tutorId) && destinatario.getId().equals(estudianteId));
            if (!parejaDeLaSesion) {
                throw new IllegalStateException("Solo puede escribir al estudiante o tutor de esa sesión");
            }
        } else {
            boolean contactoPermitido = contactos(actorId).stream()
                    .anyMatch(c -> c.id().equals(destinatario.getId()));
            if (!contactoPermitido) {
                throw new IllegalStateException("Solo puede contactar a estudiantes o tutores relacionados con sus tutorías");
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
        Usuario actor = usuarioRepository.findById(actorId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        if (actor.getRolUsuario() != RolUsuario.ESTUDIANTE && actor.getRolUsuario() != RolUsuario.TUTOR) {
            return List.of();
        }

        Set<Integer> contactosPermitidos = contactos(actorId).stream()
                .map(ContactoMensajeResponse::id)
                .collect(Collectors.toSet());
        if (contactoId != null && !contactosPermitidos.contains(contactoId)) {
            return List.of();
        }

        List<Mensaje> mensajes = mensajeRepository.findByRemitente_IdOrDestinatario_IdOrderByFechaEnvioAsc(actorId, actorId);
        return mensajes.stream()
                .filter(m -> {
                    Usuario otro = m.getRemitente().getId().equals(actorId) ? m.getDestinatario() : m.getRemitente();
                    return rolesPermitidos(actor, otro)
                            && contactosPermitidos.contains(otro.getId())
                            && (contactoId == null || otro.getId().equals(contactoId));
                })
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
        if (!rolesPermitidos(mensaje.getRemitente(), mensaje.getDestinatario())) {
            throw new IllegalStateException("Solo se pueden marcar mensajes entre estudiantes y tutores");
        }
        mensaje.setLeido(true);
        mensajeRepository.save(mensaje);
    }
}
