package edu.ues.sigtau.model;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

/**
 * Tabla de relación N:M entre tutores y asignaturas.
 * NUEVA respecto al diccionario de datos original: sin esta tabla
 * no era posible resolver RF-05 (consultar disponibilidad de tutores
 * por asignatura) ni RF-12 (asignar tutores a asignaturas).
 */
@Entity
@Table(name = "tutor_asignatura")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(TutorAsignatura.TutorAsignaturaId.class)
public class TutorAsignatura {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tutor")
    private Tutor tutor;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_asignatura")
    private Asignatura asignatura;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TutorAsignaturaId implements Serializable {
        private Integer tutor;
        private Integer asignatura;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof TutorAsignaturaId)) return false;
            TutorAsignaturaId that = (TutorAsignaturaId) o;
            return Objects.equals(tutor, that.tutor) && Objects.equals(asignatura, that.asignatura);
        }

        @Override
        public int hashCode() {
            return Objects.hash(tutor, asignatura);
        }
    }
}
