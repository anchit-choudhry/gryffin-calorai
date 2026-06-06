package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.Instant;

/** TDEE and calorie goal profile DTO (one per user). */
@Schema(description = "TDEE / calorie goal profile (one per user)")
public record TdeeProfileDto(
    @Schema(accessMode = Schema.AccessMode.READ_ONLY) String id,

    @Min(1) @Max(120) @Schema(description = "Age in years") int age,

    @NotBlank @Pattern(regexp = "^(male|female)$", message = "sex must be male or female")
    @Schema(description = "Biological sex: male | female") String sex,

    @DecimalMin("50") @DecimalMax("300")
    @Schema(description = "Height in centimetres") double heightCm,

    @DecimalMin("20") @DecimalMax("500")
    @Schema(description = "Weight in kilograms") double weightKg,

    @NotBlank
    @Pattern(regexp = "^(sedentary|light|moderate|active|very_active)$",
        message = "activityLevel must be sedentary, light, moderate, active, or very_active")
    @Schema(description = "Activity level") String activityLevel,

    @NotBlank
    @Pattern(regexp = "^(lose|maintain|gain)$", message = "goal must be lose, maintain, or gain")
    @Schema(description = "Goal: lose | maintain | gain") String goal,

    @Schema(description = "Last updated timestamp (server-managed)", accessMode = Schema.AccessMode.READ_ONLY)
    Instant updatedAt
) {

}
