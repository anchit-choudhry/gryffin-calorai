package com.gryffin.calorai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.UUID;

/** JPA entity representing an authenticated application user. */
@Entity
@Table(name = "app_users")
public class AppUser {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @NotBlank
  @Column(nullable = false)
  private String displayName;

  @Email
  @Column(unique = true)
  private String email;

  @Column(nullable = false)
  private String provider; // "google" | "apple" | "local"

  @Column(unique = true)
  private String providerSubject; // OAuth2 sub claim

  @Column(nullable = false, updatable = false)
  private final Instant createdAt = Instant.now();

  private Instant updatedAt = Instant.now();

  @PreUpdate
  void touch() {
    updatedAt = Instant.now();
  }

  public UUID getId() {
    return id;
  }

  /** Sets the entity ID (used in tests and batch operations). */
  public void setId(UUID id) {
    this.id = id;
  }

  public String getDisplayName() {
    return displayName;
  }

  public void setDisplayName(String displayName) {
    this.displayName = displayName;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getProvider() {
    return provider;
  }

  public void setProvider(String provider) {
    this.provider = provider;
  }

  public String getProviderSubject() {
    return providerSubject;
  }

  public void setProviderSubject(String providerSubject) {
    this.providerSubject = providerSubject;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
