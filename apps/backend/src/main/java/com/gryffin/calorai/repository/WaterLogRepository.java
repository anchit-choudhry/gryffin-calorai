package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.WaterLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface WaterLogRepository extends JpaRepository<WaterLog, UUID> {
    List<WaterLog> findByUserIdAndDateLogged(UUID userId, LocalDate dateLogged);
    long countByUserId(UUID userId);
}
