package com.gryffin.calorai.security;

/**
 * Verifies an OIDC ID token from a provider (Google, Apple) and returns the extracted claims.
 * Implementations will call the provider's JWKS endpoint to validate the signature.
 */
public interface OidcTokenVerifier {

  OidcClaims verify(String idToken) throws OidcVerificationException;
}
