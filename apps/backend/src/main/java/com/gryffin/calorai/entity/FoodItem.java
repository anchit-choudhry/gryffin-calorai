package com.gryffin.calorai.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "food_items", indexes = {
    @Index(name = "idx_food_user_date", columnList = "user_id, date_logged")
})
public class FoodItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @DecimalMin("0") @DecimalMax("9999")
    @Column(nullable = false)
    private double calories;

    @DecimalMin("0")
    private double servingSize = 1.0;

    @DecimalMin("0") @DecimalMax("999")
    private double protein;

    @DecimalMin("0") @DecimalMax("999")
    private double carbs;

    @DecimalMin("0") @DecimalMax("999")
    private double fat;

    @Column(name = "date_logged", nullable = false)
    private LocalDate dateLogged;

    private boolean isFavorite;

    @Pattern(regexp = "^(Breakfast|Lunch|Snacks|Dinner)$")
    private String mealType;

    public UUID getId() { return id; }
    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public double getCalories() { return calories; }
    public void setCalories(double calories) { this.calories = calories; }
    public double getServingSize() { return servingSize; }
    public void setServingSize(double servingSize) { this.servingSize = servingSize; }
    public double getProtein() { return protein; }
    public void setProtein(double protein) { this.protein = protein; }
    public double getCarbs() { return carbs; }
    public void setCarbs(double carbs) { this.carbs = carbs; }
    public double getFat() { return fat; }
    public void setFat(double fat) { this.fat = fat; }
    public LocalDate getDateLogged() { return dateLogged; }
    public void setDateLogged(LocalDate dateLogged) { this.dateLogged = dateLogged; }
    public boolean isFavorite() { return isFavorite; }
    public void setFavorite(boolean favorite) { isFavorite = favorite; }
    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }
}
