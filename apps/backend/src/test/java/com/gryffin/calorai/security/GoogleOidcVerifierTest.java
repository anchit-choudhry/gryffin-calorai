package com.gryffin.calorai.security;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class GoogleOidcVerifierTest {

  private static final String CLIENT_ID = "test-client-id.apps.googleusercontent.com";
  private static final String GOOGLE_ISSUER = "https://accounts.google.com";

  private static RSAPrivateKey privateKey;
  private static GoogleOidcVerifier verifier;

  @BeforeAll
  static void setUpKeys() throws Exception {
    final var gen = KeyPairGenerator.getInstance("RSA");
    gen.initialize(2048);
    final var keyPair = gen.generateKeyPair();
    privateKey = (RSAPrivateKey) keyPair.getPrivate();

    final var testKey = new RSAKey.Builder((RSAPublicKey) keyPair.getPublic())
      .privateKey(privateKey)
      .keyID("test-kid")
      .build();
    final var jwkSource = new ImmutableJWKSet<>(new JWKSet(testKey));
    verifier = new GoogleOidcVerifier(CLIENT_ID, jwkSource);
  }

  private String sign(final JWTClaimsSet claims) throws Exception {
    final var header = new JWSHeader.Builder(JWSAlgorithm.RS256).keyID("test-kid").build();
    final var jwt = new SignedJWT(header, claims);
    jwt.sign(new RSASSASigner(privateKey));
    return jwt.serialize();
  }

  private JWTClaimsSet.Builder validClaims() {
    return new JWTClaimsSet.Builder()
      .issuer(GOOGLE_ISSUER)
      .subject("google-sub-123")
      .audience(CLIENT_ID)
      .claim("email", "user@example.com")
      .claim("name", "Test User")
      .claim("email_verified", true)
      .expirationTime(Date.from(Instant.now().plusSeconds(3600)));
  }

  @Test
  void validTokenReturnsCorrectClaims() throws Exception {
    final var token = sign(validClaims().build());

    final var claims = verifier.verify(token);

    Assertions.assertThat(claims.sub()).isEqualTo("google-sub-123");
    Assertions.assertThat(claims.email()).isEqualTo("user@example.com");
    Assertions.assertThat(claims.name()).isEqualTo("Test User");
    Assertions.assertThat(claims.provider()).isEqualTo("google");
  }

  @Test
  void wrongIssuerThrowsWithIssuerMessage() throws Exception {
    final var token = sign(validClaims().issuer("https://evil.com").build());

    Assertions.assertThatThrownBy(() -> verifier.verify(token))
      .isInstanceOf(OidcVerificationException.class)
      .hasMessageContaining("issuer");
  }

  @Test
  void wrongAudienceThrowsWithAudienceMessage() throws Exception {
    final var token = sign(validClaims().audience(List.of("wrong-client-id")).build());

    Assertions.assertThatThrownBy(() -> verifier.verify(token))
      .isInstanceOf(OidcVerificationException.class)
      .hasMessageContaining("audience");
  }

  @Test
  void unverifiedEmailThrowsWithEmailMessage() throws Exception {
    final var token = sign(validClaims().claim("email_verified", false).build());

    Assertions.assertThatThrownBy(() -> verifier.verify(token))
      .isInstanceOf(OidcVerificationException.class)
      .hasMessageContaining("email");
  }

  @Test
  void expiredTokenThrowsVerificationException() throws Exception {
    final var token = sign(
      validClaims().expirationTime(Date.from(Instant.now().minusSeconds(60))).build()
    );

    Assertions.assertThatThrownBy(() -> verifier.verify(token))
      .isInstanceOf(OidcVerificationException.class);
  }

  @Test
  void malformedTokenThrowsVerificationException() {
    Assertions.assertThatThrownBy(() -> verifier.verify("not.a.valid.jwt"))
      .isInstanceOf(OidcVerificationException.class);
  }

  @Test
  void missingNameClaimReturnsEmptyName() throws Exception {
    final var claims = new JWTClaimsSet.Builder()
      .issuer(GOOGLE_ISSUER)
      .subject("sub-no-name")
      .audience(CLIENT_ID)
      .claim("email", "user@example.com")
      .claim("email_verified", true)
      .expirationTime(Date.from(Instant.now().plusSeconds(3600)))
      .build();

    final var result = verifier.verify(sign(claims));

    Assertions.assertThat(result.name()).isEmpty();
  }

  @Test
  void invalidSignatureThrowsVerificationException() throws Exception {
    final var token = sign(validClaims().build());
    final var parts = token.split("\\.");
    final var tampered = parts[0] + "." + parts[1] + ".invalidsignature";

    Assertions.assertThatThrownBy(() -> verifier.verify(tampered))
      .isInstanceOf(OidcVerificationException.class);
  }
}
