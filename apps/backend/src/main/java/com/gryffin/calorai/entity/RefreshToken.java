package com.gryffin.calorai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity representing a stored refresh token JTI for single-use rotation.
 */
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

  @Column(nullable = false, updatable = false)
  private final Instant createdAt = Instant.now();
  @Id
  private UUID jti;
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private AppUser user;
  @Column(nullable = false)
  private Instant expiresAt;

  public UUID getJti() {
    return jti;
  }

  public void setJti(UUID jti) {
    this.jti = jti;
  }

  public AppUser getUser() {
    return user;
  }

  public void setUser(AppUser user) {
    this.user = user;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public void setExpiresAt(Instant expiresAt) {
    this.expiresAt = expiresAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
