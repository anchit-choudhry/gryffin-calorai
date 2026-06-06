package com.gryffin.calorai.security;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Verifies Google ID tokens locally using JWKS-based JWT signature verification.
 * Uses the Google public key set at googleapis.com to avoid a round-trip to the tokeninfo
 * endpoint on every request.
 */
@Component("googleOidcVerifier")
public class GoogleOidcVerifier implements OidcTokenVerifier {

  private static final String GOOGLE_ISSUER = "https://accounts.google.com";

  private final String clientId;
  private final DefaultJWTProcessor<SecurityContext> jwtProcessor;

  /** Creates a verifier using the provided client ID and JWK source. */
  public GoogleOidcVerifier(
      @Value("${app.oauth2.google.client-id}") String clientId,
      @Qualifier("googleJwkSource") JWKSource<SecurityContext> jwkSource
  ) {
    this.clientId = clientId;
    this.jwtProcessor = new DefaultJWTProcessor<>();
    this.jwtProcessor.setJWSKeySelector(
        new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, jwkSource)
    );
  }

  @Override
  public OidcClaims verify(final String idToken) throws OidcVerificationException {
    try {
      final JWTClaimsSet claims = jwtProcessor.process(idToken, null);

      if (!GOOGLE_ISSUER.equals(claims.getIssuer())) {
        throw new OidcVerificationException("Invalid token issuer");
      }

      if (!claims.getAudience().contains(clientId)) {
        throw new OidcVerificationException("Invalid token audience");
      }

      final Boolean emailVerified = claims.getBooleanClaim("email_verified");
      if (!Boolean.TRUE.equals(emailVerified)) {
        throw new OidcVerificationException("Google account email is not verified");
      }

      final Object nameObj = claims.getClaim("name");
      final String name = nameObj instanceof String s ? s : "";

      return new OidcClaims(
          claims.getSubject(),
          claims.getStringClaim("email"),
          name,
          "google"
      );
    } catch (OidcVerificationException e) {
      throw e;
    } catch (Exception e) {
      throw new OidcVerificationException("Google token verification failed", e);
    }
  }
}
