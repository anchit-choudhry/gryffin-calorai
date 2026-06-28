package com.gryffin.calorai.entity;

/**
 * Value type stored in the recipes.ingredients JSONB column. Represents a single ingredient line in
 * a recipe.
 */
public record RecipeIngredient(
  String foodItemId,
  double quantity,
  double serving
) {

}
