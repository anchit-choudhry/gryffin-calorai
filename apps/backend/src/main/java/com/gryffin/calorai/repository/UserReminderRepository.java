package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.UserReminder;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data repository for {@link UserReminder} entities.
 */
public interface UserReminderRepository extends JpaRepository<UserReminder, UUID> {

  /**
   * Returns all non-deleted reminders for a user.
   *
   * @param userId the user ID
   * @return list of non-deleted reminders
   */
  List<UserReminder> findByUserIdAndDeletedAtIsNull(UUID userId);

  /**
   * Returns all reminders updated after a timestamp (for delta sync), including deleted ones.
   *
   * @param userId the user ID
   * @param since  the lower bound (exclusive)
   * @return list of reminders updated after the given timestamp
   */
  List<UserReminder> findByUserIdAndUpdatedAtAfter(UUID userId, Instant since);

  /**
   * Returns all enabled, non-deleted reminders across all users. Used by the push notification
   * scheduler to find reminders that are due at the current time.
   *
   * @return list of all enabled, non-deleted reminders
   */
  List<UserReminder> findByEnabledTrueAndDeletedAtIsNull();

  /**
   * Hard-deletes all reminders belonging to a user. Called during account deletion.
   *
   * @param userId the user ID
   */
  void deleteAllByUserId(UUID userId);
}
