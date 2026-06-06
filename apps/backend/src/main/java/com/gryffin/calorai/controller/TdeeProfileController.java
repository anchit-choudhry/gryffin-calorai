package com.gryffin.calorai.controller;

import com.gryffin.calorai.dto.TdeeProfileDto;
import com.gryffin.calorai.service.TdeeProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** REST controller for the user's TDEE and calorie goal profile. */
@Tag(name = "TDEE Profile", description = "User TDEE / calorie goal profile (one per user)")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/v1/tdee-profile")
public class TdeeProfileController {

  private final TdeeProfileService tdeeProfileService;

  public TdeeProfileController(final TdeeProfileService tdeeProfileService) {
    this.tdeeProfileService = tdeeProfileService;
  }

  @Operation(summary = "Get the current user's TDEE profile")
  @GetMapping
  public ResponseEntity<TdeeProfileDto> get(@AuthenticationPrincipal final Jwt jwt) {
    return tdeeProfileService.get(UUID.fromString(jwt.getSubject()))
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @Operation(summary = "Create or update the current user's TDEE profile")
  @PutMapping
  public TdeeProfileDto upsert(
      @AuthenticationPrincipal final Jwt jwt,
      @Valid @RequestBody final TdeeProfileDto dto
  ) {
    return tdeeProfileService.upsert(UUID.fromString(jwt.getSubject()), dto);
  }
}
