package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

/**
 * Single encrypted sync blob for upload or download. The server stores and returns the
 * ciphertext field opaquely and never parses its contents.
 */
public record EncryptedBlobDto(

  @NotBlank
  @Schema(description = "Client-assigned blob ID in format entityType:syncId")
  String clientBlobId,

  @NotBlank
  @Schema(description = "Base64-encoded 96-bit AES-GCM IV")
  String iv,

  @NotBlank
  @Schema(description = "Base64-encoded AES-GCM-256 ciphertext")
  String ciphertext,

  @Schema(
    description = "Server-managed last-updated timestamp",
    accessMode = Schema.AccessMode.READ_ONLY
  )
  Instant updatedAt,

  @Schema(
    description = "True when this blob has been deleted",
    accessMode = Schema.AccessMode.READ_ONLY
  )
  boolean isDeleted

) {}
