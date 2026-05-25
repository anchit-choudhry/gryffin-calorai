package com.gryffin.calorai.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "water_logs", indexes = {
    @Index(name = "idx_water_user_date", columnList = "user_id, date_logged")
})
public class WaterLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @DecimalMin("0")
    @Column(nullable = false)
    private double amount; // ml

    @Column(name = "date_logged", nullable = false)
    private LocalDate dateLogged;

    @Column(name = "logged_at", nullable = false)
    private Instant loggedAt = Instant.now();

    public UUID getId() { return id; }
    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public LocalDate getDateLogged() { return dateLogged; }
    public void setDateLogged(LocalDate dateLogged) { this.dateLogged = dateLogged; }
    public Instant getLoggedAt() { return loggedAt; }
    public void setLoggedAt(Instant loggedAt) { this.loggedAt = loggedAt; }
}
