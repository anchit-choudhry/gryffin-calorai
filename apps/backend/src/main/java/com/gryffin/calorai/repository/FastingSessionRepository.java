package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.FastingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FastingSessionRepository extends JpaRepository<FastingSession, UUID> {
    List<FastingSession> findByUserIdOrderByStartTimeDesc(UUID userId);
    Optional<FastingSession> findFirstByUserIdAndCompletedFalseOrderByStartTimeDesc(UUID userId);
    long countByUserId(UUID userId);
}
