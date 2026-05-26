package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Logout request - revokes the provided refresh token")
public record LogoutRequest(
    @NotBlank @Schema(description = "Refresh token to revoke") String refreshToken
) {}
