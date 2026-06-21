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
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * JPA entity representing a single activity or exercise log entry.
 */
@Entity
@Table(name = "activity_logs", indexes = {
  @Index(name = "idx_activity_user_date", columnList = "user_id, date_logged")
})
public class ActivityLog {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private AppUser user;

  @NotBlank
  @Column(name = "activity_type", nullable = false)
  private String activityType;

  @DecimalMin("0")
  @Column(name = "duration_min", nullable = false)
  private int durationMin;

  @DecimalMin("0")
  @Column(name = "calories_burned", nullable = false)
  private double caloriesBurned;

  @Column(name = "date_logged", nullable = false)
  private LocalDate dateLogged;

  @Column(name = "logged_at", nullable = false)
  private Instant loggedAt = Instant.now();

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

  public void setId(UUID id) {
    this.id = id;
  }

  public AppUser getUser() {
    return user;
  }

  public void setUser(AppUser user) {
    this.user = user;
  }

  public String getActivityType() {
    return activityType;
  }

  public void setActivityType(String activityType) {
    this.activityType = activityType;
  }

  public int getDurationMin() {
    return durationMin;
  }

  public void setDurationMin(int durationMin) {
    this.durationMin = durationMin;
  }

  public double getCaloriesBurned() {
    return caloriesBurned;
  }

  public void setCaloriesBurned(double caloriesBurned) {
    this.caloriesBurned = caloriesBurned;
  }

  public LocalDate getDateLogged() {
    return dateLogged;
  }

  public void setDateLogged(LocalDate dateLogged) {
    this.dateLogged = dateLogged;
  }

  public Instant getLoggedAt() {
    return loggedAt;
  }

  public void setLoggedAt(Instant loggedAt) {
    this.loggedAt = loggedAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public Instant getDeletedAt() {
    return deletedAt;
  }

  public void setDeletedAt(Instant deletedAt) {
    this.deletedAt = deletedAt;
  }
}
