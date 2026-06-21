package com.gryffin.calorai.config;

import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * JWT signing key configuration.
 */
@Configuration
public class JwtConfig {

  @Bean
  public SecretKey jwtSigningKey(@Value("${app.jwt.secret}") String secret) {
    if (secret.startsWith("change-this")) {
      throw new IllegalStateException(
        "JWT_SECRET must be set to a secure random value; the placeholder default must not be used"
      );
    }
    return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
  }
}
