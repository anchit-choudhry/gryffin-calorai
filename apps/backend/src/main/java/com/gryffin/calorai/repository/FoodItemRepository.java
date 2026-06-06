package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.FoodItem;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Repository for food item persistence and delta-sync queries. */
public interface FoodItemRepository extends JpaRepository<FoodItem, UUID> {

  /**
   * Find non-deleted food items logged on a specific date for a user.
   *
   * @param userId the user ID
   * @param dateLogged the date to query
   * @return non-deleted food items for that date
   */
  List<FoodItem> findByUserIdAndDateLoggedAndDeletedAtIsNull(UUID userId, LocalDate dateLogged);

  /**
   * Find non-deleted favourite food items for a user.
   *
   * @param userId the user ID
   * @return non-deleted favourite food items
   */
  List<FoodItem> findByUserIdAndIsFavoriteTrueAndDeletedAtIsNull(UUID userId);

  /**
   * Find all food items (including soft-deleted) updated after a timestamp for delta sync.
   *
   * @param userId the user ID
   * @param since the cutoff timestamp
   * @return food items updated after the timestamp
   */
  List<FoodItem> findByUserIdAndUpdatedAtAfter(UUID userId, Instant since);

  /** Count non-deleted food items for a user. */
  long countByUserIdAndDeletedAtIsNull(UUID userId);
}
