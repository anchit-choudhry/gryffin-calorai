package com.gryffin.calorai.controller;

import com.gryffin.calorai.dto.ActivityLogDto;
import com.gryffin.calorai.service.ActivityLogService;
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

/**
 * REST controller for activity and exercise log entries.
 */
@Tag(name = "Activity Logs", description = "CRUD for activity / exercise log entries")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/v1/activity-logs")
public class ActivityLogController {

  private final ActivityLogService activityLogService;

  public ActivityLogController(final ActivityLogService activityLogService) {
    this.activityLogService = activityLogService;
  }

  @Operation(summary = "List activity logs for a given date")
  @GetMapping
  public List<ActivityLogDto> getByDate(
    @AuthenticationPrincipal final Jwt jwt,
    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) final LocalDate date
  ) {
    return activityLogService.getDailyLogs(UUID.fromString(jwt.getSubject()), date);
  }

  @Operation(summary = "Get all changes since a timestamp (for delta sync)")
  @GetMapping("/changes")
  public List<ActivityLogDto> getChanges(
    @AuthenticationPrincipal final Jwt jwt,
    @RequestParam final Instant since
  ) {
    return activityLogService.getChangesSince(UUID.fromString(jwt.getSubject()), since);
  }

  @Operation(summary = "Log an activity entry")
  @PostMapping
  public ResponseEntity<ActivityLogDto> create(
    @AuthenticationPrincipal final Jwt jwt,
    @Valid @RequestBody final ActivityLogDto dto
  ) {
    final ActivityLogDto created =
      activityLogService.create(UUID.fromString(jwt.getSubject()), dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @Operation(summary = "Upsert an activity log by ID (creates if not found, updates if found)")
  @PutMapping("/{id}")
  public ActivityLogDto upsert(
    @AuthenticationPrincipal final Jwt jwt,
    @PathVariable final UUID id,
    @Valid @RequestBody final ActivityLogDto dto
  ) {
    return activityLogService.upsert(UUID.fromString(jwt.getSubject()), id, dto);
  }

  @Operation(summary = "Soft-delete an activity log")
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
    @AuthenticationPrincipal final Jwt jwt,
    @PathVariable final UUID id
  ) {
    activityLogService.delete(UUID.fromString(jwt.getSubject()), id);
    return ResponseEntity.noContent().build();
  }
}
