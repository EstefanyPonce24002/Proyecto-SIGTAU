package edu.ues.sigtau.service;

import edu.ues.sigtau.dto.AsignaturaResponse;
import edu.ues.sigtau.dto.CrearAsignaturaRequest;
import edu.ues.sigtau.model.Asignatura;
import edu.ues.sigtau.repository.AsignaturaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AsignaturaService {

    private final AsignaturaRepository asignaturaRepository;

    @Transactional(readOnly = true)
    public List<AsignaturaResponse> listarTodas() {
        return asignaturaRepository.findAll().stream().map(AsignaturaResponse::from).toList();
    }

    @Transactional
    public AsignaturaResponse crear(CrearAsignaturaRequest request) {
        Asignatura asignatura = Asignatura.builder()
                .nombre(request.nombre())
                .codigo(request.codigo())
                .descripcion(request.descripcion())
                .activa(true)
                .build();
        return AsignaturaResponse.from(asignaturaRepository.save(asignatura));
    }

    @Transactional
    public AsignaturaResponse cambiarEstado(Integer id, boolean activa) {
        Asignatura asignatura = asignaturaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asignatura no encontrada"));
        asignatura.setActiva(activa);
        return AsignaturaResponse.from(asignaturaRepository.save(asignatura));
    }
}
