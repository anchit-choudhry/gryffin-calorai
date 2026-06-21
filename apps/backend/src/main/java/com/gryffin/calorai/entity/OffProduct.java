package com.gryffin.calorai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.Immutable;

/**
 * JPA entity representing an Open Food Facts product from the {@code off_products} table.
 *
 * <p>This table is populated by {@code refresh-off-products.sh} via DuckDB + PostgreSQL COPY
 * and is never written to by the Spring application. {@code @Immutable} prevents Hibernate
 * from generating UPDATE statements. The {@code search_vec} TSVECTOR column is intentionally
 * unmapped; it is managed by a PostgreSQL trigger and queried via native SQL only.
 */
@Entity
@Immutable
@Table(name = "off_products")
public class OffProduct {

  @Id
  @Column(name = "code", nullable = false, updatable = false)
  private String code;

  @Column(name = "product_name")
  private String productName;

  @Column(name = "brands")
  private String brands;

  @Column(name = "serving_size")
  private String servingSize;

  @Column(name = "serving_size_g")
  private Double servingSizeG;

  @Column(name = "nutrition_grade")
  private String nutritionGrade;

  @Column(name = "main_category")
  private String mainCategory;

  @Column(name = "image_small_url")
  private String imageSmallUrl;

  @Column(name = "allergens_tags")
  private String allergensTags;

  @Column(name = "traces_tags")
  private String tracesTags;

  @Column(name = "energy_kcal_100g")
  private Double energyKcal100g;

  @Column(name = "energy_kj_100g")
  private Double energyKj100g;

  @Column(name = "proteins_100g")
  private Double proteins100g;

  @Column(name = "carbohydrates_100g")
  private Double carbohydrates100g;

  @Column(name = "sugars_100g")
  private Double sugars100g;

  @Column(name = "fat_100g")
  private Double fat100g;

  @Column(name = "saturated_fat_100g")
  private Double saturatedFat100g;

  @Column(name = "trans_fat_100g")
  private Double transFat100g;

  @Column(name = "monounsaturated_fat_100g")
  private Double monounsaturatedFat100g;

  @Column(name = "polyunsaturated_fat_100g")
  private Double polyunsaturatedFat100g;

  @Column(name = "omega_3_fat_100g")
  private Double omega3Fat100g;

  @Column(name = "cholesterol_100g")
  private Double cholesterol100g;

  @Column(name = "fiber_100g")
  private Double fiber100g;

  @Column(name = "sodium_100g")
  private Double sodium100g;

  @Column(name = "calcium_100g")
  private Double calcium100g;

  @Column(name = "iron_100g")
  private Double iron100g;

  @Column(name = "potassium_100g")
  private Double potassium100g;

  @Column(name = "magnesium_100g")
  private Double magnesium100g;

  @Column(name = "phosphorus_100g")
  private Double phosphorus100g;

  @Column(name = "zinc_100g")
  private Double zinc100g;

  @Column(name = "selenium_100g")
  private Double selenium100g;

  @Column(name = "copper_100g")
  private Double copper100g;

  @Column(name = "manganese_100g")
  private Double manganese100g;

  @Column(name = "iodine_100g")
  private Double iodine100g;

  @Column(name = "vitamin_a_100g")
  private Double vitaminA100g;

  @Column(name = "vitamin_b1_100g")
  private Double vitaminB1100g;

  @Column(name = "vitamin_b2_100g")
  private Double vitaminB2100g;

  @Column(name = "vitamin_b6_100g")
  private Double vitaminB6100g;

  @Column(name = "vitamin_b9_100g")
  private Double vitaminB9100g;

  @Column(name = "vitamin_b12_100g")
  private Double vitaminB12100g;

  @Column(name = "vitamin_c_100g")
  private Double vitaminC100g;

  @Column(name = "vitamin_d_100g")
  private Double vitaminD100g;

  @Column(name = "vitamin_e_100g")
  private Double vitaminE100g;

  @Column(name = "vitamin_k_100g")
  private Double vitaminK100g;

  @Column(name = "off_last_modified_at")
  private Instant offLastModifiedAt;

  @Column(name = "first_imported_at", nullable = false, updatable = false)
  private Instant firstImportedAt;

  @Column(name = "last_imported_at", nullable = false)
  private Instant lastImportedAt;

  /** Required no-arg constructor for JPA; Hibernate uses field injection during hydration. */
  protected OffProduct() {
  }

  /** Returns the 13-digit barcode (EAN-13 / UPC-A). */
  public String getCode() {
    return code;
  }

  /** Returns the product name (English preferred, first available otherwise). */
  public String getProductName() {
    return productName;
  }

  /** Returns the brand name(s), comma-separated if multiple. */
  public String getBrands() {
    return brands;
  }

  /** Returns the human-readable serving size string (e.g. "30g"). */
  public String getServingSize() {
    return servingSize;
  }

  /** Returns the serving size in grams extracted from the serving_size string. */
  public Double getServingSizeG() {
    return servingSizeG;
  }

  /** Returns the Nutri-Score grade (a-e), or null if not rated. */
  public String getNutritionGrade() {
    return nutritionGrade;
  }

  /** Returns the primary food category. */
  public String getMainCategory() {
    return mainCategory;
  }

