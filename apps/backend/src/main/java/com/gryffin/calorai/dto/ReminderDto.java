package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/**
 * User reminder DTO - synced between client devices and the server. daysOfWeek is a bitmask: bit 0
 * = Sunday, bit 1 = Monday, ... bit 6 = Saturday.
 */
@Schema(description = "User reminder (water, meal, step)")
public record ReminderDto(
  @Schema(accessMode = Schema.AccessMode.READ_ONLY) String id,

  @NotNull @Size(max = 50) @Schema(description = "Reminder type (e.g. water, meal)") String type,

  @NotNull @Size(max = 10) @Schema(description = "Reminder time (HH:mm)") String time,

  @Schema(description = "Days-of-week bitmask") int daysOfWeek,

  @Schema(description = "Whether the reminder is active") boolean enabled,

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
