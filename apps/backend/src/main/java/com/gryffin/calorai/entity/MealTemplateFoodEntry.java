package com.gryffin.calorai.entity;

import java.util.Map;

/**
 * Value type stored in the meal_templates.foods JSONB column. nutritionData is an open map so
 * arbitrary client nutrition fields round-trip without the backend needing to know each field.
 */
public record MealTemplateFoodEntry(
  String foodItemId,
  double quantity,
  double serving,
  Map<String, Object> nutritionData
) {

}
