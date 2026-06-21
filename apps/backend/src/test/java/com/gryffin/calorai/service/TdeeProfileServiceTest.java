package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.TdeeProfileDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.TdeeProfile;
import com.gryffin.calorai.repository.TdeeProfileRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.BDDMockito;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TdeeProfileServiceTest {

  @Mock
  private TdeeProfileRepository tdeeProfileRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private AppUser user;

  @InjectMocks
  private TdeeProfileService tdeeProfileService;

  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    BDDMockito.given(user.getId()).willReturn(userId);
  }

  @Test
  void getReturnsProfileWhenExists() {
    final var profile = buildProfile();
    BDDMockito.given(tdeeProfileRepository.findByUserId(userId)).willReturn(Optional.of(profile));

    final var result = tdeeProfileService.get(userId);

    Assertions.assertThat(result).isPresent();
    Assertions.assertThat(result.get().age()).isEqualTo(30);
    Assertions.assertThat(result.get().goal()).isEqualTo("maintain");
  }

  @Test
  void getReturnsEmptyWhenNoProfile() {
    BDDMockito.given(tdeeProfileRepository.findByUserId(userId)).willReturn(Optional.empty());

    final var result = tdeeProfileService.get(userId);

    Assertions.assertThat(result).isEmpty();
  }

  @Test
  void upsertCreatesProfileWhenNoneExists() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    BDDMockito.given(tdeeProfileRepository.findByUserId(userId)).willReturn(Optional.empty());
    final var saved = buildProfile();
    BDDMockito.given(tdeeProfileRepository.save(ArgumentMatchers.any())).willReturn(saved);

    final var dto = buildDto();
    final var result = tdeeProfileService.upsert(userId, dto);

    Assertions.assertThat(result.age()).isEqualTo(30);
    BDDMockito.then(tdeeProfileRepository).should()
      .save(ArgumentMatchers.any(TdeeProfile.class));
  }

  @Test
  void upsertUpdatesExistingProfile() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    final var existing = buildProfile();
    BDDMockito.given(tdeeProfileRepository.findByUserId(userId))
      .willReturn(Optional.of(existing));
    BDDMockito.given(tdeeProfileRepository.save(ArgumentMatchers.any())).willReturn(existing);

    final var dto = new TdeeProfileDto(null, 31, "male", 178.0, 77.0, "moderate", "lose", null);
    tdeeProfileService.upsert(userId, dto);

    final var captor = ArgumentCaptor.forClass(TdeeProfile.class);
    BDDMockito.then(tdeeProfileRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getAge()).isEqualTo(31);
    Assertions.assertThat(captor.getValue().getGoal()).isEqualTo("lose");
  }

  @Test
  void upsertThrowsWhenUserNotFound() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.empty());

    Assertions.assertThatThrownBy(() -> tdeeProfileService.upsert(userId, buildDto()))
      .isInstanceOf(NoSuchElementException.class);
  }

  private TdeeProfile buildProfile() {
    final var profile = new TdeeProfile();
    profile.setId(UUID.randomUUID());
    profile.setUser(user);
    profile.setAge(30);
    profile.setSex("male");
    profile.setHeightCm(180.0);
    profile.setWeightKg(75.0);
    profile.setActivityLevel("moderate");
    profile.setGoal("maintain");
    return profile;
  }

  private TdeeProfileDto buildDto() {
    return new TdeeProfileDto(null, 30, "male", 180.0, 75.0, "moderate", "maintain", null);
  }
}
