package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO for registering a browser Web Push subscription with the server. Fields mirror the
 * PushSubscriptionJSON structure returned by PushManager.subscribe() in the browser.
 */
@Schema(description = "Browser push subscription for VAPID-based notifications")
public record PushSubscriptionDto(

  @NotBlank
  @Pattern(regexp = "^https://.*", message = "Endpoint must use HTTPS")
  @Schema(description = "Push service endpoint URL", example = "https://fcm.googleapis.com/fcm/send/...")
  String endpoint,

  @NotBlank
  @Schema(description = "Client P-256 EC public key (base64url)", example = "BNcK...")
  String p256dh,

  @NotBlank
  @Schema(description = "Auth secret (base64url, 16 bytes)", example = "tBHItJI5SVKh9...")
  String auth,

  @Schema(description = "IANA timezone string for reminder scheduling", example = "America/New_York")
  String timezone
) {

}
