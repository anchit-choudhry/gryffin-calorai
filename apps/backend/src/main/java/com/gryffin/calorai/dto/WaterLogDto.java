package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Schema(description = "Water intake log entry")
public record WaterLogDto(
    @Schema(accessMode = Schema.AccessMode.READ_ONLY) String id,
    @DecimalMin("0") @Schema(description = "Amount in millilitres") double amount,
    @NotNull LocalDate dateLogged
) {}
