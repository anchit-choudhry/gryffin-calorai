package com.gryffin.calorai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity storing the PBKDF2 salt for a user's E2E encryption config. Not a secret.
 */
@Entity
@Table(name = "user_e2e_config")
public class UserE2EConfig {

  @Id
  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @NotBlank
  @Column(nullable = false)
  private String salt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  /**
   * Returns the user ID (primary key).
   */
  public UUID getUserId() {
    return userId;
  }

  /**
   * Sets the user ID.
   */
  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  /**
   * Returns the base64-encoded PBKDF2 salt.
   */
  public String getSalt() {
    return salt;
  }

  /**
   * Sets the base64-encoded PBKDF2 salt.
   */
  public void setSalt(String salt) {
    this.salt = salt;
  }

  /**
   * Returns the timestamp when E2E was first configured.
   */
  public Instant getCreatedAt() {
    return createdAt;
  }
}
