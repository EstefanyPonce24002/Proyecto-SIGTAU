package edu.ues.sigtau.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Extiende Usuario con datos académicos. La PK de esta tabla
 * (id_estudiante) ES la FK hacia usuarios.id_usuario -- no existe
 * una columna separada duplicada, tal como se corrigió en el
 * diccionario de datos v2.
 */
@Entity
@Table(name = "estudiante")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Estudiante {

    @Id
    @Column(name = "id_estudiante")
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id_estudiante")
    private Usuario usuario;

    @Column(nullable = false, unique = true, length = 20)
    private String carnet;

    @Column(length = 150)
    private String carrera;

    @Column(name = "ciclo_actual")
    private Short cicloActual;
}
