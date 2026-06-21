package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Daily step count log DTO.
 */
@Schema(description = "Step count log entry")
public record StepLogDto(
  @Schema(accessMode = Schema.AccessMode.READ_ONLY) String id,

  @Min(0) @Schema(description = "Step count") int steps,

  @NotNull @Schema(description = "Date logged (YYYY-MM-DD)") LocalDate dateLogged,

  @Schema(description = "Last updated timestamp (server-managed)", accessMode = Schema.AccessMode.READ_ONLY)
  Instant updatedAt,

  @Schema(description = "Soft-delete timestamp; non-null means deleted", accessMode = Schema.AccessMode.READ_ONLY)
  Instant deletedAt
) {

}
