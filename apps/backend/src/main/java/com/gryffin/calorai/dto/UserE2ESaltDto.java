package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/** Salt payload for PBKDF2 key derivation. The salt is not secret. */
public record UserE2ESaltDto(

  @NotBlank
  @Schema(description = "Base64-encoded 16-byte PBKDF2 salt")
  String salt

) {}
