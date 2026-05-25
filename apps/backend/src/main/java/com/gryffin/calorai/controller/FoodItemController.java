package com.gryffin.calorai.controller;

import com.gryffin.calorai.dto.FoodItemDto;
import com.gryffin.calorai.service.FoodItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Tag(name = "Food Items", description = "CRUD for daily food log entries")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/v1/food-items")
public class FoodItemController {

    private final FoodItemService foodItemService;

    public FoodItemController(FoodItemService foodItemService) {
        this.foodItemService = foodItemService;
    }

    @Operation(summary = "List food items logged on a given date")
    @GetMapping
    public List<FoodItemDto> getByDate(
        @AuthenticationPrincipal Jwt jwt,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return foodItemService.getDailyLogs(UUID.fromString(jwt.getSubject()), date);
    }

    @Operation(summary = "List favourite food items")
    @GetMapping("/favorites")
    public List<FoodItemDto> getFavorites(@AuthenticationPrincipal Jwt jwt) {
        return foodItemService.getFavorites(UUID.fromString(jwt.getSubject()));
    }

    @Operation(summary = "Log a new food item")
    @PostMapping
    public ResponseEntity<FoodItemDto> create(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody FoodItemDto dto
    ) {
        FoodItemDto created = foodItemService.create(UUID.fromString(jwt.getSubject()), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(summary = "Update an existing food item")
    @PutMapping("/{id}")
    public FoodItemDto update(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID id,
        @Valid @RequestBody FoodItemDto dto
    ) {
        return foodItemService.update(UUID.fromString(jwt.getSubject()), id, dto);
    }

    @Operation(summary = "Delete a food item")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID id
    ) {
        foodItemService.delete(UUID.fromString(jwt.getSubject()), id);
        return ResponseEntity.noContent().build();
    }
}
