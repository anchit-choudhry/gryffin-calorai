package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Schema(description = "Food item log entry")
public record FoodItemDto(
    @Schema(description = "Unique ID (UUID)", accessMode = Schema.AccessMode.READ_ONLY)
    String id,

    @NotBlank @Size(max = 255)
    @Schema(description = "Food name") String name,

    @DecimalMin("0") @DecimalMax("9999")
    @Schema(description = "Calories (kcal)") double calories,

    @DecimalMin("0")
    @Schema(description = "Serving size multiplier") double servingSize,

    @DecimalMin("0") @DecimalMax("999")
    @Schema(description = "Protein (g)") double protein,

    @DecimalMin("0") @DecimalMax("999")
    @Schema(description = "Carbohydrates (g)") double carbs,

    @DecimalMin("0") @DecimalMax("999")
    @Schema(description = "Fat (g)") double fat,

    @NotNull
    @Schema(description = "Date logged (YYYY-MM-DD)") LocalDate dateLogged,

    @Schema(description = "Whether marked as favourite") boolean isFavorite,

    @Pattern(regexp = "^(Breakfast|Lunch|Snacks|Dinner)$", message = "mealType must be Breakfast, Lunch, Snacks, or Dinner")
    @Schema(description = "Meal type: Breakfast | Lunch | Snacks | Dinner") String mealType
) {}
