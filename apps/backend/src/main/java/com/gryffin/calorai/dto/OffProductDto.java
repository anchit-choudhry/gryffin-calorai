package com.gryffin.calorai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

/**
 * Open Food Facts product response.
 *
 * <p>Returned by barcode lookup and full-text search endpoints. All nutrient values are
 * per 100g in grams (energy in kcal/kJ). Null indicates the value was not present or was outside a
 * physically valid range in the OFF dataset.
 */
@Schema(description = "Open Food Facts product")
public record OffProductDto(
  @Schema(description = "EAN-13 / UPC-A barcode (zero-padded to 13 digits for numeric codes)")
  String code,

  @Schema(description = "Product name") String productName,

  @Schema(description = "Brand name(s), comma-separated") String brands,

  @Schema(description = "Serving size label (e.g. 30g)") String servingSize,

  @Schema(description = "Serving size in grams extracted from label") Double servingSizeG,

  @Schema(description = "Nutri-Score grade: a | b | c | d | e") String nutritionGrade,

  @Schema(description = "Primary food category") String mainCategory,

  @Schema(description = "Small product image URL") String imageSmallUrl,

  @Schema(description = "Allergen tags, comma-separated") String allergensTags,

  @Schema(description = "Trace allergen tags, comma-separated") String tracesTags,

  @Schema(description = "Energy per 100g (kcal)") Double energyKcal100g,

  @Schema(description = "Energy per 100g (kJ)") Double energyKj100g,

  @Schema(description = "Protein per 100g (g)") Double proteins100g,

  @Schema(description = "Carbohydrates per 100g (g)") Double carbohydrates100g,

  @Schema(description = "Sugars per 100g (g)") Double sugars100g,

  @Schema(description = "Fat per 100g (g)") Double fat100g,

  @Schema(description = "Saturated fat per 100g (g)") Double saturatedFat100g,

  @Schema(description = "Trans fat per 100g (g)") Double transFat100g,

  @Schema(description = "Monounsaturated fat per 100g (g)") Double monounsaturatedFat100g,

  @Schema(description = "Polyunsaturated fat per 100g (g)") Double polyunsaturatedFat100g,

  @Schema(description = "Omega-3 fat per 100g (g)") Double omega3Fat100g,

  @Schema(description = "Cholesterol per 100g (g)") Double cholesterol100g,

  @Schema(description = "Dietary fiber per 100g (g)") Double fiber100g,

  @Schema(description = "Sodium per 100g (g)") Double sodium100g,

  @Schema(description = "Calcium per 100g (g)") Double calcium100g,

  @Schema(description = "Iron per 100g (g)") Double iron100g,

  @Schema(description = "Potassium per 100g (g)") Double potassium100g,

  @Schema(description = "Magnesium per 100g (g)") Double magnesium100g,

  @Schema(description = "Phosphorus per 100g (g)") Double phosphorus100g,

  @Schema(description = "Zinc per 100g (g)") Double zinc100g,

  @Schema(description = "Selenium per 100g (g)") Double selenium100g,

  @Schema(description = "Copper per 100g (g)") Double copper100g,

  @Schema(description = "Manganese per 100g (g)") Double manganese100g,

  @Schema(description = "Iodine per 100g (g)") Double iodine100g,

  @Schema(description = "Vitamin A per 100g (g)") Double vitaminA100g,

  @Schema(description = "Vitamin B1 (thiamine) per 100g (g)") Double vitaminB1100g,

  @Schema(description = "Vitamin B2 (riboflavin) per 100g (g)") Double vitaminB2100g,

  @Schema(description = "Vitamin B6 per 100g (g)") Double vitaminB6100g,

  @Schema(description = "Vitamin B9 (folate) per 100g (g)") Double vitaminB9100g,

  @Schema(description = "Vitamin B12 per 100g (g)") Double vitaminB12100g,

  @Schema(description = "Vitamin C per 100g (g)") Double vitaminC100g,

  @Schema(description = "Vitamin D per 100g (g)") Double vitaminD100g,

  @Schema(description = "Vitamin E per 100g (g)") Double vitaminE100g,

  @Schema(description = "Vitamin K per 100g (g)") Double vitaminK100g,

  @Schema(description = "Timestamp of last edit on Open Food Facts") Instant offLastModifiedAt
) {

}
