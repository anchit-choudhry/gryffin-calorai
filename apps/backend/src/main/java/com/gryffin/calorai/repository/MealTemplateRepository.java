package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.MealTemplate;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data repository for {@link MealTemplate} entities.
 */
public interface MealTemplateRepository extends JpaRepository<MealTemplate, UUID> {

  /**
   * Returns all non-deleted meal templates for a user, newest first.
   *
   * @param userId the user ID
   * @return list of non-deleted meal templates
   */
  List<MealTemplate> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId);

  /**
   * Returns all meal templates updated after a timestamp (for delta sync), including deleted ones.
   *
   * @param userId the user ID
   * @param since  the lower bound (exclusive)
   * @return list of meal templates updated after the given timestamp
   */
  List<MealTemplate> findByUserIdAndUpdatedAtAfter(UUID userId, Instant since);

  /**
   * Hard-deletes all meal templates belonging to a user. Called during account deletion.
   *
   * @param userId the user ID
   */
  void deleteAllByUserId(UUID userId);
}
