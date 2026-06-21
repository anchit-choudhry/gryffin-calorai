package com.gryffin.calorai.service;

import com.gryffin.calorai.repository.RefreshTokenRepository;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled task that prunes expired refresh tokens from the database nightly.
 */
@Component
public class RefreshTokenCleanupTask {

  private static final Logger log = LoggerFactory.getLogger(RefreshTokenCleanupTask.class);

  private final RefreshTokenRepository refreshTokenRepository;

  public RefreshTokenCleanupTask(RefreshTokenRepository refreshTokenRepository) {
    this.refreshTokenRepository = refreshTokenRepository;
  }

  @Scheduled(cron = "${app.security.refresh-token-cleanup-cron:0 0 3 * * *}")
  public void deleteExpiredTokens() {
    refreshTokenRepository.deleteExpired(Instant.now());
    log.info("Pruned expired refresh tokens");
  }
}
