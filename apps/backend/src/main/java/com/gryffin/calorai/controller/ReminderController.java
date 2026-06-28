package com.gryffin.calorai.controller;

import com.gryffin.calorai.dto.ReminderDto;
import com.gryffin.calorai.service.ReminderService;
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
 * REST controller for user reminder sync.
 */
@Tag(name = "Reminders", description = "CRUD and delta-sync for user reminders")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/v1/reminders")
public class ReminderController {

  private final ReminderService reminderService;

  public ReminderController(final ReminderService reminderService) {
    this.reminderService = reminderService;
  }

  @Operation(summary = "List all reminders")
  @GetMapping
  public List<ReminderDto> getAll(@AuthenticationPrincipal final Jwt jwt) {
    return reminderService.getAll(UUID.fromString(jwt.getSubject()));
  }

  @Operation(summary = "Get all changes since a timestamp (for delta sync)")
  @GetMapping("/changes")
  public List<ReminderDto> getChanges(
    @AuthenticationPrincipal final Jwt jwt,
    @RequestParam final Instant since
  ) {
    return reminderService.getChangesSince(UUID.fromString(jwt.getSubject()), since);
  }

  @Operation(summary = "Create a reminder")
  @PostMapping
  public ResponseEntity<ReminderDto> create(
    @AuthenticationPrincipal final Jwt jwt,
    @Valid @RequestBody final ReminderDto dto
  ) {
    final ReminderDto created = reminderService.create(UUID.fromString(jwt.getSubject()), dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @Operation(summary = "Upsert a reminder by ID (creates if not found, updates if found)")
  @PutMapping("/{id}")
  public ReminderDto upsert(
    @AuthenticationPrincipal final Jwt jwt,
    @PathVariable final UUID id,
    @Valid @RequestBody final ReminderDto dto
  ) {
    return reminderService.upsert(UUID.fromString(jwt.getSubject()), id, dto);
  }

  @Operation(summary = "Soft-delete a reminder")
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
    @AuthenticationPrincipal final Jwt jwt,
    @PathVariable final UUID id
  ) {
    reminderService.delete(UUID.fromString(jwt.getSubject()), id);
    return ResponseEntity.noContent().build();
  }
}
