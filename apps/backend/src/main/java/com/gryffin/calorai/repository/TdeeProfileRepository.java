package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.TdeeProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TdeeProfileRepository extends JpaRepository<TdeeProfile, UUID> {

  Optional<TdeeProfile> findByUserId(UUID userId);
}
