package com.gryffin.calorai.security;

/** Thrown when an OIDC ID token fails signature, issuer, audience, or expiry validation. */
public class OidcVerificationException extends RuntimeException {

  private static final long serialVersionUID = 1L;

  /**
   * Constructs an OidcVerificationException with the given message.
   *
   * @param message description of the verification failure
   */
  public OidcVerificationException(String message) {
    super(message);
  }

  /**
   * Constructs an OidcVerificationException with a message and root cause.
   *
   * @param message description of the verification failure
   * @param cause the underlying exception
   */
  public OidcVerificationException(String message, Throwable cause) {
    super(message, cause);
  }
}
