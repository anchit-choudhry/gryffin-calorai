package com.gryffin.calorai.controller;

import com.gryffin.calorai.dto.BodyMeasurementDto;
import com.gryffin.calorai.service.BodyMeasurementService;
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
 * REST controller for body weight and composition measurements.
 */
@Tag(name = "Body Measurements", description = "CRUD for body weight and composition measurements")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/v1/body-measurements")
public class BodyMeasurementController {

  private final BodyMeasurementService bodyMeasurementService;

  public BodyMeasurementController(final BodyMeasurementService bodyMeasurementService) {
    this.bodyMeasurementService = bodyMeasurementService;
  }

  @Operation(summary = "List all body measurements (newest first)")
  @GetMapping
  public List<BodyMeasurementDto> getAll(@AuthenticationPrincipal final Jwt jwt) {
    return bodyMeasurementService.getAll(UUID.fromString(jwt.getSubject()));
  }

  @Operation(summary = "Get all changes since a timestamp (for delta sync)")
  @GetMapping("/changes")
  public List<BodyMeasurementDto> getChanges(
    @AuthenticationPrincipal final Jwt jwt,
    @RequestParam final Instant since
  ) {
    return bodyMeasurementService.getChangesSince(UUID.fromString(jwt.getSubject()), since);
  }

  @Operation(summary = "Log a body measurement")
  @PostMapping
  public ResponseEntity<BodyMeasurementDto> create(
    @AuthenticationPrincipal final Jwt jwt,
    @Valid @RequestBody final BodyMeasurementDto dto
  ) {
    final BodyMeasurementDto created =
      bodyMeasurementService.create(UUID.fromString(jwt.getSubject()), dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @Operation(summary = "Upsert a body measurement by ID (creates if not found, updates if found)")
  @PutMapping("/{id}")
  public BodyMeasurementDto upsert(
    @AuthenticationPrincipal final Jwt jwt,
    @PathVariable final UUID id,
    @Valid @RequestBody final BodyMeasurementDto dto
  ) {
    return bodyMeasurementService.upsert(UUID.fromString(jwt.getSubject()), id, dto);
  }

  @Operation(summary = "Soft-delete a body measurement")
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
    @AuthenticationPrincipal final Jwt jwt,
    @PathVariable final UUID id
  ) {
    bodyMeasurementService.delete(UUID.fromString(jwt.getSubject()), id);
    return ResponseEntity.noContent().build();
  }
}
