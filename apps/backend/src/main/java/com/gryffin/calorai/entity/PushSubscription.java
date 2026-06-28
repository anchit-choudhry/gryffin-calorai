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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity storing a browser Web Push subscription for a user. Each subscription corresponds to
 * one browser profile on one device. A user may have multiple subscriptions.
 */
@Entity
@Table(
  name = "push_subscriptions",
  indexes = {@Index(name = "idx_push_subscriptions_user_id", columnList = "user_id")},
  uniqueConstraints = {@UniqueConstraint(columnNames = {"user_id", "endpoint"})}
)
public class PushSubscription {

  @Column(name = "created_at", nullable = false, updatable = false)
  private final Instant createdAt = Instant.now();
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private AppUser user;
  @Column(nullable = false, columnDefinition = "TEXT")
  private String endpoint;
  @Column(nullable = false, columnDefinition = "TEXT")
  private String p256dh;
  @Column(nullable = false, columnDefinition = "TEXT")
  private String auth;
  @Column(length = 60)
  private String timezone;

  /**
   * Returns the subscription ID.
   */
  public UUID getId() {
    return id;
  }

  /**
   * Returns the owning user.
   */
  public AppUser getUser() {
    return user;
  }

  /**
   * Sets the owning user.
   *
   * @param user the user
   */
  public void setUser(final AppUser user) {
    this.user = user;
  }

  /**
   * Returns the push service endpoint URL.
   */
  public String getEndpoint() {
    return endpoint;
  }

  /**
   * Sets the push service endpoint URL.
   *
   * @param endpoint the endpoint URL
   */
  public void setEndpoint(final String endpoint) {
    this.endpoint = endpoint;
  }

  /**
   * Returns the client's EC public key (base64url, P-256).
   */
  public String getP256dh() {
    return p256dh;
  }

  /**
   * Sets the client's EC public key.
   *
   * @param p256dh the base64url-encoded EC public key
   */
  public void setP256dh(final String p256dh) {
    this.p256dh = p256dh;
  }

  /**
   * Returns the auth secret (base64url, 16 bytes).
   */
  public String getAuth() {
    return auth;
  }

  /**
   * Sets the auth secret.
   *
   * @param auth the base64url-encoded auth secret
   */
  public void setAuth(final String auth) {
    this.auth = auth;
  }

  /**
   * Returns the IANA timezone string for this subscription (e.g. "America/New_York"), or null if
   * not provided. Used by the reminder scheduler to match reminder times to local time.
   */
  public String getTimezone() {
    return timezone;
  }

  /**
   * Sets the IANA timezone string.
   *
   * @param timezone the timezone string
   */
  public void setTimezone(final String timezone) {
    this.timezone = timezone;
  }
}
