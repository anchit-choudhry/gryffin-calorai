package com.gryffin.calorai.security;

public class OidcVerificationException extends RuntimeException {
    public OidcVerificationException(String message) {
        super(message);
    }
    public OidcVerificationException(String message, Throwable cause) {
        super(message, cause);
    }
}
