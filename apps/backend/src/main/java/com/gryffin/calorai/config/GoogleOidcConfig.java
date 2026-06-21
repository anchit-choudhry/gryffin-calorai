package com.gryffin.calorai.config;

import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.JWKSourceBuilder;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jose.util.DefaultResourceRetriever;
import java.net.MalformedURLException;
import java.net.URI;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configures the Google JWKS source for local OIDC token verification.
 */
@Configuration
public class GoogleOidcConfig {

  private static final String GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

  /**
   * Creates a cached remote JWK source pointed at Google's public key endpoint.
   *
   * @return JWKSource backed by Google's JWKS URI
   * @throws MalformedURLException if the JWKS URL is malformed
   */
  @Bean("googleJwkSource")
  public JWKSource<SecurityContext> googleJwkSource() throws MalformedURLException {
    final var retriever = new DefaultResourceRetriever(5_000, 5_000);
    return JWKSourceBuilder
      .create(URI.create(GOOGLE_JWKS_URL).toURL(), retriever)
      .build();
  }
}
