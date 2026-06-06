package com.gryffin.calorai.controller;

import com.gryffin.calorai.dto.WaterLogDto;
import com.gryffin.calorai.service.WaterLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
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

/** REST controller for daily water intake log entries. */
@Tag(name = "Water Logs", description = "CRUD for daily water intake entries")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/v1/water-logs")
public class WaterLogController {

  private final WaterLogService waterLogService;

  public WaterLogController(final WaterLogService waterLogService) {
    this.waterLogService = waterLogService;
  }

  @Operation(summary = "List water logs for a given date")
  @GetMapping
  public List<WaterLogDto> getByDate(
      @AuthenticationPrincipal final Jwt jwt,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) final LocalDate date
  ) {
    return waterLogService.getDailyLogs(UUID.fromString(jwt.getSubject()), date);
  }

  @Operation(summary = "Get all changes since a timestamp (for delta sync)")
  @GetMapping("/changes")
  public List<WaterLogDto> getChanges(
      @AuthenticationPrincipal final Jwt jwt,
      @RequestParam final Instant since
  ) {
    return waterLogService.getChangesSince(UUID.fromString(jwt.getSubject()), since);
  }

  @Operation(summary = "Log a water intake entry")
  @PostMapping
  public ResponseEntity<WaterLogDto> create(
      @AuthenticationPrincipal final Jwt jwt,
      @Valid @RequestBody final WaterLogDto dto
  ) {
    final WaterLogDto created = waterLogService.create(UUID.fromString(jwt.getSubject()), dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @Operation(summary = "Upsert a water log by ID (creates if not found, updates if found)")
  @PutMapping("/{id}")
  public WaterLogDto upsert(
      @AuthenticationPrincipal final Jwt jwt,
      @PathVariable final UUID id,
      @Valid @RequestBody final WaterLogDto dto
  ) {
    return waterLogService.upsert(UUID.fromString(jwt.getSubject()), id, dto);
  }

  @Operation(summary = "Soft-delete a water log")
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @AuthenticationPrincipal final Jwt jwt,
      @PathVariable final UUID id
  ) {
    waterLogService.delete(UUID.fromString(jwt.getSubject()), id);
    return ResponseEntity.noContent().build();
  }
}
