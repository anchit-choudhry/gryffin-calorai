package com.gryffin.calorai.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI caloriOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Gryffin Calorai API")
                .description("REST API for the Gryffin Calorai nutrition and fitness tracker. " +
                    "Authenticate via POST /api/v1/auth/token with a Google or Apple ID token.")
                .version("0.7.0")
                .contact(new Contact().name("Gryffin Calorai"))
                .license(new License().name("MIT")))
            .servers(List.of(
                new Server().url("http://localhost:8080").description("Local dev"),
                new Server().url("https://api.calorai.app").description("Production")))
            .components(new Components()
                .addSecuritySchemes("bearerAuth", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("JWT access token obtained from POST /api/v1/auth/token")));
    }
}
