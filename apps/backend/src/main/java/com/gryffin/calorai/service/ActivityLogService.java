package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.ActivityLogDto;
import com.gryffin.calorai.entity.ActivityLog;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.repository.ActivityLogRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Service for activity log CRUD and delta-sync operations. */
@Service
public class ActivityLogService {

  private final ActivityLogRepository activityLogRepository;
  private final UserRepository userRepository;

  public ActivityLogService(final ActivityLogRepository activityLogRepository,
      final UserRepository userRepository) {
    this.activityLogRepository = activityLogRepository;
    this.userRepository = userRepository;
  }

  public List<ActivityLogDto> getDailyLogs(final UUID userId, final LocalDate date) {
    return activityLogRepository.findByUserIdAndDateLoggedAndDeletedAtIsNull(userId, date)
        .stream().map(this::toDto).toList();
  }

  public List<ActivityLogDto> getChangesSince(final UUID userId, final Instant since) {
    return activityLogRepository.findByUserIdAndUpdatedAtAfter(userId, since)
        .stream().map(this::toDto).toList();
  }

  @Transactional
  public ActivityLogDto create(final UUID userId, final ActivityLogDto dto) {
    final AppUser user = userRepository.findById(userId)
        .orElseThrow(() -> new NoSuchElementException("User not found"));
    final ActivityLog log = new ActivityLog();
    log.setUser(user);
    log.setActivityType(dto.activityType());
    log.setDurationMin(dto.durationMin());
    log.setCaloriesBurned(dto.caloriesBurned());
    log.setDateLogged(dto.dateLogged());
    return toDto(activityLogRepository.save(log));
  }

  @Transactional
  public ActivityLogDto upsert(final UUID userId, final UUID logId, final ActivityLogDto dto) {
    final ActivityLog log = activityLogRepository.findById(logId)
        .filter(a -> a.getUser().getId().equals(userId))
        .orElseGet(() -> {
          final AppUser user = userRepository.findById(userId)
              .orElseThrow(() -> new NoSuchElementException("User not found"));
          final var newLog = new ActivityLog();
          newLog.setId(logId);
          newLog.setUser(user);
          return newLog;
        });

    log.setActivityType(dto.activityType());
    log.setDurationMin(dto.durationMin());
    log.setCaloriesBurned(dto.caloriesBurned());
    log.setDateLogged(dto.dateLogged());
    log.setDeletedAt(null);

    return toDto(activityLogRepository.save(log));
  }

  @Transactional
  public void delete(final UUID userId, final UUID logId) {
    final ActivityLog log = activityLogRepository.findById(logId)
        .filter(a -> a.getUser().getId().equals(userId))
        .orElseThrow(() -> new NoSuchElementException("Activity log not found"));
    log.setDeletedAt(Instant.now());
    activityLogRepository.save(log);
  }

  private ActivityLogDto toDto(final ActivityLog log) {
    return new ActivityLogDto(
        log.getId().toString(),
        log.getActivityType(),
        log.getDurationMin(),
        log.getCaloriesBurned(),
        log.getDateLogged(),
        log.getLoggedAt(),
        log.getUpdatedAt(),
        log.getDeletedAt()
    );
  }
}
