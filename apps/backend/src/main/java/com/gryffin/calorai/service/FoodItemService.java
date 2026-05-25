package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.FoodItemDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.FoodItem;
import com.gryffin.calorai.repository.FoodItemRepository;
import com.gryffin.calorai.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class FoodItemService {

    private final FoodItemRepository foodItemRepository;
    private final UserRepository userRepository;

    public FoodItemService(FoodItemRepository foodItemRepository, UserRepository userRepository) {
        this.foodItemRepository = foodItemRepository;
        this.userRepository = userRepository;
    }

    public List<FoodItemDto> getDailyLogs(UUID userId, LocalDate date) {
        return foodItemRepository.findByUserIdAndDateLogged(userId, date)
            .stream().map(this::toDto).toList();
    }

    public List<FoodItemDto> getFavorites(UUID userId) {
        return foodItemRepository.findByUserIdAndIsFavoriteTrue(userId)
            .stream().map(this::toDto).toList();
    }

    @Transactional
    public FoodItemDto create(UUID userId, FoodItemDto dto) {
        AppUser user = userRepository.findById(userId)
            .orElseThrow(() -> new NoSuchElementException("User not found"));
        FoodItem item = fromDto(dto, user);
        return toDto(foodItemRepository.save(item));
    }

    @Transactional
    public FoodItemDto update(UUID userId, UUID itemId, FoodItemDto dto) {
        FoodItem item = foodItemRepository.findById(itemId)
            .filter(f -> f.getUser().getId().equals(userId))
            .orElseThrow(() -> new NoSuchElementException("Food item not found"));
        item.setName(dto.name());
        item.setCalories(dto.calories());
        item.setServingSize(dto.servingSize());
        item.setProtein(dto.protein());
        item.setCarbs(dto.carbs());
        item.setFat(dto.fat());
        item.setDateLogged(dto.dateLogged());
        item.setFavorite(dto.isFavorite());
        item.setMealType(dto.mealType());
        return toDto(foodItemRepository.save(item));
    }

    @Transactional
    public void delete(UUID userId, UUID itemId) {
        FoodItem item = foodItemRepository.findById(itemId)
            .filter(f -> f.getUser().getId().equals(userId))
            .orElseThrow(() -> new NoSuchElementException("Food item not found"));
        foodItemRepository.delete(item);
    }

    private FoodItemDto toDto(FoodItem item) {
        return new FoodItemDto(
            item.getId().toString(),
            item.getName(),
            item.getCalories(),
            item.getServingSize(),
            item.getProtein(),
            item.getCarbs(),
            item.getFat(),
            item.getDateLogged(),
            item.isFavorite(),
            item.getMealType()
        );
    }

    private FoodItem fromDto(FoodItemDto dto, AppUser user) {
        var item = new FoodItem();
        item.setUser(user);
        item.setName(dto.name());
        item.setCalories(dto.calories());
        item.setServingSize(dto.servingSize());
        item.setProtein(dto.protein());
        item.setCarbs(dto.carbs());
        item.setFat(dto.fat());
        item.setDateLogged(dto.dateLogged());
        item.setFavorite(dto.isFavorite());
        item.setMealType(dto.mealType());
        return item;
    }
}
