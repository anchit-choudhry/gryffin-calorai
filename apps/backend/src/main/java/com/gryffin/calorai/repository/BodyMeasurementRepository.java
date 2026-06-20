package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.BodyMeasurement;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Repository for BodyMeasurement entities. */
public interface BodyMeasurementRepository extends JpaRepository<BodyMeasurement, UUID> {

  /** Find all non-deleted measurements for a user, newest first. */
  List<BodyMeasurement> findByUserIdAndDeletedAtIsNullOrderByDateLoggedDesc(UUID userId);

  /** Find all measurements (including deleted) updated after the given timestamp for delta sync. */
  List<BodyMeasurement> findByUserIdAndUpdatedAtAfter(UUID userId, Instant updatedAt);

  long countByUserId(UUID userId);

  /**
   * Delete all body measurements for a user.
   *
   * @param userId the user ID
   */
  void deleteAllByUserId(UUID userId);
}
