package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.TdeeProfileDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.TdeeProfile;
import com.gryffin.calorai.repository.TdeeProfileRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Service for TDEE profile upsert and retrieval. */
@Service
public class TdeeProfileService {

  private final TdeeProfileRepository tdeeProfileRepository;
  private final UserRepository userRepository;

  public TdeeProfileService(final TdeeProfileRepository tdeeProfileRepository,
      final UserRepository userRepository) {
    this.tdeeProfileRepository = tdeeProfileRepository;
    this.userRepository = userRepository;
  }

  public Optional<TdeeProfileDto> get(final UUID userId) {
    return tdeeProfileRepository.findByUserId(userId).map(this::toDto);
  }

  @Transactional
  public TdeeProfileDto upsert(final UUID userId, final TdeeProfileDto dto) {
    final AppUser user = userRepository.findById(userId)
        .orElseThrow(() -> new NoSuchElementException("User not found"));

    final TdeeProfile profile = tdeeProfileRepository.findByUserId(userId)
        .orElseGet(() -> {
          final var newProfile = new TdeeProfile();
          newProfile.setUser(user);
          return newProfile;
        });

    profile.setAge(dto.age());
    profile.setSex(dto.sex());
    profile.setHeightCm(dto.heightCm());
    profile.setWeightKg(dto.weightKg());
    profile.setActivityLevel(dto.activityLevel());
    profile.setGoal(dto.goal());

    return toDto(tdeeProfileRepository.save(profile));
  }

  /**
   * Deletes the TDEE profile for a user. Called during E2E activation migration.
   *
   * @param userId the user ID
   */
  @Transactional
  public void deleteByUserId(final UUID userId) {
    tdeeProfileRepository.deleteByUserId(userId);
  }

  private TdeeProfileDto toDto(final TdeeProfile profile) {
    return new TdeeProfileDto(
        profile.getId().toString(),
        profile.getAge(),
        profile.getSex(),
        profile.getHeightCm(),
        profile.getWeightKg(),
        profile.getActivityLevel(),
        profile.getGoal(),
        profile.getUpdatedAt()
    );
  }
}
