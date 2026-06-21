package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.OffProduct;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Repository for Open Food Facts product lookups. Read-only; no mutation methods used. */
public interface OffProductRepository extends JpaRepository<OffProduct, String> {

  /**
   * Look up a product by its exact barcode.
   *
   * @param code the barcode string (should already be normalized to 13 digits)
   * @return the product if found
   */
  Optional<OffProduct> findByCode(String code);

  /**
   * Full-text search using the precomputed {@code search_vec} tsvector column.
   *
   * <p>Uses {@code plainto_tsquery} which treats the query as plain text (no operator syntax),
   * making it safe for arbitrary user input. Results are ranked by {@code ts_rank}.
   * {@code unaccent()} normalises accented characters so "cafe" matches "caf-e".
   *
   * @param query the user-supplied search string
   * @param limit maximum number of results to return
   * @return matching products ordered by relevance
   */
  @Query(
      value = """
          SELECT * FROM off_products
          WHERE search_vec @@ plainto_tsquery('simple', unaccent(:query))
          ORDER BY ts_rank(search_vec, plainto_tsquery('simple', unaccent(:query))) DESC
          LIMIT :limit
          """,
      nativeQuery = true
  )
  List<OffProduct> searchByFts(@Param("query") String query, @Param("limit") int limit);
}
