package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.WaterLog;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Repository for WaterLog entities. */
public interface WaterLogRepository extends JpaRepository<WaterLog, UUID> {

  /** Find non-deleted logs for a user on a specific date. */
  List<WaterLog> findByUserIdAndDateLoggedAndDeletedAtIsNull(
      UUID userId, LocalDate dateLogged);

  /** Find all logs (including deleted) updated after the given timestamp for delta sync. */
  List<WaterLog> findByUserIdAndUpdatedAtAfter(UUID userId, Instant updatedAt);

  long countByUserId(UUID userId);

  /**
   * Delete all water logs for a user.
   *
   * @param userId the user ID
   */
  void deleteAllByUserId(UUID userId);
}
