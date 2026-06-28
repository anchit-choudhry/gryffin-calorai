package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

/**
 * Diet profile DTO - singleton per user, synced between client devices and the server.
 */
@Schema(description = "User dietary preferences (singleton per user)")
public record DietProfileDto(
  @Schema(accessMode = Schema.AccessMode.READ_ONLY) String id,

  @NotNull @Size(max = 50) @Schema(description = "Diet preset key (e.g. generic, keto)") String preset,

  @NotNull @Schema(description = "Restriction flags (JSONB string array)") List<String> restrictions,

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
