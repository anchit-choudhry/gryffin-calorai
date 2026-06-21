package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.EncryptedBlob;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for encrypted sync blobs.
 */
public interface EncryptedBlobRepository extends JpaRepository<EncryptedBlob, UUID> {

  /**
   * Find blobs for a user updated after the given instant, ordered oldest-first.
   *
   * @param userId    the user ID
   * @param updatedAt the cutoff timestamp (exclusive)
   * @return list of matching blobs
   */
  List<EncryptedBlob> findByUserIdAndUpdatedAtAfterOrderByUpdatedAtAsc(
    UUID userId, Instant updatedAt);

  /**
   * Find a blob by its user and client-assigned ID.
   *
   * @param userId       the user ID
   * @param clientBlobId the client-assigned blob ID
   * @return the blob if it exists
   */
  Optional<EncryptedBlob> findByUserIdAndClientBlobId(UUID userId, String clientBlobId);

  /**
   * Delete all blobs for a user.
   *
   * @param userId the user ID
   */
  void deleteAllByUserId(UUID userId);
}
