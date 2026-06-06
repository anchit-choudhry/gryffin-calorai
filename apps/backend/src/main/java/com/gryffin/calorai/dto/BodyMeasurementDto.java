package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;

/** Body weight and composition measurement DTO. */
@Schema(description = "Body measurement entry")
public record BodyMeasurementDto(
    @Schema(accessMode = Schema.AccessMode.READ_ONLY) String id,

    @DecimalMin("0") @Schema(description = "Weight in kilograms") Double weightKg,

    @DecimalMin("0") @DecimalMax("100")
    @Schema(description = "Body fat percentage") Double bodyFatPct,

    @NotNull @Schema(description = "Date logged (YYYY-MM-DD)") LocalDate dateLogged,

    @Size(max = 2000) @Schema(description = "Optional notes (max 2000 chars)") String notes,

    @Schema(description = "Last updated timestamp (server-managed)", accessMode = Schema.AccessMode.READ_ONLY)
    Instant updatedAt,

    @Schema(description = "Soft-delete timestamp; non-null means deleted", accessMode = Schema.AccessMode.READ_ONLY)
    Instant deletedAt
) {

}
