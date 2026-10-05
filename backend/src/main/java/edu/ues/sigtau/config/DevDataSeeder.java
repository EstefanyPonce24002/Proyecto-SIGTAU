package edu.ues.sigtau.config;

import edu.ues.sigtau.model.*;
import edu.ues.sigtau.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Crea datos de prueba al arrancar en el perfil "dev" (base H2 en
 * memoria), ya que esta se recrea vacía en cada arranque. Solo corre
 * en dev -- en "prod" los datos reales vienen de database/schema.sql
 * y database/seed.sql (o de los propios usuarios registrándose).
 *
 * Credenciales de prueba (todas con la misma contraseña: "Prueba123"):
 * maria.gomez@universidad.edu.sv (ESTUDIANTE)
 * andres.ramirez@universidad.edu.sv (TUTOR)
 * coordinacion@universidad.edu.sv (COORDINADOR)
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevDataSeeder implements CommandLineRunner {

        private static final String DEMO_PASSWORD = "Prueba123";

        private final UsuarioRepository usuarioRepository;
        private final EstudianteRepository estudianteRepository;
        private final TutorRepository tutorRepository;
        private final AsignaturaRepository asignaturaRepository;
        private final TutorAsignaturaRepository tutorAsignaturaRepository;
        private final HorarioRepository horarioRepository;
        private final PasswordEncoder passwordEncoder;

        @Override
        @Transactional
        public void run(String... args) {
                if (usuarioRepository.count() > 0)
                        return; // ya sembrado (por ejemplo, en un reinicio en caliente)

                String hash = passwordEncoder.encode(DEMO_PASSWORD);

                Usuario estudianteUsuario = usuarioRepository.save(Usuario.builder()
                                .nombres("María Alejandra").apellidos("Gómez")
                                .correo("maria.gomez@universidad.edu.sv")
                                .contrasena(hash).rolUsuario(RolUsuario.ESTUDIANTE).activo(true)
                                .build());

                Usuario tutorUsuario = usuarioRepository.save(Usuario.builder()
                                .nombres("Andrés Gerardo").apellidos("Ramírez")
                                .correo("andres.ramirez@universidad.edu.sv")
                                .contrasena(hash).rolUsuario(RolUsuario.TUTOR).activo(true)
                                .build());

                usuarioRepository.save(Usuario.builder()
                                .nombres("Coordinación").apellidos("Académica")
                                .correo("coordinacion@universidad.edu.sv")
                                .contrasena(hash).rolUsuario(RolUsuario.COORDINADOR).activo(true)
                                .build());

                Estudiante estudiante = estudianteRepository.save(Estudiante.builder()
                                .usuario(estudianteUsuario)
                                .carnet("20230187")
                                .carrera("Ingeniería en Desarrollo de Software")
                                .cicloActual((short) 5)
                                .build());

                Tutor tutor = tutorRepository.save(Tutor.builder()
                                .usuario(tutorUsuario)
                                .especialidad("Matemáticas y Programación")
                                .descripcionPerfil("Docente con experiencia en cálculo y algoritmos.")
                                .fechaVinculacion(LocalDate.of(2023, 1, 15))
                                .build());

                Asignatura calculo = asignaturaRepository.save(Asignatura.builder()
                                .nombre("Cálculo Diferencial").codigo("MAT101").activa(true).build());
                Asignatura progra = asignaturaRepository.save(Asignatura.builder()
                                .nombre("Programación I").codigo("SIS110").activa(true).build());

                tutorAsignaturaRepository.save(TutorAsignatura.builder().tutor(tutor).asignatura(calculo).build());
                tutorAsignaturaRepository.save(TutorAsignatura.builder().tutor(tutor).asignatura(progra).build());

                horarioRepository.save(Horario.builder()
                                .tutor(tutor).diaSemana(DiaSemana.LUNES)
                                .horaInicio(LocalTime.of(14, 0)).horaFin(LocalTime.of(16, 0))
                                .disponible(true).build());
                horarioRepository.save(Horario.builder()
                                .tutor(tutor).diaSemana(DiaSemana.JUEVES)
                                .horaInicio(LocalTime.of(10, 0)).horaFin(LocalTime.of(12, 0))
                                .disponible(true).build());

                System.out.println("=== SIGTAU: datos de prueba creados (perfil dev) ===");
                System.out.println("Contraseña para los 3 usuarios de prueba: " + DEMO_PASSWORD);
        }
}
