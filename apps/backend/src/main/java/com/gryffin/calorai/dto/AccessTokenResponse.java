package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Access token response returned after authentication or cookie-based refresh. The refresh token is
 * no longer in the response body; it is set as an HttpOnly cookie by the server to prevent XSS
 * theft (SEC-002).
 */
@Schema(description = "Access token returned after successful authentication or cookie refresh")
public record AccessTokenResponse(
  @Schema(description = "Short-lived access token (24 h)") String accessToken,
  @Schema(description = "Token type, always 'Bearer'") String tokenType,
  @Schema(description = "Access token TTL in seconds") long expiresIn
) {

  /**
   * Creates an AccessTokenResponse with tokenType set to "Bearer".
   */
  public static AccessTokenResponse of(String accessToken, long expiresIn) {
    return new AccessTokenResponse(accessToken, "Bearer", expiresIn);
  }
}
