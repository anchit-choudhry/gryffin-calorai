package com.gryffin.calorai.service;

import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Purges all plaintext entity data for a user across every sync-capable table. Encapsulates the
 * canonical list of entities in one place so adding a new sync entity only requires a change here,
 * not in the HTTP controller layer.
 */
@Service
public class UserDataResetService {

  private final FoodItemService foodItemService;
  private final WaterLogService waterLogService;
  private final ActivityLogService activityLogService;
  private final BodyMeasurementService bodyMeasurementService;
  private final StepLogService stepLogService;
  private final FastingSessionService fastingSessionService;
  private final TdeeProfileService tdeeProfileService;
  private final RecipeService recipeService;
  private final MealTemplateService mealTemplateService;
  private final ReminderService reminderService;
  private final DietProfileService dietProfileService;

  /**
   * Constructor injection.
   */
  public UserDataResetService(
    final FoodItemService foodItemService,
    final WaterLogService waterLogService,
    final ActivityLogService activityLogService,
    final BodyMeasurementService bodyMeasurementService,
    final StepLogService stepLogService,
    final FastingSessionService fastingSessionService,
    final TdeeProfileService tdeeProfileService,
    final RecipeService recipeService,
    final MealTemplateService mealTemplateService,
    final ReminderService reminderService,
    final DietProfileService dietProfileService) {
    this.foodItemService = foodItemService;
    this.waterLogService = waterLogService;
    this.activityLogService = activityLogService;
    this.bodyMeasurementService = bodyMeasurementService;
    this.stepLogService = stepLogService;
    this.fastingSessionService = fastingSessionService;
    this.tdeeProfileService = tdeeProfileService;
    this.recipeService = recipeService;
    this.mealTemplateService = mealTemplateService;
    this.reminderService = reminderService;
    this.dietProfileService = dietProfileService;
  }

  /**
   * Deletes all plaintext entity rows for the given user. Called once during E2E activation
   * migration before re-uploading encrypted blobs. Runs in a single transaction so a partial
   * failure leaves no orphaned rows.
   *
   * @param userId the user whose data to purge
   */
  @Transactional
  public void deleteAllByUserId(final UUID userId) {
    foodItemService.deleteAllByUserId(userId);
    waterLogService.deleteAllByUserId(userId);
    activityLogService.deleteAllByUserId(userId);
    bodyMeasurementService.deleteAllByUserId(userId);
    stepLogService.deleteAllByUserId(userId);
    fastingSessionService.deleteAllByUserId(userId);
    tdeeProfileService.deleteByUserId(userId);
    recipeService.deleteAllByUserId(userId);
    mealTemplateService.deleteAllByUserId(userId);
    reminderService.deleteAllByUserId(userId);
    dietProfileService.deleteByUserId(userId);
  }
}