  /** Returns the small product image URL, or null if unavailable. */
  public String getImageSmallUrl() {
    return imageSmallUrl;
  }

  /** Returns comma-separated allergen tags (e.g. "en:gluten,en:milk"). */
  public String getAllergensTags() {
    return allergensTags;
  }

  /** Returns comma-separated trace allergen tags. */
  public String getTracesTags() {
    return tracesTags;
  }

  /** Returns energy per 100g in kilocalories. */
  public Double getEnergyKcal100g() {
    return energyKcal100g;
  }

  /** Returns energy per 100g in kilojoules. */
  public Double getEnergyKj100g() {
    return energyKj100g;
  }

  /** Returns protein content per 100g in grams. */
  public Double getProteins100g() {
    return proteins100g;
  }

  /** Returns total carbohydrate content per 100g in grams. */
  public Double getCarbohydrates100g() {
    return carbohydrates100g;
  }

  /** Returns sugar content per 100g in grams. */
  public Double getSugars100g() {
    return sugars100g;
  }

  /** Returns total fat content per 100g in grams. */
  public Double getFat100g() {
    return fat100g;
  }

  /** Returns saturated fat content per 100g in grams. */
  public Double getSaturatedFat100g() {
    return saturatedFat100g;
  }

  /** Returns trans fat content per 100g in grams. */
  public Double getTransFat100g() {
    return transFat100g;
  }

  /** Returns monounsaturated fat content per 100g in grams. */
  public Double getMonounsaturatedFat100g() {
    return monounsaturatedFat100g;
  }

  /** Returns polyunsaturated fat content per 100g in grams. */
  public Double getPolyunsaturatedFat100g() {
    return polyunsaturatedFat100g;
  }

  /** Returns omega-3 fat content per 100g in grams. */
  public Double getOmega3Fat100g() {
    return omega3Fat100g;
  }

  /** Returns cholesterol content per 100g in grams. */
  public Double getCholesterol100g() {
    return cholesterol100g;
  }

  /** Returns dietary fiber content per 100g in grams. */
  public Double getFiber100g() {
    return fiber100g;
  }

  /** Returns sodium content per 100g in grams. */
  public Double getSodium100g() {
    return sodium100g;
  }

  /** Returns calcium content per 100g in grams. */
  public Double getCalcium100g() {
    return calcium100g;
  }

  /** Returns iron content per 100g in grams. */
  public Double getIron100g() {
    return iron100g;
  }

  /** Returns potassium content per 100g in grams. */
  public Double getPotassium100g() {
    return potassium100g;
  }

  /** Returns magnesium content per 100g in grams. */
  public Double getMagnesium100g() {
    return magnesium100g;
  }

  /** Returns phosphorus content per 100g in grams. */
  public Double getPhosphorus100g() {
    return phosphorus100g;
  }

  /** Returns zinc content per 100g in grams. */
  public Double getZinc100g() {
    return zinc100g;
  }

  /** Returns selenium content per 100g in grams. */
  public Double getSelenium100g() {
    return selenium100g;
  }

  /** Returns copper content per 100g in grams. */
  public Double getCopper100g() {
    return copper100g;
  }

  /** Returns manganese content per 100g in grams. */
  public Double getManganese100g() {
    return manganese100g;
  }

  /** Returns iodine content per 100g in grams. */
  public Double getIodine100g() {
    return iodine100g;
  }

  /** Returns vitamin A content per 100g in grams. */
  public Double getVitaminA100g() {
    return vitaminA100g;
  }

  /** Returns vitamin B1 (thiamine) content per 100g in grams. */
  public Double getVitaminB1100g() {
    return vitaminB1100g;
  }

  /** Returns vitamin B2 (riboflavin) content per 100g in grams. */
  public Double getVitaminB2100g() {
    return vitaminB2100g;
  }

  /** Returns vitamin B6 content per 100g in grams. */
  public Double getVitaminB6100g() {
    return vitaminB6100g;
  }

  /** Returns vitamin B9 (folate) content per 100g in grams. */
  public Double getVitaminB9100g() {
    return vitaminB9100g;
  }

  /** Returns vitamin B12 content per 100g in grams. */
  public Double getVitaminB12100g() {
    return vitaminB12100g;
  }

  /** Returns vitamin C content per 100g in grams. */
  public Double getVitaminC100g() {
    return vitaminC100g;
  }

  /** Returns vitamin D content per 100g in grams. */
  public Double getVitaminD100g() {
    return vitaminD100g;
  }

  /** Returns vitamin E content per 100g in grams. */
  public Double getVitaminE100g() {
    return vitaminE100g;
  }

  /** Returns vitamin K content per 100g in grams. */
  public Double getVitaminK100g() {
    return vitaminK100g;
  }

  /** Returns the timestamp of the last edit on Open Food Facts. */
  public Instant getOffLastModifiedAt() {
    return offLastModifiedAt;
  }

  /** Returns the timestamp when this product was first imported. */
  public Instant getFirstImportedAt() {
    return firstImportedAt;
  }

  /** Returns the timestamp of the most recent import run that touched this product. */
  public Instant getLastImportedAt() {
    return lastImportedAt;
  }
}
