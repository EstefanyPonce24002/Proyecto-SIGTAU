package edu.ues.sigtau.repository;

import edu.ues.sigtau.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Integer> {
    Optional<PasswordResetToken> findByTokenAndUsadoFalse(String token);
    void deleteByUsuario_IdAndUsadoFalse(Integer idUsuario);
}
