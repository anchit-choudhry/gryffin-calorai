package com.gryffin.calorai.controller;

import com.gryffin.calorai.dto.MealTemplateDto;
import com.gryffin.calorai.service.MealTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for meal template sync.
 */
@Tag(name = "Meal Templates", description = "CRUD and delta-sync for saved meal templates")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/v1/meal-templates")
public class MealTemplateController {

  private final MealTemplateService mealTemplateService;

  public MealTemplateController(final MealTemplateService mealTemplateService) {
    this.mealTemplateService = mealTemplateService;
  }

  @Operation(summary = "List all meal templates (newest first)")
  @GetMapping
  public List<MealTemplateDto> getAll(@AuthenticationPrincipal final Jwt jwt) {
    return mealTemplateService.getAll(UUID.fromString(jwt.getSubject()));
  }

  @Operation(summary = "Get all changes since a timestamp (for delta sync)")
  @GetMapping("/changes")
  public List<MealTemplateDto> getChanges(
    @AuthenticationPrincipal final Jwt jwt,
    @RequestParam final Instant since
  ) {
    return mealTemplateService.getChangesSince(UUID.fromString(jwt.getSubject()), since);
  }

  @Operation(summary = "Create a meal template")
  @PostMapping
  public ResponseEntity<MealTemplateDto> create(
    @AuthenticationPrincipal final Jwt jwt,
    @Valid @RequestBody final MealTemplateDto dto
  ) {
    final MealTemplateDto created =
      mealTemplateService.create(UUID.fromString(jwt.getSubject()), dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @Operation(summary = "Upsert a meal template by ID (creates if not found, updates if found)")
  @PutMapping("/{id}")
  public MealTemplateDto upsert(
    @AuthenticationPrincipal final Jwt jwt,
    @PathVariable final UUID id,
    @Valid @RequestBody final MealTemplateDto dto
  ) {
    return mealTemplateService.upsert(UUID.fromString(jwt.getSubject()), id, dto);
  }

  @Operation(summary = "Soft-delete a meal template")
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
    @AuthenticationPrincipal final Jwt jwt,
    @PathVariable final UUID id
  ) {
    mealTemplateService.delete(UUID.fromString(jwt.getSubject()), id);
    return ResponseEntity.noContent().build();
  }
}
