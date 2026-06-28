package com.gryffin.calorai.controller;

import com.gryffin.calorai.dto.AccessTokenResponse;
import com.gryffin.calorai.dto.AuthRequest;
import com.gryffin.calorai.dto.AuthResponse;
import com.gryffin.calorai.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for OAuth2 token exchange and JWT refresh.
 * Refresh tokens are issued as HttpOnly cookies (SEC-002) rather than response body fields.
 */
@Tag(name = "Auth", description = "OAuth2 token exchange and JWT refresh")
@RestController
@RequestMapping("/v1/auth")
public class AuthController {

  private static final String COOKIE_NAME = "gc_rt";
  private static final String COOKIE_PATH = "/gryffin/calorai/api/v1/auth";
  private static final Duration COOKIE_MAX_AGE = Duration.ofDays(7);

  private final AuthService authService;
  private final boolean cookieSecure;

  /**
   * Constructs the controller.
   *
   * @param authService the authentication service
   * @param cookieSecure whether to set the Secure flag on the refresh cookie;
   *                     defaults to true, set to false for local HTTP development
   */
  public AuthController(
    AuthService authService,
    @Value("${cookie.secure:true}") boolean cookieSecure
  ) {
    this.authService = authService;
    this.cookieSecure = cookieSecure;
  }

  /**
   * Exchanges an OAuth2 ID token for a Calorai JWT pair.
   * The refresh token is set as an HttpOnly cookie; only the access token is in the body.
   *
   * @param request the OAuth2 exchange request
   * @param response the HTTP response used to set the refresh cookie
   * @return the access token response
   */
  @Operation(summary = "Exchange an OAuth2 ID token for a Calorai access token")
  @PostMapping("/token")
  public ResponseEntity<AccessTokenResponse> token(
    @Valid @RequestBody AuthRequest request,
    HttpServletResponse response
  ) {
    AuthResponse auth = authService.authenticate(request);
    addRefreshCookie(response, auth.refreshToken());
    return ResponseEntity.ok(AccessTokenResponse.of(auth.accessToken(), auth.expiresIn()));
  }

  /**
   * Issues a new access token by reading the refresh token from the HttpOnly cookie.
   * Rotates the refresh cookie on each call.
   *
   * @param cookieToken the refresh token read from the gc_rt cookie
   * @param response the HTTP response used to rotate the refresh cookie
   * @return the new access token response
   */
  @Operation(summary = "Refresh the access token using the HttpOnly refresh cookie")
  @PostMapping("/refresh-cookie")
  public ResponseEntity<AccessTokenResponse> refreshCookie(
    @CookieValue(name = COOKIE_NAME, required = false) String cookieToken,
    HttpServletResponse response
  ) {
    AuthResponse auth = authService.refresh(cookieToken != null ? cookieToken : "");
    addRefreshCookie(response, auth.refreshToken());
    return ResponseEntity.ok(AccessTokenResponse.of(auth.accessToken(), auth.expiresIn()));
  }

  /**
   * Revokes the refresh token stored in the HttpOnly cookie and clears it.
   *
   * @param cookieToken the refresh token read from the gc_rt cookie
   * @param response the HTTP response used to clear the refresh cookie
   * @return 204 No Content
   */
  @Operation(
    summary = "Sign out and revoke the refresh cookie",
    security = @SecurityRequirement(name = "bearerAuth")
  )
  @PostMapping("/logout")
  public ResponseEntity<Void> logout(
    @CookieValue(name = COOKIE_NAME, required = false) String cookieToken,
    HttpServletResponse response
  ) {
    authService.logout(cookieToken);
    clearRefreshCookie(response);
    return ResponseEntity.noContent().build();
  }

  private void addRefreshCookie(HttpServletResponse response, String refreshToken) {
    ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, refreshToken)
      .httpOnly(true)
      .secure(cookieSecure)
      .sameSite("Strict")
      .path(COOKIE_PATH)
      .maxAge(COOKIE_MAX_AGE)
      .build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }

  private void clearRefreshCookie(HttpServletResponse response) {
    ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, "")
      .httpOnly(true)
      .secure(cookieSecure)
      .sameSite("Strict")
      .path(COOKIE_PATH)
      .maxAge(Duration.ZERO)
      .build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }
}
