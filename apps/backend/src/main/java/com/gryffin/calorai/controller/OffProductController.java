package com.gryffin.calorai.controller;

import com.gryffin.calorai.dto.OffProductDto;
import com.gryffin.calorai.service.OffProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST endpoints for Open Food Facts barcode lookup and food search.
 */
@Tag(name = "OFF Products", description = "Open Food Facts barcode lookup and food search")
@SecurityRequirement(name = "bearerAuth")
@Validated
@RestController
@RequestMapping("/v1/off-products")
public class OffProductController {

  private final OffProductService offProductService;

  /**
   * Constructs the controller with its service dependency.
   */
  public OffProductController(OffProductService offProductService) {
    this.offProductService = offProductService;
  }

  /**
   * Look up a product by barcode. The code is normalized before lookup (numeric 8-13 digit codes
   * are zero-padded to 13 digits).
   *
   * @param code the barcode from the scanner or manual entry
   * @return the product, or 404 if not found in the OFF database
   */
  @Operation(summary = "Look up a product by barcode (EAN-13 / UPC-A)")
  @GetMapping("/barcode/{code}")
  public ResponseEntity<OffProductDto> getByBarcode(
    @PathVariable @NotBlank @Size(max = 50) String code
  ) {
    return offProductService.findByBarcode(code)
      .map(ResponseEntity::ok)
      .orElseThrow(() -> new NoSuchElementException("Product not found for barcode: " + code));
  }

  /**
   * Full-text search across product names and brands. Results are ordered by relevance.
   *
   * @param q     the search query (plain text)
   * @param limit maximum number of results (1-50, default 20)
   * @return matching products ordered by FTS rank
   */
  @Operation(summary = "Search products by name or brand")
  @GetMapping("/search")
  public List<OffProductDto> search(
    @RequestParam @NotBlank @Size(max = 100) String q,
    @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
  ) {
    return offProductService.search(q, limit);
  }
}
