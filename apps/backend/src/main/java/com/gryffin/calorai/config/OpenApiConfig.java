package com.gryffin.calorai.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger UI configuration (annotation-driven).
 */
@OpenAPIDefinition(
  info = @Info(
    title = "Gryffin Calorai API",
    version = "0.7.0",
    description = "REST API for the Gryffin Calorai nutrition and fitness tracker. "
      + "Authenticate via POST /v1/auth/token with a Google or Apple ID token.",
    contact = @Contact(name = "Gryffin Calorai"),
    license = @License(name = "MIT")
  ),
  servers = {
    @Server(url = "http://localhost:8080/gryffin/calorai/api", description = "Local dev"),
    @Server(url = "https://api.calorai.app/gryffin/calorai/api", description = "Production")
  }
)
@SecurityScheme(
  name = "bearerAuth",
  type = SecuritySchemeType.HTTP,
  scheme = "bearer",
  bearerFormat = "JWT",
  description = "JWT access token obtained from POST /v1/auth/token"
)
@Configuration
public class OpenApiConfig {

}
