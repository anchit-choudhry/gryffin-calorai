package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Water intake log entry.
 */
@Schema(description = "Water intake log entry")
public record WaterLogDto(
  @Schema(
    description = "Unique ID (UUID)",
    accessMode = Schema.AccessMode.READ_ONLY
  ) String id,

  @DecimalMin("0")
  @Schema(description = "Amount in millilitres") double amount,

  @NotNull LocalDate dateLogged,

  @Schema(
    description = "Time the entry was originally logged",
    accessMode = Schema.AccessMode.READ_ONLY
  )
  Instant loggedAt,

  @Schema(
    description = "Last updated timestamp (server-managed)",
    accessMode = Schema.AccessMode.READ_ONLY
  )
  Instant updatedAt,

  @Schema(
    description = "Soft-delete timestamp; non-null means deleted",
    accessMode = Schema.AccessMode.READ_ONLY
  )
  Instant deletedAt
) {

}
