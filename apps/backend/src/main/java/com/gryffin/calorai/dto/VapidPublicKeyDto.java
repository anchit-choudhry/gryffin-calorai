package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Response DTO containing the VAPID public key required by the browser to subscribe to push
 * notifications. This key is not secret and may be served without authentication.
 */
@Schema(description = "VAPID application server public key")
public record VapidPublicKeyDto(

  @Schema(
    description = "Base64url-encoded uncompressed P-256 EC public key (65 bytes)",
    example = "BMz5..."
  )
  String key
) {

}
