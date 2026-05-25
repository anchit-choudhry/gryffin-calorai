package com.gryffin.calorai.security;

public record OidcClaims(
    String sub,
    String email,
    String name,
    String provider
) {}
