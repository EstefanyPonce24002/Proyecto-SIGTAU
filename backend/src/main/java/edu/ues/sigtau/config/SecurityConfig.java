package edu.ues.sigtau.config;

import edu.ues.sigtau.security.CustomUserDetailsService;
import edu.ues.sigtau.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthFilter jwtAuthFilter;

    @Value("${sigtau.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // API stateless con JWT; CSRF no aplica igual que en sesiones basadas en
                                              // cookies
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // Rutas públicas: login y recuperación de contraseña
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/forgot-password", "/api/auth/reset-password").permitAll()
                        // Registrar usuarios es una operación administrativa (RF-01/RF-12 vía
                        // GestionUsuarios.tsx)
                        .requestMatchers("/api/auth/registro").hasRole("COORDINADOR")
                        .requestMatchers("/api/usuarios/**").hasRole("COORDINADOR")
                        .requestMatchers("/api/reportes/**").hasRole("COORDINADOR")
                        .requestMatchers("/h2-console/**").permitAll() // solo perfil dev

                        // Catálogos de lectura para solicitar tutoría.
                        .requestMatchers(HttpMethod.GET, "/api/asignaturas", "/api/asignaturas/*/tutores",
                                "/api/tutores/*/horarios")
                        .hasAnyRole("ESTUDIANTE", "TUTOR", "COORDINADOR")
                        .requestMatchers(HttpMethod.GET, "/api/asignaturas/todas")
                        .hasRole("COORDINADOR")
                        .requestMatchers(HttpMethod.POST, "/api/asignaturas")
                        .hasRole("COORDINADOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/asignaturas/*/estado")
                        .hasRole("COORDINADOR")

                        // Administración del catálogo y gestión de horarios.
                        .requestMatchers(HttpMethod.POST, "/api/asignaturas/*/tutores/*")
                        .hasRole("COORDINADOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/asignaturas/*/tutores/*")
                        .hasRole("COORDINADOR")
                        .requestMatchers(HttpMethod.GET, "/api/tutores")
                        .hasAnyRole("TUTOR", "COORDINADOR")
                        .requestMatchers(HttpMethod.GET, "/api/horarios/tutor/*")
                        .hasAnyRole("TUTOR", "COORDINADOR")
                        .requestMatchers(HttpMethod.POST, "/api/horarios")
                        .hasAnyRole("TUTOR", "COORDINADOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/horarios/*")
                        .hasAnyRole("TUTOR", "COORDINADOR")

                        // Flujo de tutorías.
                        .requestMatchers(HttpMethod.POST, "/api/sesiones")
                        .hasRole("ESTUDIANTE")
                        .requestMatchers(HttpMethod.PATCH, "/api/sesiones/*/resolver", "/api/sesiones/*/seguimiento")
                        .hasAnyRole("TUTOR", "COORDINADOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/sesiones/*/cancelar")
                        .hasAnyRole("ESTUDIANTE", "TUTOR", "COORDINADOR")
                        .requestMatchers(HttpMethod.GET, "/api/sesiones/estudiante/*")
                        .hasAnyRole("ESTUDIANTE", "COORDINADOR")
                        .requestMatchers(HttpMethod.GET, "/api/sesiones")
                                .hasRole("COORDINADOR")
                        .requestMatchers(HttpMethod.GET, "/api/sesiones/tutor/*", "/api/sesiones/tutor/*/pendientes")
                        .hasAnyRole("TUTOR", "COORDINADOR")

                        .requestMatchers("/api/notificaciones/**")
                        .hasAnyRole("ESTUDIANTE", "TUTOR", "COORDINADOR")

                        .anyRequest().authenticated())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin())); // para H2 console en dev

        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
