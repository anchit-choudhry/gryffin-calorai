package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.MealTemplateDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.MealTemplate;
import com.gryffin.calorai.repository.MealTemplateRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for meal template CRUD and delta-sync operations.
 */
@Service
public class MealTemplateService {

  private final MealTemplateRepository mealTemplateRepository;
  private final UserRepository userRepository;

  public MealTemplateService(
    final MealTemplateRepository mealTemplateRepository,
    final UserRepository userRepository
  ) {
    this.mealTemplateRepository = mealTemplateRepository;
    this.userRepository = userRepository;
  }

  /**
   * Returns all non-deleted meal templates for a user.
   *
   * @param userId the user ID
   * @return list of meal template DTOs
   */
  public List<MealTemplateDto> getAll(final UUID userId) {
    return mealTemplateRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
      .stream().map(this::toDto).toList();
  }

  /**
   * Returns all meal templates updated after the given timestamp (for delta sync).
   *
   * @param userId the user ID
   * @param since  the lower bound (exclusive)
   * @return list of meal template DTOs
   */
  public List<MealTemplateDto> getChangesSince(final UUID userId, final Instant since) {
    return mealTemplateRepository.findByUserIdAndUpdatedAtAfter(userId, since)
      .stream().map(this::toDto).toList();
  }

  /**
   * Creates a new meal template for the given user.
   *
   * @param userId the user ID
   * @param dto    the meal template data
   * @return the created meal template DTO
   */
  @Transactional
  public MealTemplateDto create(final UUID userId, final MealTemplateDto dto) {
    final AppUser user = userRepository.findById(userId)
      .orElseThrow(() -> new NoSuchElementException("User not found"));
    final MealTemplate template = new MealTemplate();
    template.setUser(user);
    applyDto(template, dto);
    return toDto(mealTemplateRepository.save(template));
  }

  /**
   * Upserts a meal template by its client-provided ID (creates if absent, updates if present).
   *
   * @param userId     the user ID
   * @param templateId the client-provided UUID (used as PK)
   * @param dto        the meal template data
   * @return the upserted meal template DTO
   */
  @Transactional
  public MealTemplateDto upsert(
    final UUID userId,
    final UUID templateId,
    final MealTemplateDto dto
  ) {
    final MealTemplate template = mealTemplateRepository.findById(templateId)
      .filter(t -> t.getUser().getId().equals(userId))
      .orElseGet(() -> {
        final AppUser user = userRepository.findById(userId)
          .orElseThrow(() -> new NoSuchElementException("User not found"));
        final var newTemplate = new MealTemplate();
        newTemplate.setId(templateId);
        newTemplate.setUser(user);
        return newTemplate;
      });

    applyDto(template, dto);
    template.setDeletedAt(null);
    return toDto(mealTemplateRepository.save(template));
  }

  /**
   * Soft-deletes a meal template by setting its deletedAt timestamp.
   *
   * @param userId     the user ID
   * @param templateId the meal template ID
   */
  @Transactional
  public void delete(final UUID userId, final UUID templateId) {
    final MealTemplate template = mealTemplateRepository.findById(templateId)
      .filter(t -> t.getUser().getId().equals(userId))
      .orElseThrow(() -> new NoSuchElementException("Meal template not found"));
    template.setDeletedAt(Instant.now());
    mealTemplateRepository.save(template);
  }

  /**
   * Hard-deletes all meal templates for a user. Called during account deletion.
   *
   * @param userId the user ID
   */
  @Transactional
  public void deleteAllByUserId(final UUID userId) {
    mealTemplateRepository.deleteAllByUserId(userId);
  }

  private void applyDto(final MealTemplate template, final MealTemplateDto dto) {
    template.setName(dto.name());
    template.setFoods(dto.foods());
  }

  private MealTemplateDto toDto(final MealTemplate template) {
    return new MealTemplateDto(
      template.getId().toString(),
      template.getName(),
      template.getFoods(),
      template.getCreatedAt(),
      template.getUpdatedAt(),
      template.getDeletedAt()
    );
  }
}
