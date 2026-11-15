package edu.ues.sigtau.service;

import edu.ues.sigtau.model.RolUsuario;
import edu.ues.sigtau.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Genera correos institucionales de forma centralizada.
 * Un bloqueo transaccional evita duplicados en registros simultáneos.
 */
@Service
@RequiredArgsConstructor
public class CorreoInstitucionalService {

    private static final String DOMINIO = "@sigtau.edu.sv";
    private static final int LONGITUD_MAXIMA_CORREO = 150;

    private final UsuarioRepository usuarioRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(propagation = Propagation.MANDATORY)
    public String generar(String nombres, String apellidos, RolUsuario rol) {
        String nombre = validarYLimpiar(nombres, "nombres");
        String apellido = validarYLimpiar(apellidos, "apellidos");

        String base = switch (rol) {
            case ESTUDIANTE -> (inicial(nombre) + inicial(apellido)).toLowerCase(Locale.ROOT);
            case TUTOR, COORDINADOR -> primerComponente(nombre) + "." + primerComponente(apellido);
        };

        int maximoLocal = LONGITUD_MAXIMA_CORREO - DOMINIO.length();
        if (base.length() > maximoLocal) {
            base = base.substring(0, maximoLocal);
        }

        // Serializa los registros que compiten por la misma dirección base.
        String claveBloqueo = base + DOMINIO;
        jdbcTemplate.query(
                "SELECT pg_advisory_xact_lock(hashtextextended(?, 0))",
                ps -> ps.setString(1, claveBloqueo),
                rs -> null
        );

        String candidato = base + DOMINIO;
        if (!usuarioRepository.existsByCorreoIgnoreCase(candidato)) {
            return candidato;
        }

        for (long correlativo = 1; correlativo < Long.MAX_VALUE; correlativo++) {
            String sufijo = Long.toString(correlativo);
            int longitudBase = Math.max(1, maximoLocal - sufijo.length());
            String baseConSufijo = base.length() > longitudBase
                    ? base.substring(0, longitudBase)
                    : base;
            candidato = baseConSufijo + sufijo + DOMINIO;

            if (!usuarioRepository.existsByCorreoIgnoreCase(candidato)) {
                return candidato;
            }
        }

        throw new IllegalStateException("No fue posible asignar un correo institucional disponible");
    }

    private String validarYLimpiar(String valor, String campo) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El campo " + campo + " es obligatorio");
        }
        return valor.trim().replaceAll("\\s+", " ");
    }

    private String inicial(String texto) {
        String normalizado = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalizado.codePoints()
                .filter(Character::isLetter)
                .findFirst()
                .stream()
                .mapToObj(cp -> new String(Character.toChars(cp)).toUpperCase(Locale.ROOT))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No se pudo generar el correo institucional"));
    }

    private String primerComponente(String texto) {
        String primerComponente = texto.split("\\s+")[0];
        String normalizado = Normalizer.normalize(primerComponente, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]", "");

        if (normalizado.isBlank()) {
            throw new IllegalArgumentException("No se pudo generar el correo institucional");
        }
        return normalizado;
    }
}
