package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.PushSubscription;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data repository for {@link PushSubscription} entities.
 */
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, UUID> {

  /**
   * Returns all push subscriptions for a given user.
   *
   * @param userId the user ID
   * @return list of subscriptions
   */
  List<PushSubscription> findByUserId(UUID userId);

  /**
   * Returns a subscription by user and endpoint URL, if it exists.
   *
   * @param userId   the user ID
   * @param endpoint the push service endpoint URL
   * @return the subscription if found
   */
  Optional<PushSubscription> findByUserIdAndEndpoint(UUID userId, String endpoint);

  /**
   * Deletes a subscription by user and endpoint URL.
   *
   * @param userId   the user ID
   * @param endpoint the push service endpoint URL
   */
  void deleteByUserIdAndEndpoint(UUID userId, String endpoint);
}
