package com.gryffin.calorai.controller;

import com.gryffin.calorai.dto.RecipeDto;
import com.gryffin.calorai.service.RecipeService;
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
 * REST controller for recipe sync.
 */
@Tag(name = "Recipes", description = "CRUD and delta-sync for user recipes")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/v1/recipes")
public class RecipeController {

  private final RecipeService recipeService;

  public RecipeController(final RecipeService recipeService) {
    this.recipeService = recipeService;
  }

  @Operation(summary = "List all recipes (newest first)")
  @GetMapping
  public List<RecipeDto> getAll(@AuthenticationPrincipal final Jwt jwt) {
    return recipeService.getAll(UUID.fromString(jwt.getSubject()));
  }

  @Operation(summary = "Get all changes since a timestamp (for delta sync)")
  @GetMapping("/changes")
  public List<RecipeDto> getChanges(
    @AuthenticationPrincipal final Jwt jwt,
    @RequestParam final Instant since
  ) {
    return recipeService.getChangesSince(UUID.fromString(jwt.getSubject()), since);
  }

  @Operation(summary = "Create a recipe")
  @PostMapping
  public ResponseEntity<RecipeDto> create(
    @AuthenticationPrincipal final Jwt jwt,
    @Valid @RequestBody final RecipeDto dto
  ) {
    final RecipeDto created = recipeService.create(UUID.fromString(jwt.getSubject()), dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @Operation(summary = "Upsert a recipe by ID (creates if not found, updates if found)")
  @PutMapping("/{id}")
  public RecipeDto upsert(
    @AuthenticationPrincipal final Jwt jwt,
    @PathVariable final UUID id,
    @Valid @RequestBody final RecipeDto dto
  ) {
    return recipeService.upsert(UUID.fromString(jwt.getSubject()), id, dto);
  }

  @Operation(summary = "Soft-delete a recipe")
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
    @AuthenticationPrincipal final Jwt jwt,
    @PathVariable final UUID id
  ) {
    recipeService.delete(UUID.fromString(jwt.getSubject()), id);
    return ResponseEntity.noContent().build();
  }
}
