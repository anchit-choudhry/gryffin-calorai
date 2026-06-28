package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.DietProfileDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.UserDietProfile;
import com.gryffin.calorai.repository.UserDietProfileRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for the user diet profile singleton and sync operations. Each user has at most one diet
 * profile record.
 */
@Service
public class DietProfileService {

  private final UserDietProfileRepository dietProfileRepository;
  private final UserRepository userRepository;

  public DietProfileService(
    final UserDietProfileRepository dietProfileRepository,
    final UserRepository userRepository
  ) {
    this.dietProfileRepository = dietProfileRepository;
    this.userRepository = userRepository;
  }

  /**
   * Returns the user's diet profile, or empty if none has been saved yet.
   *
   * @param userId the user ID
   * @return the diet profile DTO, or empty
   */
  public Optional<DietProfileDto> get(final UUID userId) {
    return dietProfileRepository.findByUserId(userId).map(this::toDto);
  }

  /**
   * Creates the user's diet profile.
   *
   * @param userId the user ID
   * @param dto    the diet profile data
   * @return the created profile DTO
   */
  @Transactional
  public DietProfileDto create(final UUID userId, final DietProfileDto dto) {
    final AppUser user = userRepository.findById(userId)
      .orElseThrow(() -> new NoSuchElementException("User not found"));
    final UserDietProfile profile = new UserDietProfile();
    profile.setUser(user);
    applyDto(profile, dto);
    return toDto(dietProfileRepository.save(profile));
  }

  /**
   * Upserts the diet profile by its client-provided ID (creates if absent, updates if present).
   * Ownership is validated: the stored profile must belong to the requesting user.
   *
   * @param userId    the user ID
   * @param profileId the client-provided UUID (used as PK)
   * @param dto       the diet profile data
   * @return the upserted profile DTO
   */
  @Transactional
  public DietProfileDto upsert(final UUID userId, final UUID profileId, final DietProfileDto dto) {
    final UserDietProfile profile = dietProfileRepository.findById(profileId)
      .filter(p -> p.getUser().getId().equals(userId))
      .orElseGet(() -> {
        final AppUser user = userRepository.findById(userId)
          .orElseThrow(() -> new NoSuchElementException("User not found"));
        final var newProfile = new UserDietProfile();
        newProfile.setId(profileId);
        newProfile.setUser(user);
        return newProfile;
      });

    applyDto(profile, dto);
    profile.setDeletedAt(null);
    return toDto(dietProfileRepository.save(profile));
  }

  /**
   * Hard-deletes the diet profile for a user. Called during account deletion.
   *
   * @param userId the user ID
   */
  @Transactional
  public void deleteByUserId(final UUID userId) {
    dietProfileRepository.deleteByUserId(userId);
  }

  private void applyDto(final UserDietProfile profile, final DietProfileDto dto) {
    profile.setPreset(dto.preset());
    profile.setRestrictions(dto.restrictions());
  }

  private DietProfileDto toDto(final UserDietProfile profile) {
    return new DietProfileDto(
      profile.getId().toString(),
      profile.getPreset(),
      profile.getRestrictions(),
      profile.getUpdatedAt(),
      profile.getDeletedAt()
    );
  }
}
