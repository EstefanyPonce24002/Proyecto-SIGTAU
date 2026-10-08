package edu.ues.sigtau.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${sigtau.mail.from}") private String from;
    @Value("${sigtau.frontend-url}") private String frontendUrl;

    public void enviarRecuperacion(String destinatario, String nombre, String token) {
        String enlace = frontendUrl + "/restablecer?token=" +
                java.net.URLEncoder.encode(token, java.nio.charset.StandardCharsets.UTF_8);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(destinatario);
        message.setSubject("SIGTAU - Recuperación de contraseña");
        message.setText("Hola " + nombre + ",\n\n" +
                "Recibimos una solicitud para restablecer tu contraseña de SIGTAU.\n\n" +
                "Usa este enlace para crear una nueva contraseña:\n" + enlace + "\n\n" +
                "El enlace vence en 30 minutos y solo puede utilizarse una vez.\n\n" +
                "Si no solicitaste este cambio, puedes ignorar este correo.\n\nSIGTAU");
        mailSender.send(message);
    }
}