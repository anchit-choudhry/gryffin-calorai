package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.DietProfileDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.UserDietProfile;
import com.gryffin.calorai.repository.UserDietProfileRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.util.List;
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
class DietProfileServiceTest {

  @Mock
  private UserDietProfileRepository dietProfileRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private AppUser user;

  @InjectMocks
  private DietProfileService dietProfileService;

  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    BDDMockito.given(user.getId()).willReturn(userId);
  }

  @Test
  void getReturnsProfileWhenPresent() {
    final var profile = buildProfile("keto", List.of("gluten-free"));
    BDDMockito.given(dietProfileRepository.findByUserId(userId)).willReturn(Optional.of(profile));

    final var result = dietProfileService.get(userId);

    Assertions.assertThat(result).isPresent();
    Assertions.assertThat(result.get().preset()).isEqualTo("keto");
    Assertions.assertThat(result.get().restrictions()).containsExactly("gluten-free");
  }

  @Test
  void getReturnsEmptyWhenNoProfile() {
    BDDMockito.given(dietProfileRepository.findByUserId(userId)).willReturn(Optional.empty());

    final var result = dietProfileService.get(userId);

    Assertions.assertThat(result).isEmpty();
  }

  @Test
  void createPersistsAndReturnsDto() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    final var saved = buildProfile("vegan", List.of("dairy-free"));
    BDDMockito.given(dietProfileRepository.save(ArgumentMatchers.any())).willReturn(saved);

    final var dto = new DietProfileDto(null, "vegan", List.of("dairy-free"), null, null);
    final var result = dietProfileService.create(userId, dto);

    Assertions.assertThat(result.preset()).isEqualTo("vegan");
  }

  @Test
  void createThrowsWhenUserNotFound() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.empty());

    final var dto = new DietProfileDto(null, "generic", List.of(), null, null);
    Assertions.assertThatThrownBy(() -> dietProfileService.create(userId, dto))
      .isInstanceOf(NoSuchElementException.class);
  }

  @Test
  void upsertCreatesNewProfileWhenIdNotFound() {
    final var profileId = UUID.randomUUID();
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    BDDMockito.given(dietProfileRepository.findById(profileId)).willReturn(Optional.empty());
    BDDMockito.given(dietProfileRepository.save(ArgumentMatchers.any()))
      .willReturn(buildProfile("mediterranean", List.of()));

    final var dto = new DietProfileDto(null, "mediterranean", List.of(), null, null);
    final var result = dietProfileService.upsert(userId, profileId, dto);

    Assertions.assertThat(result).isNotNull();
  }

  @Test
  void upsertUpdatesExistingProfileWithoutQueryingUserRepository() {
    final var profileId = UUID.randomUUID();
    final var existing = buildProfile("generic", List.of());
    existing.setId(profileId);
    BDDMockito.given(dietProfileRepository.findById(profileId))
      .willReturn(Optional.of(existing));
    BDDMockito.given(dietProfileRepository.save(ArgumentMatchers.any())).willReturn(existing);

    final var dto = new DietProfileDto(null, "paleo", List.of("grain-free"), null, null);
    dietProfileService.upsert(userId, profileId, dto);

    BDDMockito.then(userRepository).shouldHaveNoInteractions();
    final var captor = ArgumentCaptor.forClass(UserDietProfile.class);
    BDDMockito.then(dietProfileRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getPreset()).isEqualTo("paleo");
    Assertions.assertThat(captor.getValue().getRestrictions()).containsExactly("grain-free");
  }

  private UserDietProfile buildProfile(final String preset, final List<String> restrictions) {
    final var profile = new UserDietProfile();
    profile.setId(UUID.randomUUID());
    profile.setUser(user);
    profile.setPreset(preset);
    profile.setRestrictions(restrictions);
    return profile;
  }
}
