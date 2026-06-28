package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.UserDietProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data repository for {@link UserDietProfile} entities. Each user has at most one diet
 * profile (UNIQUE on user_id).
 */
public interface UserDietProfileRepository extends JpaRepository<UserDietProfile, UUID> {

  /**
   * Returns the diet profile for a user, or empty if none exists.
   *
   * @param userId the user ID
   * @return the user's diet profile
   */
  Optional<UserDietProfile> findByUserId(UUID userId);

  /**
   * Hard-deletes the diet profile for a user. Called during account deletion.
   *
   * @param userId the user ID
   */
  void deleteByUserId(UUID userId);
}
