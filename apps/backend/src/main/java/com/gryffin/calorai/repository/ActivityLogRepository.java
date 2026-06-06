package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.ActivityLog;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Repository for ActivityLog entities. */
public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {

  /** Find non-deleted logs for a user on a specific date. */
  List<ActivityLog> findByUserIdAndDateLoggedAndDeletedAtIsNull(
      UUID userId, LocalDate dateLogged);

  /** Find all logs (including deleted) updated after the given timestamp for delta sync. */
  List<ActivityLog> findByUserIdAndUpdatedAtAfter(UUID userId, Instant updatedAt);

  long countByUserId(UUID userId);
}
