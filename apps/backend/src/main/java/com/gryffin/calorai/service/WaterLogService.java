package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.WaterLogDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.WaterLog;
import com.gryffin.calorai.repository.UserRepository;
import com.gryffin.calorai.repository.WaterLogRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for water log CRUD and delta-sync operations.
 */
@Service
public class WaterLogService {

  private final WaterLogRepository waterLogRepository;
  private final UserRepository userRepository;

  public WaterLogService(final WaterLogRepository waterLogRepository,
    final UserRepository userRepository) {
    this.waterLogRepository = waterLogRepository;
    this.userRepository = userRepository;
  }

  public List<WaterLogDto> getDailyLogs(final UUID userId, final LocalDate date) {
    return waterLogRepository.findByUserIdAndDateLoggedAndDeletedAtIsNull(userId, date)
      .stream().map(this::toDto).toList();
  }

  public List<WaterLogDto> getChangesSince(final UUID userId, final Instant since) {
    return waterLogRepository.findByUserIdAndUpdatedAtAfter(userId, since)
      .stream().map(this::toDto).toList();
  }

  @Transactional
  public WaterLogDto create(final UUID userId, final WaterLogDto dto) {
    final AppUser user = userRepository.findById(userId)
      .orElseThrow(() -> new NoSuchElementException("User not found"));
    final WaterLog log = new WaterLog();
    log.setUser(user);
    log.setAmount(dto.amount());
    log.setDateLogged(dto.dateLogged());
    return toDto(waterLogRepository.save(log));
  }

  @Transactional
  public WaterLogDto upsert(final UUID userId, final UUID logId, final WaterLogDto dto) {
    final WaterLog log = waterLogRepository.findById(logId)
      .filter(w -> w.getUser().getId().equals(userId))
      .orElseGet(() -> {
        final AppUser user = userRepository.findById(userId)
          .orElseThrow(() -> new NoSuchElementException("User not found"));
        final var newLog = new WaterLog();
        newLog.setId(logId);
        newLog.setUser(user);
        return newLog;
      });

    log.setAmount(dto.amount());
    log.setDateLogged(dto.dateLogged());
    log.setDeletedAt(null);

    return toDto(waterLogRepository.save(log));
  }

  /**
   * Deletes all water logs for a user. Called during E2E activation migration.
   *
   * @param userId the user ID
   */
  @Transactional
  public void deleteAllByUserId(final UUID userId) {
    waterLogRepository.deleteAllByUserId(userId);
  }

  @Transactional
  public void delete(final UUID userId, final UUID logId) {
    final WaterLog log = waterLogRepository.findById(logId)
      .filter(w -> w.getUser().getId().equals(userId))
      .orElseThrow(() -> new NoSuchElementException("Water log not found"));
    log.setDeletedAt(Instant.now());
    waterLogRepository.save(log);
  }

  private WaterLogDto toDto(final WaterLog log) {
    return new WaterLogDto(
      log.getId().toString(),
      log.getAmount(),
      log.getDateLogged(),
      log.getLoggedAt(),
      log.getUpdatedAt(),
      log.getDeletedAt()
    );
  }
}
