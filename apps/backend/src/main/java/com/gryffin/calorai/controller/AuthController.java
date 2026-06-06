package com.gryffin.calorai.controller;

import com.gryffin.calorai.dto.AuthRequest;
import com.gryffin.calorai.dto.AuthResponse;
import com.gryffin.calorai.dto.LogoutRequest;
import com.gryffin.calorai.dto.RefreshRequest;
import com.gryffin.calorai.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** REST controller for OAuth2 token exchange and JWT refresh. */
@Tag(name = "Auth", description = "OAuth2 token exchange and JWT refresh")
@RestController
@RequestMapping("/v1/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @Operation(summary = "Exchange an OAuth2 ID token for a Calorai JWT pair")
  @PostMapping("/token")
  public ResponseEntity<AuthResponse> token(@Valid @RequestBody AuthRequest request) {
    return ResponseEntity.ok(authService.authenticate(request));
  }

  @Operation(summary = "Refresh an expired access token using a valid refresh token")
  @PostMapping("/refresh")
  public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
    return ResponseEntity.ok(authService.refresh(request.refreshToken()));
  }

  @Operation(summary = "Revoke the current refresh token and sign out", security = @SecurityRequirement(name = "bearerAuth"))
  @PostMapping("/logout")
  public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest request) {
    authService.logout(request.refreshToken());
    return ResponseEntity.noContent().build();
  }
}
