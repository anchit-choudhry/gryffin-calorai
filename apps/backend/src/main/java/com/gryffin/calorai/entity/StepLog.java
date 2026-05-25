package com.gryffin.calorai.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "step_logs", indexes = {
    @Index(name = "idx_steps_user_date", columnList = "user_id, date_logged")
})
public class StepLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Min(0)
    @Column(nullable = false)
    private int steps;

    @Column(name = "date_logged", nullable = false)
    private LocalDate dateLogged;

    public UUID getId() { return id; }
    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public int getSteps() { return steps; }
    public void setSteps(int steps) { this.steps = steps; }
    public LocalDate getDateLogged() { return dateLogged; }
    public void setDateLogged(LocalDate dateLogged) { this.dateLogged = dateLogged; }
}
