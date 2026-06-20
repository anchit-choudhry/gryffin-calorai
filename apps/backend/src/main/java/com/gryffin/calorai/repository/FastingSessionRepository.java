package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.FastingSession;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Repository for FastingSession entities. */
public interface FastingSessionRepository extends JpaRepository<FastingSession, UUID> {

  /** Find all non-deleted sessions for a user, newest first. */
  List<FastingSession> findByUserIdAndDeletedAtIsNullOrderByStartTimeDesc(UUID userId);

  /** Find the most recent active (not completed, not deleted) session for a user. */
  Optional<FastingSession> findFirstByUserIdAndCompletedFalseAndDeletedAtIsNullOrderByStartTimeDesc(
      UUID userId);

  /** Find all sessions (including deleted) updated after the given timestamp for delta sync. */
  List<FastingSession> findByUserIdAndUpdatedAtAfter(UUID userId, Instant updatedAt);

  long countByUserId(UUID userId);

  /**
   * Delete all fasting sessions for a user.
   *
   * @param userId the user ID
   */
  void deleteAllByUserId(UUID userId);
}
