package edu.ues.sigtau.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "sesiones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sesion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_sesion")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_estudiante")
    private Estudiante estudiante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_tutor")
    private Tutor tutor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_asignatura")
    private Asignatura asignatura;

    /**
     * NUEVO respecto al diccionario original: enlaza la sesión con el
     * bloque de disponibilidad que ocupa, para poder bloquearlo o
     * liberarlo según el estado de la sesión (ver CU-02).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_horario")
    private Horario horario;

    @Column(name = "fecha_sesion", nullable = false)
    private LocalDate fechaSesion;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    @Builder.Default
    private EstadoSesion estado = EstadoSesion.PENDIENTE;

    @Column(name = "descripcion_dificultades", columnDefinition = "TEXT")
    private String descripcionDificultades;

    @Column(name = "observaciones_tutor", columnDefinition = "TEXT")
    private String observacionesTutor;

    @Column(name = "calificacion_progreso", precision = 3, scale = 1)
    private BigDecimal calificacionProgreso;

    private Boolean asistencia;

    @Column(name = "fecha_solicitud", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime fechaSolicitud = LocalDateTime.now();
}
