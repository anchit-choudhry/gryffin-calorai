package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    List<ActivityLog> findByUserIdAndDateLogged(UUID userId, LocalDate dateLogged);
    long countByUserId(UUID userId);
}
