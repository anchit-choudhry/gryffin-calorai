package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.StepLog;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for StepLog entities.
 */
public interface StepLogRepository extends JpaRepository<StepLog, UUID> {

  /**
   * Find all non-deleted logs for a user, newest first.
   */
  List<StepLog> findByUserIdAndDeletedAtIsNullOrderByDateLoggedDesc(UUID userId);

  /**
   * Find a non-deleted log for a user on a specific date.
   */
  Optional<StepLog> findByUserIdAndDateLoggedAndDeletedAtIsNull(
    UUID userId, LocalDate dateLogged);

  /**
   * Find all logs (including deleted) updated after the given timestamp for delta sync.
   */
  List<StepLog> findByUserIdAndUpdatedAtAfter(UUID userId, Instant updatedAt);

  long countByUserId(UUID userId);

  /**
   * Delete all step logs for a user.
   *
   * @param userId the user ID
   */
  void deleteAllByUserId(UUID userId);
}
