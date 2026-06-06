package com.gryffin.calorai;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Integration smoke test - requires Docker; skipped in CI unless DOCKER_AVAILABLE=true. */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@EnabledIfEnvironmentVariable(named = "DOCKER_AVAILABLE", matches = "true")
class CaloraiApplicationTests {

  @Container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18-alpine")
      .withDatabaseName("calorai_test")
      .withUsername("calorai")
      .withPassword("calorai");

  @DynamicPropertySource
  static void configureProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
    registry.add("app.jwt.secret", () -> "dGVzdC1zZWNyZXQtbWluaW11bS0yNTYtYml0cy1sb25n");
    registry.add("app.jwt.expiration-ms", () -> "86400000");
    registry.add("app.jwt.refresh-expiration-ms", () -> "604800000");
    registry.add("app.oauth2.google.client-id", () -> "test-client-id");
    registry.add("spring.security.oauth2.resourceserver.jwt.issuer-uri", () -> "");
  }

  @Test
  void contextLoads() {
  }
}
