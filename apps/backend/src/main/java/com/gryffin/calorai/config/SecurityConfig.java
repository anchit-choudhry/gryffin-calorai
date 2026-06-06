package com.gryffin.calorai.config;

import java.util.Arrays;
import java.util.List;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/** Spring Security filter chain and JWT decoder configuration. */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

  private final SecretKey jwtSigningKey;

  @Value("${app.cors.allowed-origins}")
  private String allowedOriginsRaw;

  @Value("${springdoc.api-docs.enabled:false}")
  private boolean swaggerEnabled;

  public SecurityConfig(SecretKey jwtSigningKey) {
    this.jwtSigningKey = jwtSigningKey;
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(csrf -> csrf.disable())
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .headers(headers -> headers
            .frameOptions(frame -> frame.deny())
            .contentTypeOptions(opts -> {
            })
            .httpStrictTransportSecurity(hsts -> hsts
                .includeSubDomains(true)
                .maxAgeInSeconds(31536000))
            .referrerPolicy(referrer -> referrer
                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
            .contentSecurityPolicy(csp -> csp
                .policyDirectives("default-src 'none'; frame-ancestors 'none'"))
        )
        .authorizeHttpRequests(auth -> {
          auth.requestMatchers(HttpMethod.POST, "/v1/auth/token", "/v1/auth/refresh")
              .permitAll();
          auth.requestMatchers(HttpMethod.GET, "/v1/ping").permitAll();
          auth.requestMatchers("/actuator/health", "/actuator/info").permitAll();
          if (swaggerEnabled) {
            auth.requestMatchers("/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll();
          }
          auth.anyRequest().authenticated();
        })
        .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.decoder(jwtDecoder())));

    return http.build();
  }

  @Bean
  public JwtDecoder jwtDecoder() {
    NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(jwtSigningKey).build();
    OAuth2TokenValidator<Jwt> typeValidator = new JwtClaimValidator<>("type", "access"::equals);
    decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
        JwtValidators.createDefault(), typeValidator
    ));
    return decoder;
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    var config = new CorsConfiguration();
    config.setAllowedOrigins(
        Arrays.stream(allowedOriginsRaw.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList()
    );
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);

    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
