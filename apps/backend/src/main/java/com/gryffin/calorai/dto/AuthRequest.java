package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * AuthRequest DTO.
 */
@Schema(description = "OAuth2 token exchange request")

public record AuthRequest(
    @NotBlank @Schema(description = "OAuth2 provider: google | apple") String provider,
    @NotBlank @Schema(description = "ID token from the OAuth2 provider") String idToken
) {

}
