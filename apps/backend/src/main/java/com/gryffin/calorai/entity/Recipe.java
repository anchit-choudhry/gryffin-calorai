package com.gryffin.calorai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * JPA entity representing a user recipe synced from a client device.
 */
@Entity
@Table(name = "recipes", indexes = {
  @Index(name = "idx_recipes_user_updated", columnList = "user_id, updated_at")
})
public class Recipe {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private AppUser user;

  @Column(nullable = false)
  private String name;

  @Column
  private String description;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private List<RecipeIngredient> ingredients;

  @Column(name = "total_calories")
  private Integer totalCalories;

  @Column(name = "total_protein")
  private Double totalProtein;

  @Column(name = "total_carbs")
  private Double totalCarbs;

  @Column(name = "total_fat")
  private Double totalFat;

  @Column(name = "created_by", nullable = false)
  private String createdBy;

  @Column(name = "date_created", nullable = false)
  private String dateCreated;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  @Column(name = "deleted_at")
  private Instant deletedAt;

  /**
   * Sets updated_at before every insert and update.
   */
  @PrePersist
  @PreUpdate
  protected void onSave() {
    updatedAt = Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public void setId(final UUID id) {
    this.id = id;
  }

  public AppUser getUser() {
    return user;
  }

  public void setUser(final AppUser user) {
    this.user = user;
  }

  public String getName() {
    return name;
  }

  public void setName(final String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(final String description) {
    this.description = description;
  }

  public List<RecipeIngredient> getIngredients() {
    return ingredients;
  }

  public void setIngredients(final List<RecipeIngredient> ingredients) {
    this.ingredients = ingredients;
  }

  public Integer getTotalCalories() {
    return totalCalories;
  }

  public void setTotalCalories(final Integer totalCalories) {
    this.totalCalories = totalCalories;
  }

  public Double getTotalProtein() {
    return totalProtein;
  }

  public void setTotalProtein(final Double totalProtein) {
    this.totalProtein = totalProtein;
  }

  public Double getTotalCarbs() {
    return totalCarbs;
  }

  public void setTotalCarbs(final Double totalCarbs) {
    this.totalCarbs = totalCarbs;
  }

  public Double getTotalFat() {
    return totalFat;
  }

  public void setTotalFat(final Double totalFat) {
    this.totalFat = totalFat;
  }

  public String getCreatedBy() {
    return createdBy;
  }

  public void setCreatedBy(final String createdBy) {
    this.createdBy = createdBy;
  }

  public String getDateCreated() {
    return dateCreated;
  }

  public void setDateCreated(final String dateCreated) {
    this.dateCreated = dateCreated;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public Instant getDeletedAt() {
    return deletedAt;
  }

  public void setDeletedAt(final Instant deletedAt) {
    this.deletedAt = deletedAt;
  }
}
