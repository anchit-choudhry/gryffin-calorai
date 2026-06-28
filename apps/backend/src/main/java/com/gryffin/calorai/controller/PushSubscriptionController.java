package com.gryffin.calorai.controller;

import com.gryffin.calorai.dto.PushSubscriptionDto;
import com.gryffin.calorai.dto.VapidPublicKeyDto;
import com.gryffin.calorai.service.PushNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for Web Push subscription management. Provides the VAPID public key (public
 * endpoint) and subscription register/deregister endpoints (authenticated).
 */
@Tag(name = "Push Notifications", description = "VAPID Web Push subscription management")
@Validated
@RestController
@RequestMapping("/v1/push")
public class PushSubscriptionController {

  private final PushNotificationService pushService;

  /**
   * Constructor injection.
   *
   * @param pushService the push notification service
   */
  public PushSubscriptionController(final PushNotificationService pushService) {
    this.pushService = pushService;
  }

  /**
   * Returns the VAPID application server public key. Required by the browser before calling
   * PushManager.subscribe(). This endpoint is intentionally unauthenticated.
   *
   * @return the VAPID public key DTO
   */
  @Operation(summary = "Get VAPID public key", description = "Unauthenticated; required before push subscribe")
  @GetMapping("/vapid-public-key")
  public ResponseEntity<VapidPublicKeyDto> getVapidPublicKey() {
    return ResponseEntity.ok(new VapidPublicKeyDto(pushService.getVapidPublicKey()));
  }

  /**
   * Saves or updates a push subscription for the authenticated user. Safe to call on every app load
   * (upserts by endpoint URL).
   *
   * @param jwt the authenticated user's JWT
   * @param dto the push subscription payload
   * @return 204 No Content
   */
  @Operation(summary = "Register push subscription")
  @SecurityRequirement(name = "bearerAuth")
  @PostMapping("/subscribe")
  public ResponseEntity<Void> subscribe(
    @AuthenticationPrincipal final Jwt jwt,
    @Valid @RequestBody final PushSubscriptionDto dto) {
    final UUID userId = UUID.fromString(jwt.getSubject());
    pushService.subscribe(userId, dto);
    return ResponseEntity.noContent().build();
  }

  /**
   * Removes a push subscription for the authenticated user identified by endpoint URL. Called when
   * the browser unsubscribes (e.g. user disables notifications in browser settings).
   *
   * @param jwt      the authenticated user's JWT
   * @param endpoint the push service endpoint URL to remove
   * @return 204 No Content
   */
  @Operation(summary = "Deregister push subscription")
  @SecurityRequirement(name = "bearerAuth")
  @DeleteMapping("/subscribe")
  public ResponseEntity<Void> unsubscribe(
    @AuthenticationPrincipal final Jwt jwt,
    @RequestParam @NotBlank final String endpoint) {
    final UUID userId = UUID.fromString(jwt.getSubject());
    pushService.unsubscribe(userId, endpoint);
    return ResponseEntity.noContent().build();
  }
}
