package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.EncryptedBlobDto;
import com.gryffin.calorai.dto.UserE2ESaltDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.EncryptedBlob;
import com.gryffin.calorai.entity.UserE2EConfig;
import com.gryffin.calorai.repository.EncryptedBlobRepository;
import com.gryffin.calorai.repository.UserE2EConfigRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Service for E2E encrypted blob storage and salt management. */
@Service
public class EncryptedBlobService {

  private final EncryptedBlobRepository blobRepository;
  private final UserE2EConfigRepository configRepository;
  private final UserRepository userRepository;

  /** Constructor injection. */
  public EncryptedBlobService(
      final EncryptedBlobRepository blobRepository,
      final UserE2EConfigRepository configRepository,
      final UserRepository userRepository) {
    this.blobRepository = blobRepository;
    this.configRepository = configRepository;
    this.userRepository = userRepository;
  }

  /**
   * Returns the PBKDF2 salt for a user, or empty if E2E has not been configured.
   *
   * @param userId the user ID
   * @return salt DTO or empty
   */
  public Optional<UserE2ESaltDto> getSalt(final UUID userId) {
    return configRepository.findById(userId)
        .map(c -> new UserE2ESaltDto(c.getSalt()));
  }

  /**
   * Stores or updates the PBKDF2 salt for a user. Safe to call multiple times (upsert).
   *
   * @param userId the user ID
   * @param dto the salt payload
   */
  @Transactional
  public void saveSalt(final UUID userId, final UserE2ESaltDto dto) {
    final UserE2EConfig config = configRepository.findById(userId)
        .orElseGet(() -> {
          final UserE2EConfig newConfig = new UserE2EConfig();
          newConfig.setUserId(userId);
          return newConfig;
        });
    config.setSalt(dto.salt());
    configRepository.save(config);
  }

  /**
   * Upserts a batch of encrypted blobs for a user. Idempotent: re-uploading the same
   * clientBlobId replaces iv and ciphertext.
   *
   * @param userId the user ID
   * @param dtos the blobs to upsert
   */
  @Transactional
  public void upsertBlobs(final UUID userId, final List<EncryptedBlobDto> dtos) {
    final AppUser user = userRepository.findById(userId)
        .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
    for (final EncryptedBlobDto dto : dtos) {
      final EncryptedBlob blob = blobRepository
          .findByUserIdAndClientBlobId(userId, dto.clientBlobId())
          .orElseGet(() -> {
            final EncryptedBlob newBlob = new EncryptedBlob();
            newBlob.setUser(user);
            newBlob.setClientBlobId(dto.clientBlobId());
            return newBlob;
          });
      blob.setIv(dto.iv());
      blob.setCiphertext(dto.ciphertext());
      blob.setDeleted(dto.isDeleted());
      blobRepository.save(blob);
    }
  }

  /**
   * Returns blobs updated after the given instant, up to the given limit, for delta pull.
   *
   * @param userId the user ID
   * @param since the cutoff timestamp (exclusive)
   * @param limit maximum number of blobs to return
   * @return list of blob DTOs ordered by updatedAt ascending
   */
  public List<EncryptedBlobDto> getBlobsSince(
      final UUID userId, final Instant since, final int limit) {
    return blobRepository
        .findByUserIdAndUpdatedAtAfterOrderByUpdatedAtAsc(userId, since)
        .stream()
        .limit(limit)
        .map(this::toDto)
        .toList();
  }

  /**
   * Deletes all encrypted blobs for a user (used when wiping before re-upload).
   *
   * @param userId the user ID
   */
  @Transactional
  public void deleteAllBlobs(final UUID userId) {
    blobRepository.deleteAllByUserId(userId);
  }

  private EncryptedBlobDto toDto(final EncryptedBlob blob) {
    return new EncryptedBlobDto(
        blob.getClientBlobId(),
        blob.getIv(),
        blob.getCiphertext(),
        blob.getUpdatedAt(),
        blob.isDeleted()
    );
  }
}
