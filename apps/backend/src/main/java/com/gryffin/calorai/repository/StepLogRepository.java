package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.StepLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StepLogRepository extends JpaRepository<StepLog, UUID> {
    Optional<StepLog> findByUserIdAndDateLogged(UUID userId, LocalDate dateLogged);
    List<StepLog> findByUserIdOrderByDateLoggedDesc(UUID userId);
    long countByUserId(UUID userId);
}
