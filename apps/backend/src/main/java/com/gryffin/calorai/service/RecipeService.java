package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.RecipeDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.Recipe;
import com.gryffin.calorai.repository.RecipeRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for recipe CRUD and delta-sync operations.
 */
@Service
public class RecipeService {

  private final RecipeRepository recipeRepository;
  private final UserRepository userRepository;

  public RecipeService(
    final RecipeRepository recipeRepository,
    final UserRepository userRepository
  ) {
    this.recipeRepository = recipeRepository;
    this.userRepository = userRepository;
  }

  /**
   * Returns all non-deleted recipes for a user.
   *
   * @param userId the user ID
   * @return list of recipe DTOs
   */
  public List<RecipeDto> getAll(final UUID userId) {
    return recipeRepository.findByUserIdAndDeletedAtIsNullOrderByDateCreatedDesc(userId)
      .stream().map(this::toDto).toList();
  }

  /**
   * Returns all recipes updated after the given timestamp (for delta sync).
   *
   * @param userId the user ID
   * @param since  the lower bound (exclusive)
   * @return list of recipe DTOs
   */
  public List<RecipeDto> getChangesSince(final UUID userId, final Instant since) {
    return recipeRepository.findByUserIdAndUpdatedAtAfter(userId, since)
      .stream().map(this::toDto).toList();
  }

  /**
   * Creates a new recipe for the given user.
   *
   * @param userId the user ID
   * @param dto    the recipe data
   * @return the created recipe DTO
   */
  @Transactional
  public RecipeDto create(final UUID userId, final RecipeDto dto) {
    final AppUser user = userRepository.findById(userId)
      .orElseThrow(() -> new NoSuchElementException("User not found"));
    final Recipe recipe = new Recipe();
    recipe.setUser(user);
    applyDto(recipe, dto);
    return toDto(recipeRepository.save(recipe));
  }

  /**
   * Upserts a recipe by its client-provided ID (creates if absent, updates if present).
   *
   * @param userId   the user ID
   * @param recipeId the client-provided UUID (used as PK)
   * @param dto      the recipe data
   * @return the upserted recipe DTO
   */
  @Transactional
  public RecipeDto upsert(final UUID userId, final UUID recipeId, final RecipeDto dto) {
    final Recipe recipe = recipeRepository.findById(recipeId)
      .filter(r -> r.getUser().getId().equals(userId))
      .orElseGet(() -> {
        final AppUser user = userRepository.findById(userId)
          .orElseThrow(() -> new NoSuchElementException("User not found"));
        final var newRecipe = new Recipe();
        newRecipe.setId(recipeId);
        newRecipe.setUser(user);
        return newRecipe;
      });

    applyDto(recipe, dto);
    recipe.setDeletedAt(null);
    return toDto(recipeRepository.save(recipe));
  }

  /**
   * Soft-deletes a recipe by setting its deletedAt timestamp.
   *
   * @param userId   the user ID
   * @param recipeId the recipe ID
   */
  @Transactional
  public void delete(final UUID userId, final UUID recipeId) {
    final Recipe recipe = recipeRepository.findById(recipeId)
      .filter(r -> r.getUser().getId().equals(userId))
      .orElseThrow(() -> new NoSuchElementException("Recipe not found"));
    recipe.setDeletedAt(Instant.now());
    recipeRepository.save(recipe);
  }

  /**
   * Hard-deletes all recipes for a user. Called during account deletion.
   *
   * @param userId the user ID
   */
  @Transactional
  public void deleteAllByUserId(final UUID userId) {
    recipeRepository.deleteAllByUserId(userId);
  }

  private void applyDto(final Recipe recipe, final RecipeDto dto) {
    recipe.setName(dto.name());
    recipe.setDescription(dto.description());
    recipe.setIngredients(dto.ingredients());
    recipe.setTotalCalories(dto.totalCalories());
    recipe.setTotalProtein(dto.totalProtein());
    recipe.setTotalCarbs(dto.totalCarbs());
    recipe.setTotalFat(dto.totalFat());
    recipe.setCreatedBy(dto.createdBy());
    recipe.setDateCreated(dto.dateCreated());
  }

  private RecipeDto toDto(final Recipe recipe) {
    return new RecipeDto(
      recipe.getId().toString(),
      recipe.getName(),
      recipe.getDescription(),
      recipe.getIngredients(),
      recipe.getTotalCalories(),
      recipe.getTotalProtein(),
      recipe.getTotalCarbs(),
      recipe.getTotalFat(),
      recipe.getCreatedBy(),
      recipe.getDateCreated(),
      recipe.getUpdatedAt(),
      recipe.getDeletedAt()
    );
  }
}
