package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface FoodItemRepository extends JpaRepository<FoodItem, UUID> {
    List<FoodItem> findByUserIdAndDateLogged(UUID userId, LocalDate dateLogged);
    List<FoodItem> findByUserIdAndIsFavoriteTrue(UUID userId);
    long countByUserId(UUID userId);
}
