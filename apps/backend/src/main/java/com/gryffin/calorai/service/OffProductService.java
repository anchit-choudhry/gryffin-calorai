package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.OffProductDto;
import com.gryffin.calorai.entity.OffProduct;
import com.gryffin.calorai.repository.OffProductRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for Open Food Facts product lookups.
 *
 * <p>Handles barcode normalization (matching the logic in {@code refresh-off-products.sh}:
 * numeric codes of 8-13 digits are zero-padded to 13 digits) and full-text search
 * with a configurable result cap.
 */
@Service
@Transactional(readOnly = true)
public class OffProductService {

  static final int MAX_SEARCH_LIMIT = 50;
  static final int DEFAULT_SEARCH_LIMIT = 20;

  private final OffProductRepository offProductRepository;

  /** Constructs the service with its repository dependency. */
  public OffProductService(OffProductRepository offProductRepository) {
    this.offProductRepository = offProductRepository;
  }

  /**
   * Look up a product by barcode, normalizing the code before querying.
   *
   * <p>Numeric codes of 8-13 digits are zero-padded to 13 digits to match the
   * normalization applied during import (e.g. "12345678" becomes "0000012345678").
   *
   * @param rawCode the barcode as scanned or entered by the user
   * @return the matching product DTO if found
   */
  public Optional<OffProductDto> findByBarcode(String rawCode) {
    String code = normalizeBarcode(rawCode);
    return offProductRepository.findByCode(code).map(this::toDto);
  }

  /**
   * Full-text search across product names and brands.
   *
   * @param query the user-supplied search string (plain text, no query syntax)
   * @param limit maximum results; validated by {@code @Min(1) @Max(50)} at the controller
   * @return matching products ordered by relevance
   * @throws IllegalArgumentException if query is blank
   */
  public List<OffProductDto> search(String query, int limit) {
    if (query == null || query.isBlank()) {
      throw new IllegalArgumentException("Search query must not be blank");
    }
    return offProductRepository.searchByFts(query.trim(), limit)
        .stream()
        .map(this::toDto)
        .toList();
  }

  /**
   * Normalizes a raw barcode to match the import script's code normalization.
   *
   * <p>Numeric strings of 8-13 digits are zero-padded to exactly 13 digits.
   * Non-numeric or out-of-length codes are returned trimmed but otherwise unchanged.
   *
   * @param raw the raw barcode string
   * @return the normalized barcode
   */
  String normalizeBarcode(String raw) {
    String trimmed = raw.trim();
    if (trimmed.length() >= 8 && trimmed.length() <= 13) {
      try {
        long numericCode = Long.parseLong(trimmed);
        return String.format("%013d", numericCode);
      } catch (NumberFormatException ignored) {
        // non-numeric barcode - use as-is
      }
    }
    return trimmed;
  }

  private OffProductDto toDto(OffProduct p) {
    return new OffProductDto(
        p.getCode(),
        p.getProductName(),
        p.getBrands(),
        p.getServingSize(),
        p.getServingSizeG(),
        p.getNutritionGrade(),
        p.getMainCategory(),
        p.getImageSmallUrl(),
        p.getAllergensTags(),
        p.getTracesTags(),
        p.getEnergyKcal100g(),
        p.getEnergyKj100g(),
        p.getProteins100g(),
        p.getCarbohydrates100g(),
        p.getSugars100g(),
        p.getFat100g(),
        p.getSaturatedFat100g(),
        p.getTransFat100g(),
        p.getMonounsaturatedFat100g(),
        p.getPolyunsaturatedFat100g(),
        p.getOmega3Fat100g(),
        p.getCholesterol100g(),
        p.getFiber100g(),
        p.getSodium100g(),
        p.getCalcium100g(),
        p.getIron100g(),
        p.getPotassium100g(),
        p.getMagnesium100g(),
        p.getPhosphorus100g(),
        p.getZinc100g(),
        p.getSelenium100g(),
        p.getCopper100g(),
        p.getManganese100g(),
        p.getIodine100g(),
        p.getVitaminA100g(),
        p.getVitaminB1100g(),
        p.getVitaminB2100g(),
        p.getVitaminB6100g(),
        p.getVitaminB9100g(),
        p.getVitaminB12100g(),
        p.getVitaminC100g(),
        p.getVitaminD100g(),
        p.getVitaminE100g(),
        p.getVitaminK100g(),
        p.getOffLastModifiedAt()
    );
  }
}
