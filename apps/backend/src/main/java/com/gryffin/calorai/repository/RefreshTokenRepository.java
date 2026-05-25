package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    @Transactional
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.jti = :jti")
    int deleteByJti(@Param("jti") UUID jti);

    @Transactional
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    void deleteExpired(@Param("now") Instant now);
}
