package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Activity log entry.
 */
@Schema(description = "Activity log entry")

public record ActivityLogDto(
  @Schema(description = "Unique ID (UUID)", accessMode = Schema.AccessMode.READ_ONLY)
  String id,

  @NotBlank @Schema(description = "Activity type name") String activityType,

  @Min(0) @Schema(description = "Duration in minutes") int durationMin,

  @DecimalMin("0") @Schema(description = "Calories burned (kcal)") double caloriesBurned,

  @NotNull @Schema(description = "Date logged (YYYY-MM-DD)") LocalDate dateLogged,

  @Schema(description = "Log timestamp", accessMode = Schema.AccessMode.READ_ONLY)
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
