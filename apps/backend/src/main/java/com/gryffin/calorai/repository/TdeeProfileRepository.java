package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.TdeeProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for TdeeProfile entities.
 */
public interface TdeeProfileRepository extends JpaRepository<TdeeProfile, UUID> {

  /**
   * Find the TDEE profile for a user.
   *
   * @param userId the user ID
   * @return the profile if it exists
   */
  Optional<TdeeProfile> findByUserId(UUID userId);

  /**
   * Delete the TDEE profile for a user.
   *
   * @param userId the user ID
   */
  void deleteByUserId(UUID userId);
}
