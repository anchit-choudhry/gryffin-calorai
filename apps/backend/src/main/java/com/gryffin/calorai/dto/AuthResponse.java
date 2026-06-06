package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * AuthResponse DTO.
 */
@Schema(description = "JWT token pair returned after successful authentication")

public record AuthResponse(
    @Schema(description = "Short-lived access token (24 h)") String accessToken,
    @Schema(description = "Long-lived refresh token (7 days)") String refreshToken,
    @Schema(description = "Token type, always 'Bearer'") String tokenType,
    @Schema(description = "Access token TTL in seconds") long expiresIn
) {

  public static AuthResponse of(String accessToken, String refreshToken, long expiresInSeconds) {
    return new AuthResponse(accessToken, refreshToken, "Bearer", expiresInSeconds);
  }
}
