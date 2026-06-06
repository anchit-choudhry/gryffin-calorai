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
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** JPA entity representing a body weight or composition measurement. */
@Entity
@Table(name = "body_measurements", indexes = {
    @Index(name = "idx_body_user_date", columnList = "user_id, date_logged")
})
public class BodyMeasurement {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private AppUser user;

  @DecimalMin("0")
  @Column(name = "weight_kg")
  private Double weightKg;

  @DecimalMin("0")
  @Column(name = "body_fat_pct")
  private Double bodyFatPct;

  @Column(name = "date_logged", nullable = false)
  private LocalDate dateLogged;

  @Column
  private String notes;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  @Column(name = "deleted_at")
  private Instant deletedAt;

  /** Sets updated_at before every insert and update. */
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

  public Double getWeightKg() {
    return weightKg;
  }

  public void setWeightKg(Double weightKg) {
    this.weightKg = weightKg;
  }

  public Double getBodyFatPct() {
    return bodyFatPct;
  }

  public void setBodyFatPct(Double bodyFatPct) {
    this.bodyFatPct = bodyFatPct;
  }

  public LocalDate getDateLogged() {
    return dateLogged;
  }

  public void setDateLogged(LocalDate dateLogged) {
    this.dateLogged = dateLogged;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
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
