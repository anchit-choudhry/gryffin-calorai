package com.gryffin.calorai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity representing a user's TDEE and calorie goal profile.
 */
@Entity
@Table(name = "tdee_profiles")
public class TdeeProfile {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false, unique = true)
  private AppUser user;

  @Min(1)
  @Max(120)
  @Column(nullable = false)
  private int age;

  @NotBlank
  @Column(nullable = false)
  private String sex; // "male" | "female"

  @DecimalMin("50")
  @DecimalMax("300")
  @Column(name = "height_cm", nullable = false)
  private double heightCm;

  @DecimalMin("20")
  @DecimalMax("500")
  @Column(name = "weight_kg", nullable = false)
  private double weightKg;

  @NotBlank
  @Column(name = "activity_level", nullable = false)
  private String activityLevel; // "sedentary" | "light" | "moderate" | "active" | "very_active"

  @NotBlank
  @Column(nullable = false)
  private String goal; // "lose" | "maintain" | "gain"

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public AppUser getUser() {
    return user;
  }

  public void setUser(AppUser user) {
    this.user = user;
  }

  public int getAge() {
    return age;
  }

  public void setAge(int age) {
    this.age = age;
  }

  public String getSex() {
    return sex;
  }

  public void setSex(String sex) {
    this.sex = sex;
  }

  public double getHeightCm() {
    return heightCm;
  }

  public void setHeightCm(double heightCm) {
    this.heightCm = heightCm;
  }

  public double getWeightKg() {
    return weightKg;
  }

  public void setWeightKg(double weightKg) {
    this.weightKg = weightKg;
  }

  public String getActivityLevel() {
    return activityLevel;
  }

  public void setActivityLevel(String activityLevel) {
    this.activityLevel = activityLevel;
  }

  public String getGoal() {
    return goal;
  }

  public void setGoal(String goal) {
    this.goal = goal;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  /**
   * Sets updatedAt to now before every INSERT and UPDATE.
   */
  @PrePersist
  @PreUpdate
  protected void onSave() {
    updatedAt = Instant.now();
  }
}
