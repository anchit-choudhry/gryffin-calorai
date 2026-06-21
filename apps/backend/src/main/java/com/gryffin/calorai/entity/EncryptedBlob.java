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
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity for an encrypted sync blob. The server never parses the ciphertext field.
 */
@Entity
@Table(
  name = "encrypted_blobs",
  indexes = {@Index(name = "idx_enc_blobs_user_updated", columnList = "user_id, updated_at")},
  uniqueConstraints = {
    @UniqueConstraint(name = "uq_user_blob", columnNames = {"user_id", "client_blob_id"})
  }
)
public class EncryptedBlob {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private AppUser user;

  @Column(name = "client_blob_id", nullable = false)
  private String clientBlobId;

  @Column(nullable = false)
  private String iv;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String ciphertext;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  @Column(name = "is_deleted", nullable = false)
  private boolean isDeleted = false;

  /**
   * Sets updatedAt before every insert and update.
   */
  @PrePersist
  @PreUpdate
  protected void onSave() {
    updatedAt = Instant.now();
  }

  /**
   * Returns the entity ID.
   */
  public UUID getId() {
    return id;
  }

  /**
   * Sets the entity ID.
   */
  public void setId(UUID id) {
    this.id = id;
  }

  /**
   * Returns the owning user.
   */
  public AppUser getUser() {
    return user;
  }

  /**
   * Sets the owning user.
   */
  public void setUser(AppUser user) {
    this.user = user;
  }

  /**
   * Returns the client-assigned blob ID (format: entityType:syncId).
   */
  public String getClientBlobId() {
    return clientBlobId;
  }

  /**
   * Sets the client-assigned blob ID.
   */
  public void setClientBlobId(String clientBlobId) {
    this.clientBlobId = clientBlobId;
  }

  /**
   * Returns the base64-encoded AES-GCM IV.
   */
  public String getIv() {
    return iv;
  }

  /**
   * Sets the base64-encoded AES-GCM IV.
   */
  public void setIv(String iv) {
    this.iv = iv;
  }

  /**
   * Returns the base64-encoded AES-GCM ciphertext.
   */
  public String getCiphertext() {
    return ciphertext;
  }

  /**
   * Sets the base64-encoded AES-GCM ciphertext.
   */
  public void setCiphertext(String ciphertext) {
    this.ciphertext = ciphertext;
  }

  /**
   * Returns the server-managed last-updated timestamp.
   */
  public Instant getUpdatedAt() {
    return updatedAt;
  }

  /**
   * Returns true if this blob has been soft-deleted.
   */
  public boolean isDeleted() {
    return isDeleted;
  }

  /**
   * Marks this blob as deleted or restores it.
   */
  public void setDeleted(boolean deleted) {
    isDeleted = deleted;
  }
}
