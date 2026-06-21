package com.gryffin.calorai.controller;

import com.gryffin.calorai.dto.FastingSessionDto;
import com.gryffin.calorai.service.FastingSessionService;
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
 * REST controller for intermittent fasting sessions.
 */
@Tag(name = "Fasting Sessions", description = "CRUD for intermittent fasting sessions")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/v1/fasting-sessions")
public class FastingSessionController {

  private final FastingSessionService fastingSessionService;

  public FastingSessionController(final FastingSessionService fastingSessionService) {
    this.fastingSessionService = fastingSessionService;
  }

  @Operation(summary = "List all fasting sessions (newest first)")
  @GetMapping
  public List<FastingSessionDto> getAll(@AuthenticationPrincipal final Jwt jwt) {
    return fastingSessionService.getAll(UUID.fromString(jwt.getSubject()));
  }

  @Operation(summary = "Get the currently active fasting session (not yet completed)")
  @GetMapping("/active")
  public ResponseEntity<FastingSessionDto> getActive(@AuthenticationPrincipal final Jwt jwt) {
    return fastingSessionService.getActive(UUID.fromString(jwt.getSubject()))
      .map(ResponseEntity::ok)
      .orElse(ResponseEntity.notFound().build());
  }

  @Operation(summary = "Get all changes since a timestamp (for delta sync)")
  @GetMapping("/changes")
  public List<FastingSessionDto> getChanges(
    @AuthenticationPrincipal final Jwt jwt,
    @RequestParam final Instant since
  ) {
    return fastingSessionService.getChangesSince(UUID.fromString(jwt.getSubject()), since);
  }

  @Operation(summary = "Start a new fasting session")
  @PostMapping
  public ResponseEntity<FastingSessionDto> create(
    @AuthenticationPrincipal final Jwt jwt,
    @Valid @RequestBody final FastingSessionDto dto
  ) {
    final FastingSessionDto created =
      fastingSessionService.create(UUID.fromString(jwt.getSubject()), dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @Operation(summary = "Upsert a fasting session by ID (creates if not found, updates if found)")
  @PutMapping("/{id}")
  public FastingSessionDto upsert(
    @AuthenticationPrincipal final Jwt jwt,
    @PathVariable final UUID id,
    @Valid @RequestBody final FastingSessionDto dto
  ) {
    return fastingSessionService.upsert(UUID.fromString(jwt.getSubject()), id, dto);
  }

  @Operation(summary = "Soft-delete a fasting session")
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
    @AuthenticationPrincipal final Jwt jwt,
    @PathVariable final UUID id
  ) {
    fastingSessionService.delete(UUID.fromString(jwt.getSubject()), id);
    return ResponseEntity.noContent().build();
  }
}
