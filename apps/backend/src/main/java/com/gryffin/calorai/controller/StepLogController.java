package com.gryffin.calorai.controller;

import com.gryffin.calorai.dto.StepLogDto;
import com.gryffin.calorai.service.StepLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for daily step count tracking.
 */
@Tag(name = "Step Logs", description = "Step count tracking (one entry per day per user)")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/v1/step-logs")
public class StepLogController {

  private final StepLogService stepLogService;

  public StepLogController(final StepLogService stepLogService) {
    this.stepLogService = stepLogService;
  }

  @Operation(summary = "List all step logs (newest first)")
  @GetMapping
  public List<StepLogDto> getAll(@AuthenticationPrincipal final Jwt jwt) {
    return stepLogService.getAll(UUID.fromString(jwt.getSubject()));
  }

  @Operation(summary = "Get step count for a specific date")
  @GetMapping("/{date}")
  public ResponseEntity<StepLogDto> getByDate(
    @AuthenticationPrincipal final Jwt jwt,
    @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) final LocalDate date
  ) {
    return stepLogService.getByDate(UUID.fromString(jwt.getSubject()), date)
      .map(ResponseEntity::ok)
      .orElse(ResponseEntity.notFound().build());
  }

  @Operation(summary = "Get all changes since a timestamp (for delta sync)")
  @GetMapping("/changes")
  public List<StepLogDto> getChanges(
    @AuthenticationPrincipal final Jwt jwt,
    @RequestParam final Instant since
  ) {
    return stepLogService.getChangesSince(UUID.fromString(jwt.getSubject()), since);
  }

  @Operation(summary = "Upsert step count for a date (one record per day)")
  @PutMapping
  public StepLogDto upsert(
    @AuthenticationPrincipal final Jwt jwt,
    @Valid @RequestBody final StepLogDto dto
  ) {
    return stepLogService.upsertByDate(UUID.fromString(jwt.getSubject()), dto);
  }

  @Operation(summary = "Soft-delete the step log for a given date")
  @DeleteMapping("/{date}")
  public ResponseEntity<Void> delete(
    @AuthenticationPrincipal final Jwt jwt,
    @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) final LocalDate date
  ) {
    stepLogService.deleteByDate(UUID.fromString(jwt.getSubject()), date);
    return ResponseEntity.noContent().build();
  }
}
