package edu.ues.sigtau.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "documentos_adjuntos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentoAdjunto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_documento")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_sesion")
    private Sesion sesion;

    @Column(name = "nombre_original", nullable = false, length = 255)
    private String nombreOriginal;

    @Column(name = "ruta_archivo", nullable = false, length = 500)
    private String rutaArchivo;

    @Column(name = "tipo_mime", nullable = false, length = 120)
    private String tipoMime;

    @Column(nullable = false)
    private Long tamanio;

    @Column(name = "fecha_subida", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime fechaSubida = LocalDateTime.now();
}
