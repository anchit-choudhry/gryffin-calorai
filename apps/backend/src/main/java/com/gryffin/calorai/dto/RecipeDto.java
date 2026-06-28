package com.gryffin.calorai.dto;

import com.gryffin.calorai.entity.RecipeIngredient;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

/**
 * Recipe DTO - synced bidirectionally between client devices and the server.
 */
@Schema(description = "User recipe")
public record RecipeDto(
  @Schema(accessMode = Schema.AccessMode.READ_ONLY) String id,

  @NotNull @Size(max = 255) @Schema(description = "Recipe name") String name,

  @Size(max = 2000) @Schema(description = "Optional description") String description,

  @NotNull @Schema(description = "Ingredient list (JSONB)") List<RecipeIngredient> ingredients,

  @Schema(description = "Total calories") Integer totalCalories,

  @Schema(description = "Total protein in grams") Double totalProtein,

  @Schema(description = "Total carbohydrates in grams") Double totalCarbs,

  @Schema(description = "Total fat in grams") Double totalFat,

  @NotNull @Schema(description = "User ID who created the recipe") String createdBy,

  @NotNull @Schema(description = "Date created (YYYY-MM-DD)") String dateCreated,

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
