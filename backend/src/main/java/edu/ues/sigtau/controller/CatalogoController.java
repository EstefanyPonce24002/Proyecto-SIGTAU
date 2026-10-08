package edu.ues.sigtau.controller;

import edu.ues.sigtau.dto.AsignaturaResponse;
import edu.ues.sigtau.dto.HorarioResponse;
import edu.ues.sigtau.dto.TutorResponse;
import edu.ues.sigtau.model.Asignatura;
import edu.ues.sigtau.model.Tutor;
import edu.ues.sigtau.model.TutorAsignatura;
import edu.ues.sigtau.repository.AsignaturaRepository;
import edu.ues.sigtau.repository.HorarioRepository;
import edu.ues.sigtau.repository.TutorAsignaturaRepository;
import edu.ues.sigtau.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints que alimentan los selects en cascada de SolicitudTutoria.tsx
 * (asignatura -> tutores habilitados -> horarios disponibles) y la
 * gestión de asignación tutor-asignatura de Asignaturas.tsx (RF-05, RF-12).
 */
@RestController
@RequiredArgsConstructor
public class CatalogoController {

    private final AsignaturaRepository asignaturaRepository;
    private final TutorRepository tutorRepository;
    private final TutorAsignaturaRepository tutorAsignaturaRepository;
    private final HorarioRepository horarioRepository;

    /** RF-04 (paso 1): asignaturas activas disponibles para solicitar tutoría. */
    @GetMapping("/api/asignaturas")
    public ResponseEntity<List<AsignaturaResponse>> listarAsignaturas() {
        List<AsignaturaResponse> resultado = asignaturaRepository.findByActivaTrue().stream()
                .map(AsignaturaResponse::from)
                .toList();
        return ResponseEntity.ok(resultado);
    }

    /** RF-05: tutores habilitados (tabla tutor_asignatura) para una asignatura. */
    @GetMapping("/api/asignaturas/{idAsignatura}/tutores")
    public ResponseEntity<List<TutorResponse>> tutoresPorAsignatura(@PathVariable Integer idAsignatura) {
        List<TutorResponse> resultado = tutorAsignaturaRepository.findByAsignatura_Id(idAsignatura).stream()
                .map(ta -> TutorResponse.from(ta.getTutor()))
                .toList();
        return ResponseEntity.ok(resultado);
    }

    /** RF-12: asignar un tutor a una asignatura. */
    @PostMapping("/api/asignaturas/{idAsignatura}/tutores/{idTutor}")
    @Transactional
    public ResponseEntity<Void> asignarTutor(@PathVariable Integer idAsignatura, @PathVariable Integer idTutor) {
        Asignatura asignatura = asignaturaRepository.findById(idAsignatura)
                .orElseThrow(() -> new IllegalArgumentException("Asignatura no encontrada"));
        Tutor tutor = tutorRepository.findById(idTutor)
                .orElseThrow(() -> new IllegalArgumentException("Tutor no encontrado"));

        if (!Boolean.TRUE.equals(asignatura.getActiva())) {
            throw new IllegalStateException("No se puede asignar un tutor a una asignatura inactiva");
        }
        if (tutor.getUsuario() == null || !Boolean.TRUE.equals(tutor.getUsuario().getActivo())) {
            throw new IllegalStateException("No se puede asignar un tutor inactivo");
        }

        boolean yaAsignado = tutorAsignaturaRepository.findByTutor_Id(idTutor).stream()
                .anyMatch(ta -> ta.getAsignatura().getId().equals(idAsignatura));
        if (yaAsignado) {
            return ResponseEntity.ok().build();
        }

        tutorAsignaturaRepository.save(TutorAsignatura.builder().tutor(tutor).asignatura(asignatura).build());
        return ResponseEntity.status(201).build();
    }

    /** RF-12: quitar un tutor de una asignatura. */
    @DeleteMapping("/api/asignaturas/{idAsignatura}/tutores/{idTutor}")
    @Transactional
    public ResponseEntity<Void> quitarTutor(@PathVariable Integer idAsignatura, @PathVariable Integer idTutor) {
        tutorAsignaturaRepository.deleteById(
                new TutorAsignatura.TutorAsignaturaId(idTutor, idAsignatura));
        return ResponseEntity.noContent().build();
    }

    /** Lista completa de tutores (para el selector de "agregar tutor" en Asignaturas.tsx). */
    @GetMapping("/api/tutores")
    public ResponseEntity<List<TutorResponse>> listarTodosLosTutores() {
        List<TutorResponse> resultado = tutorRepository.findAll().stream()
                .map(TutorResponse::from)
                .toList();
        return ResponseEntity.ok(resultado);
    }

    /** RF-05: bloques de horario disponibles (no bloqueados) de un tutor. */
    @GetMapping("/api/tutores/{idTutor}/horarios")
    public ResponseEntity<List<HorarioResponse>> horariosDisponibles(@PathVariable Integer idTutor) {
        List<HorarioResponse> resultado = horarioRepository.findByTutor_IdAndDisponibleTrue(idTutor).stream()
                .map(HorarioResponse::from)
                .toList();
        return ResponseEntity.ok(resultado);
    }
}

