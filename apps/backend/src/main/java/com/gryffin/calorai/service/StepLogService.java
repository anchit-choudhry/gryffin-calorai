package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.StepLogDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.StepLog;
import com.gryffin.calorai.repository.StepLogRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Service for step log CRUD and delta-sync operations. */
@Service
public class StepLogService {

  private final StepLogRepository stepLogRepository;
  private final UserRepository userRepository;

  public StepLogService(final StepLogRepository stepLogRepository,
      final UserRepository userRepository) {
    this.stepLogRepository = stepLogRepository;
    this.userRepository = userRepository;
  }

  public List<StepLogDto> getAll(final UUID userId) {
    return stepLogRepository.findByUserIdAndDeletedAtIsNullOrderByDateLoggedDesc(userId)
        .stream().map(this::toDto).toList();
  }

  public Optional<StepLogDto> getByDate(final UUID userId, final LocalDate date) {
    return stepLogRepository.findByUserIdAndDateLoggedAndDeletedAtIsNull(userId, date)
        .map(this::toDto);
  }

  public List<StepLogDto> getChangesSince(final UUID userId, final Instant since) {
    return stepLogRepository.findByUserIdAndUpdatedAtAfter(userId, since)
        .stream().map(this::toDto).toList();
  }

  @Transactional
  public StepLogDto upsertByDate(final UUID userId, final StepLogDto dto) {
    final AppUser user = userRepository.findById(userId)
        .orElseThrow(() -> new NoSuchElementException("User not found"));

    final StepLog log = stepLogRepository
        .findByUserIdAndDateLoggedAndDeletedAtIsNull(userId, dto.dateLogged())
        .orElseGet(() -> {
          final var newLog = new StepLog();
          newLog.setUser(user);
          return newLog;
        });

    log.setSteps(dto.steps());
    log.setDateLogged(dto.dateLogged());
    log.setDeletedAt(null);

    return toDto(stepLogRepository.save(log));
  }

  /**
   * Deletes all step logs for a user. Called during E2E activation migration.
   *
   * @param userId the user ID
   */
  @Transactional
  public void deleteAllByUserId(final UUID userId) {
    stepLogRepository.deleteAllByUserId(userId);
  }

  @Transactional
  public void deleteByDate(final UUID userId, final LocalDate date) {
    final StepLog log = stepLogRepository
        .findByUserIdAndDateLoggedAndDeletedAtIsNull(userId, date)
        .orElseThrow(() -> new NoSuchElementException("Step log not found"));
    log.setDeletedAt(Instant.now());
    stepLogRepository.save(log);
  }

  private StepLogDto toDto(final StepLog log) {
    return new StepLogDto(
        log.getId().toString(),
        log.getSteps(),
        log.getDateLogged(),
        log.getUpdatedAt(),
        log.getDeletedAt()
    );
  }
}
