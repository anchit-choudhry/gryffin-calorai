package com.gryffin.calorai.controller;

import com.gryffin.calorai.dto.DietProfileDto;
import com.gryffin.calorai.service.DietProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for the user diet profile singleton. Each user has at most one diet profile, so
 * there is no list or delta-sync endpoint.
 */
@Tag(name = "Diet Profile", description = "Singleton diet preferences per user")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/v1/diet-profile")
public class DietProfileController {

  private final DietProfileService dietProfileService;

  public DietProfileController(final DietProfileService dietProfileService) {
    this.dietProfileService = dietProfileService;
  }

  @Operation(summary = "Get the user's diet profile (204 if none saved yet)")
  @GetMapping
  public ResponseEntity<DietProfileDto> get(@AuthenticationPrincipal final Jwt jwt) {
    return dietProfileService.get(UUID.fromString(jwt.getSubject()))
      .map(ResponseEntity::ok)
      .orElse(ResponseEntity.noContent().build());
  }

  @Operation(summary = "Create the user's diet profile")
  @PostMapping
  public ResponseEntity<DietProfileDto> create(
    @AuthenticationPrincipal final Jwt jwt,
    @Valid @RequestBody final DietProfileDto dto
  ) {
    final DietProfileDto created =
      dietProfileService.create(UUID.fromString(jwt.getSubject()), dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @Operation(summary = "Upsert the diet profile by ID (creates if not found, updates if found)")
  @PutMapping("/{id}")
  public DietProfileDto upsert(
    @AuthenticationPrincipal final Jwt jwt,
    @PathVariable final UUID id,
    @Valid @RequestBody final DietProfileDto dto
  ) {
    return dietProfileService.upsert(UUID.fromString(jwt.getSubject()), id, dto);
  }
}
