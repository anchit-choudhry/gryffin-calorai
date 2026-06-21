package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Intermittent fasting session DTO.
 */
@Schema(description = "Intermittent fasting session")
public record FastingSessionDto(
  @Schema(accessMode = Schema.AccessMode.READ_ONLY) String id,

  @NotNull @Schema(description = "Session start time (UTC)") Instant startTime,

  @Schema(description = "Session end time (UTC); null if still active") Instant endTime,

  @Min(1) @Schema(description = "Target fasting hours") int targetHours,

  @NotNull @Schema(description = "Date logged (YYYY-MM-DD)") LocalDate dateLogged,

  @Schema(description = "Whether the session reached the target") boolean completed,

  @Schema(description = "Last updated timestamp (server-managed)", accessMode = Schema.AccessMode.READ_ONLY)
  Instant updatedAt,

  @Schema(description = "Soft-delete timestamp; non-null means deleted", accessMode = Schema.AccessMode.READ_ONLY)
  Instant deletedAt
) {

}
