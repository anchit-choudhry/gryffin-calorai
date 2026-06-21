package com.gryffin.calorai.controller;

import com.gryffin.calorai.dto.EncryptedBlobDto;
import com.gryffin.calorai.dto.UserE2ESaltDto;
import com.gryffin.calorai.service.ActivityLogService;
import com.gryffin.calorai.service.BodyMeasurementService;
import com.gryffin.calorai.service.EncryptedBlobService;
import com.gryffin.calorai.service.FastingSessionService;
import com.gryffin.calorai.service.FoodItemService;
import com.gryffin.calorai.service.StepLogService;
import com.gryffin.calorai.service.TdeeProfileService;
import com.gryffin.calorai.service.WaterLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for E2E encrypted blob sync and configuration.
 */
@Tag(name = "E2E Sync", description = "Encrypted blob storage and PBKDF2 salt management")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/v1/sync")
public class EncryptedBlobController {

  private final EncryptedBlobService blobService;
  private final FoodItemService foodItemService;
  private final WaterLogService waterLogService;
  private final ActivityLogService activityLogService;
  private final BodyMeasurementService bodyMeasurementService;
  private final StepLogService stepLogService;
  private final FastingSessionService fastingSessionService;
  private final TdeeProfileService tdeeProfileService;

  /**
   * Constructor injection.
   */
  public EncryptedBlobController(
    final EncryptedBlobService blobService,
    final FoodItemService foodItemService,
    final WaterLogService waterLogService,
    final ActivityLogService activityLogService,
    final BodyMeasurementService bodyMeasurementService,
    final StepLogService stepLogService,
    final FastingSessionService fastingSessionService,
    final TdeeProfileService tdeeProfileService) {
    this.blobService = blobService;
    this.foodItemService = foodItemService;
    this.waterLogService = waterLogService;
    this.activityLogService = activityLogService;
    this.bodyMeasurementService = bodyMeasurementService;
    this.stepLogService = stepLogService;
    this.fastingSessionService = fastingSessionService;
    this.tdeeProfileService = tdeeProfileService;
  }

  /**
   * Returns the PBKDF2 salt for this user. Returns 404 if E2E has not been configured. Used by
   * new-device detection on CloudSyncPanel mount.
   *
   * @param jwt the authenticated user's JWT
   * @return salt DTO or 404
   */
  @Operation(summary = "Get E2E salt", description = "Returns 404 if not configured")
  @GetMapping("/e2e-config")
  public ResponseEntity<UserE2ESaltDto> getE2EConfig(
    @AuthenticationPrincipal final Jwt jwt) {
    final UUID userId = UUID.fromString(jwt.getSubject());
    final Optional<UserE2ESaltDto> salt = blobService.getSalt(userId);
    return salt.map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }

  /**
   * Stores the PBKDF2 salt for this user. Idempotent upsert; safe to repeat.
   *
   * @param jwt the authenticated user's JWT
   * @param dto the salt payload
   * @return 204 No Content
   */
  @Operation(summary = "Store E2E salt")
  @PostMapping("/e2e-config")
  public ResponseEntity<Void> saveE2EConfig(
    @AuthenticationPrincipal final Jwt jwt,
    @Valid @RequestBody final UserE2ESaltDto dto) {
    final UUID userId = UUID.fromString(jwt.getSubject());
    blobService.saveSalt(userId, dto);
    return ResponseEntity.noContent().build();
  }

  /**
   * Upserts a batch of encrypted blobs. Idempotent: re-uploading the same clientBlobId overwrites
   * iv and ciphertext. Used during push and migration.
   *
   * @param jwt   the authenticated user's JWT
   * @param blobs the list of blobs to upsert
   * @return 204 No Content
   */
  @Operation(summary = "Batch upsert encrypted blobs")
  @PostMapping("/blobs/batch")
  public ResponseEntity<Void> batchUpsertBlobs(
    @AuthenticationPrincipal final Jwt jwt,
    @Valid @RequestBody final List<EncryptedBlobDto> blobs) {
    final UUID userId = UUID.fromString(jwt.getSubject());
    blobService.upsertBlobs(userId, blobs);
    return ResponseEntity.noContent().build();
  }

  /**
   * Returns blobs updated after the given timestamp. Supports delta pull. The optional limit
   * parameter is used for passphrase validation (limit=1).
   *
   * @param jwt   the authenticated user's JWT
   * @param since ISO-8601 timestamp; defaults to epoch if absent
   * @param limit maximum blobs to return; defaults to Integer.MAX_VALUE if absent
   * @return list of blob DTOs ordered by updatedAt ascending
   */
  @Operation(summary = "Delta pull encrypted blobs since timestamp")
  @GetMapping("/blobs")
  public ResponseEntity<List<EncryptedBlobDto>> getBlobs(
    @AuthenticationPrincipal final Jwt jwt,
    @RequestParam(required = false, defaultValue = "1970-01-01T00:00:00Z") final String since,
    @RequestParam(required = false, defaultValue = "2147483647") final int limit) {
    final UUID userId = UUID.fromString(jwt.getSubject());
    final Instant sinceInstant = Instant.parse(since);
    return ResponseEntity.ok(blobService.getBlobsSince(userId, sinceInstant, limit));
  }

  /**
   * Wipes all encrypted blobs for this user. Used before re-uploading under a new key.
   *
   * @param jwt the authenticated user's JWT
   * @return 204 No Content
   */
  @Operation(summary = "Delete all encrypted blobs for this user")
  @DeleteMapping("/blobs")
  public ResponseEntity<Void> deleteAllBlobs(
    @AuthenticationPrincipal final Jwt jwt) {
    final UUID userId = UUID.fromString(jwt.getSubject());
    blobService.deleteAllBlobs(userId);
    return ResponseEntity.noContent().build();
  }

  /**
   * Wipes all plaintext entity data for this user across seven tables. Called during E2E activation
   * before re-uploading encrypted blobs. Local IndexedDB is not affected.
   *
   * @param jwt the authenticated user's JWT
   * @return 204 No Content
   */
  @Operation(
    summary = "Wipe all plaintext entity data",
    description = "Deletes food items, water logs, activity logs, body measurements, "
      + "step logs, fasting sessions, and TDEE profile for this user. "
      + "Called once during E2E activation migration."
  )
  @PostMapping("/reset")
  public ResponseEntity<Void> resetPlaintextData(
    @AuthenticationPrincipal final Jwt jwt) {
    final UUID userId = UUID.fromString(jwt.getSubject());
    foodItemService.deleteAllByUserId(userId);
    waterLogService.deleteAllByUserId(userId);
    activityLogService.deleteAllByUserId(userId);
    bodyMeasurementService.deleteAllByUserId(userId);
    stepLogService.deleteAllByUserId(userId);
    fastingSessionService.deleteAllByUserId(userId);
    tdeeProfileService.deleteByUserId(userId);
    return ResponseEntity.noContent().build();
  }
}
