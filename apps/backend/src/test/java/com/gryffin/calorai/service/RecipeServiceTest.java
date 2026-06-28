package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.RecipeDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.Recipe;
import com.gryffin.calorai.entity.RecipeIngredient;
import com.gryffin.calorai.repository.RecipeRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.time.Instant;
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
class RecipeServiceTest {

  @Mock
  private RecipeRepository recipeRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private AppUser user;

  @InjectMocks
  private RecipeService recipeService;

  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    BDDMockito.given(user.getId()).willReturn(userId);
  }

  @Test
  void getAllReturnsNonDeletedRecipes() {
    final var recipe = buildRecipe("Pasta");
    BDDMockito.given(
        recipeRepository.findByUserIdAndDeletedAtIsNullOrderByDateCreatedDesc(userId))
      .willReturn(List.of(recipe));

    final var result = recipeService.getAll(userId);

    Assertions.assertThat(result).hasSize(1);
    Assertions.assertThat(result.getFirst().name()).isEqualTo("Pasta");
  }

  @Test
  void getChangesSinceReturnsDeltaRecipes() {
    final var since = Instant.now().minusSeconds(3600);
    BDDMockito.given(recipeRepository.findByUserIdAndUpdatedAtAfter(userId, since))
      .willReturn(List.of(buildRecipe("Salad")));

    final var result = recipeService.getChangesSince(userId, since);

    Assertions.assertThat(result).hasSize(1);
    Assertions.assertThat(result.getFirst().name()).isEqualTo("Salad");
  }

  @Test
  void createPersistsAndReturnsDto() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    final var saved = buildRecipe("Soup");
    BDDMockito.given(recipeRepository.save(ArgumentMatchers.any())).willReturn(saved);

    final var dto = buildDto("Soup");
    final var result = recipeService.create(userId, dto);

    Assertions.assertThat(result.name()).isEqualTo("Soup");
  }

  @Test
  void createThrowsWhenUserNotFound() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.empty());

    final var dto = buildDto("Stew");
    Assertions.assertThatThrownBy(() -> recipeService.create(userId, dto))
      .isInstanceOf(NoSuchElementException.class);
  }

  @Test
  void upsertCreatesNewRecipeWhenIdNotFound() {
    final var recipeId = UUID.randomUUID();
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    BDDMockito.given(recipeRepository.findById(recipeId)).willReturn(Optional.empty());
    BDDMockito.given(recipeRepository.save(ArgumentMatchers.any()))
      .willReturn(buildRecipe("Risotto"));

    final var dto = buildDto("Risotto");
    final var result = recipeService.upsert(userId, recipeId, dto);

    Assertions.assertThat(result).isNotNull();
  }

  @Test
  void upsertUpdatesExistingRecipeWithoutQueryingUserRepository() {
    final var recipeId = UUID.randomUUID();
    final var existing = buildRecipe("Ramen");
    existing.setId(recipeId);
    BDDMockito.given(recipeRepository.findById(recipeId)).willReturn(Optional.of(existing));
    BDDMockito.given(recipeRepository.save(ArgumentMatchers.any())).willReturn(existing);

    final var dto = buildDto("Ramen Deluxe");
    recipeService.upsert(userId, recipeId, dto);

    BDDMockito.then(userRepository).shouldHaveNoInteractions();
    final var captor = ArgumentCaptor.forClass(Recipe.class);
    BDDMockito.then(recipeRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getName()).isEqualTo("Ramen Deluxe");
  }

  @Test
  void deleteSetsDeletedAt() {
    final var recipeId = UUID.randomUUID();
    final var recipe = buildRecipe("Tacos");
    BDDMockito.given(recipeRepository.findById(recipeId)).willReturn(Optional.of(recipe));

    recipeService.delete(userId, recipeId);

    final var captor = ArgumentCaptor.forClass(Recipe.class);
    BDDMockito.then(recipeRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getDeletedAt()).isNotNull();
  }

  @Test
  void deleteThrowsWhenNotFound() {
    final var recipeId = UUID.randomUUID();
    BDDMockito.given(recipeRepository.findById(recipeId)).willReturn(Optional.empty());

    Assertions.assertThatThrownBy(() -> recipeService.delete(userId, recipeId))
      .isInstanceOf(NoSuchElementException.class);
  }

  private Recipe buildRecipe(final String name) {
    final var recipe = new Recipe();
    recipe.setId(UUID.randomUUID());
    recipe.setUser(user);
    recipe.setName(name);
    recipe.setDescription("");
    recipe.setIngredients(List.of(new RecipeIngredient("food-1", 1.0, 100.0)));
    recipe.setTotalCalories(200);
    recipe.setCreatedBy(userId.toString());
    recipe.setDateCreated("2026-01-01");
    return recipe;
  }

  private RecipeDto buildDto(final String name) {
    return new RecipeDto(
      null, name, "", List.of(new RecipeIngredient("food-1", 1.0, 100.0)),
      200, null, null, null, userId.toString(), "2026-01-01", null, null
    );
  }
}
