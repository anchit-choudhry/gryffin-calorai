package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.BodyMeasurement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface BodyMeasurementRepository extends JpaRepository<BodyMeasurement, UUID> {
    List<BodyMeasurement> findByUserIdOrderByDateLoggedDesc(UUID userId);
    long countByUserId(UUID userId);
}
