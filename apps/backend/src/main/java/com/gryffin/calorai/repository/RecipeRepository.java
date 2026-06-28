package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.Recipe;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data repository for {@link Recipe} entities.
 */
public interface RecipeRepository extends JpaRepository<Recipe, UUID> {

  /**
   * Returns all non-deleted recipes for a user, newest first.
   *
   * @param userId the user ID
   * @return list of non-deleted recipes
   */
  List<Recipe> findByUserIdAndDeletedAtIsNullOrderByDateCreatedDesc(UUID userId);

  /**
   * Returns all recipes updated after a timestamp (for delta sync), including deleted ones.
   *
   * @param userId the user ID
   * @param since  the lower bound (exclusive)
   * @return list of recipes updated after the given timestamp
   */
  List<Recipe> findByUserIdAndUpdatedAtAfter(UUID userId, Instant since);

  /**
   * Hard-deletes all recipes belonging to a user. Called during account deletion.
   *
   * @param userId the user ID
   */
  void deleteAllByUserId(UUID userId);
}
