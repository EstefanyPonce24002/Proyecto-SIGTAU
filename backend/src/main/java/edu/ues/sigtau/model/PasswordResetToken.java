package edu.ues.sigtau.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * NUEVA: tabla no contemplada en el diccionario de datos original.
 * Necesaria para implementar RF-03 (Recuperar Contraseña) con un
 * enlace temporal real, de un solo uso y con expiración -- tal
 * como lo exige el RNF de seguridad del informe.
 */
@Entity
@Table(name = "password_reset_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_token")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(nullable = false, unique = true, length = 255)
    private String token;

    @Column(nullable = false)
    @Builder.Default
    private Boolean usado = false;

    @Column(name = "expira_en", nullable = false)
    private LocalDateTime expiraEn;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime creadoEn = LocalDateTime.now();
}
