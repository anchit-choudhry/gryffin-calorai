package com.gryffin.calorai.dto;

import com.gryffin.calorai.entity.MealTemplateFoodEntry;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

/**
 * Meal template DTO - a saved combination of foods synced between client devices and the server.
 */
@Schema(description = "Saved meal template")
public record MealTemplateDto(
  @Schema(accessMode = Schema.AccessMode.READ_ONLY) String id,

  @NotNull @Size(max = 255) @Schema(description = "Template name") String name,

  @NotNull @Schema(description = "Food entries (JSONB)") List<MealTemplateFoodEntry> foods,

  @Schema(
    description = "Creation timestamp (server-managed)",
    accessMode = Schema.AccessMode.READ_ONLY
  )
  Instant createdAt,

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
