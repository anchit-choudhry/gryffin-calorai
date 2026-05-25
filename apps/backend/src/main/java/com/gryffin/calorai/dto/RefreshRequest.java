package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Token refresh request")
public record RefreshRequest(
    @NotBlank @Schema(description = "Valid refresh token") String refreshToken
) {}
