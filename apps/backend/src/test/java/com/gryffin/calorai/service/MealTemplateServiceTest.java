package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.MealTemplateDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.MealTemplate;
import com.gryffin.calorai.entity.MealTemplateFoodEntry;
import com.gryffin.calorai.repository.MealTemplateRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
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
class MealTemplateServiceTest {

  @Mock
  private MealTemplateRepository mealTemplateRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private AppUser user;

  @InjectMocks
  private MealTemplateService mealTemplateService;

  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    BDDMockito.given(user.getId()).willReturn(userId);
  }

  @Test
  void getAllReturnsNonDeletedTemplates() {
    final var template = buildTemplate("Breakfast Pack");
    BDDMockito.given(
        mealTemplateRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId))
      .willReturn(List.of(template));

    final var result = mealTemplateService.getAll(userId);

    Assertions.assertThat(result).hasSize(1);
    Assertions.assertThat(result.getFirst().name()).isEqualTo("Breakfast Pack");
  }

  @Test
  void getChangesSinceReturnsDeltaTemplates() {
    final var since = Instant.now().minusSeconds(3600);
    BDDMockito.given(mealTemplateRepository.findByUserIdAndUpdatedAtAfter(userId, since))
      .willReturn(List.of(buildTemplate("Lunch Pack")));

    final var result = mealTemplateService.getChangesSince(userId, since);

    Assertions.assertThat(result).hasSize(1);
    Assertions.assertThat(result.getFirst().name()).isEqualTo("Lunch Pack");
  }

  @Test
  void createPersistsAndReturnsDto() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    final var saved = buildTemplate("Dinner Pack");
    BDDMockito.given(mealTemplateRepository.save(ArgumentMatchers.any())).willReturn(saved);

    final var dto = buildDto("Dinner Pack");
    final var result = mealTemplateService.create(userId, dto);

    Assertions.assertThat(result.name()).isEqualTo("Dinner Pack");
  }

  @Test
  void createThrowsWhenUserNotFound() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.empty());

    Assertions.assertThatThrownBy(() -> mealTemplateService.create(userId, buildDto("Snack Pack")))
      .isInstanceOf(NoSuchElementException.class);
  }

  @Test
  void upsertCreatesNewTemplateWhenIdNotFound() {
    final var templateId = UUID.randomUUID();
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    BDDMockito.given(mealTemplateRepository.findById(templateId)).willReturn(Optional.empty());
    BDDMockito.given(mealTemplateRepository.save(ArgumentMatchers.any()))
      .willReturn(buildTemplate("Quick Pack"));

    final var result = mealTemplateService.upsert(userId, templateId, buildDto("Quick Pack"));

    Assertions.assertThat(result).isNotNull();
  }

  @Test
  void upsertUpdatesExistingTemplateWithoutQueryingUserRepository() {
    final var templateId = UUID.randomUUID();
    final var existing = buildTemplate("Old Pack");
    existing.setId(templateId);
    BDDMockito.given(mealTemplateRepository.findById(templateId))
      .willReturn(Optional.of(existing));
    BDDMockito.given(mealTemplateRepository.save(ArgumentMatchers.any())).willReturn(existing);

    mealTemplateService.upsert(userId, templateId, buildDto("New Pack"));

    BDDMockito.then(userRepository).shouldHaveNoInteractions();
    final var captor = ArgumentCaptor.forClass(MealTemplate.class);
    BDDMockito.then(mealTemplateRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getName()).isEqualTo("New Pack");
  }

  @Test
  void deleteSetsDeletedAt() {
    final var templateId = UUID.randomUUID();
    final var template = buildTemplate("Macro Pack");
    BDDMockito.given(mealTemplateRepository.findById(templateId))
      .willReturn(Optional.of(template));

    mealTemplateService.delete(userId, templateId);

    final var captor = ArgumentCaptor.forClass(MealTemplate.class);
    BDDMockito.then(mealTemplateRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getDeletedAt()).isNotNull();
  }

  @Test
  void deleteThrowsWhenNotFound() {
    final var templateId = UUID.randomUUID();
    BDDMockito.given(mealTemplateRepository.findById(templateId)).willReturn(Optional.empty());

    Assertions.assertThatThrownBy(() -> mealTemplateService.delete(userId, templateId))
      .isInstanceOf(NoSuchElementException.class);
  }

  private MealTemplate buildTemplate(final String name) {
    final var template = new MealTemplate();
    template.setId(UUID.randomUUID());
    template.setUser(user);
    template.setName(name);
    template.setFoods(List.of(new MealTemplateFoodEntry("food-1", 1.0, 100.0, Map.of())));
    return template;
  }

  private MealTemplateDto buildDto(final String name) {
    return new MealTemplateDto(
      null, name,
      List.of(new MealTemplateFoodEntry("food-1", 1.0, 100.0, Map.of())),
      null, null, null
    );
  }
}
