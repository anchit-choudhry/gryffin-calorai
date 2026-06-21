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
import java.util.Optional;
import java.util.UUID;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.BDDMockito;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ActivityLogServiceTest {

  @Mock
  private ActivityLogRepository activityLogRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private AppUser user;

  @InjectMocks
  private ActivityLogService activityLogService;

  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    BDDMockito.given(user.getId()).willReturn(userId);
  }

  @Test
  void getDailyLogsReturnsLogsForDate() {
    final var log = buildLog("Running", 30, 250.0, LocalDate.now());
    BDDMockito.given(activityLogRepository
        .findByUserIdAndDateLoggedAndDeletedAtIsNull(userId, LocalDate.now()))
      .willReturn(List.of(log));

    final var result = activityLogService.getDailyLogs(userId, LocalDate.now());

    Assertions.assertThat(result).hasSize(1);
    Assertions.assertThat(result.getFirst().activityType()).isEqualTo("Running");
  }

  @Test
  void getChangesSinceReturnsLogsUpdatedAfterTimestamp() {
    final var since = Instant.now().minusSeconds(3600);
    BDDMockito.given(activityLogRepository.findByUserIdAndUpdatedAtAfter(userId, since))
      .willReturn(List.of(buildLog("Cycling", 45, 300.0, LocalDate.now())));

    final var result = activityLogService.getChangesSince(userId, since);

    Assertions.assertThat(result).hasSize(1);
    Assertions.assertThat(result.getFirst().activityType()).isEqualTo("Cycling");
  }

  @Test
  void createPersistsAndReturnsDto() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    final var saved = buildLog("Swimming", 60, 400.0, LocalDate.now());
    BDDMockito.given(activityLogRepository.save(ArgumentMatchers.any())).willReturn(saved);

    final var dto = new ActivityLogDto(null, "Swimming", 60, 400.0, LocalDate.now(), null, null,
      null);
    final var result = activityLogService.create(userId, dto);

    Assertions.assertThat(result.activityType()).isEqualTo("Swimming");
    Assertions.assertThat(result.caloriesBurned()).isEqualTo(400.0);
  }

  @Test
  void createThrowsWhenUserNotFound() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.empty());

    final var dto = new ActivityLogDto(null, "Running", 30, 200.0, LocalDate.now(), null, null,
      null);
    Assertions.assertThatThrownBy(() -> activityLogService.create(userId, dto))
      .isInstanceOf(NoSuchElementException.class);
  }

  @Test
  void upsertCreatesNewLogWhenIdNotFound() {
    final var logId = UUID.randomUUID();
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    BDDMockito.given(activityLogRepository.findById(logId)).willReturn(Optional.empty());
    BDDMockito.given(activityLogRepository.save(ArgumentMatchers.any()))
      .willReturn(buildLog("Yoga", 30, 150.0, LocalDate.now()));

    final var dto = new ActivityLogDto(logId.toString(), "Yoga", 30, 150.0, LocalDate.now(), null,
      null, null);
    final var result = activityLogService.upsert(userId, logId, dto);

    Assertions.assertThat(result).isNotNull();
  }

  @Test
  void upsertUpdatesExistingLogWithoutQueryingUserRepository() {
    final var logId = UUID.randomUUID();
    final var existing = buildLog("Running", 30, 200.0, LocalDate.now());
    existing.setId(logId);
    BDDMockito.given(activityLogRepository.findById(logId)).willReturn(Optional.of(existing));
    BDDMockito.given(activityLogRepository.save(ArgumentMatchers.any())).willReturn(existing);

    final var dto = new ActivityLogDto(logId.toString(), "Cycling", 45, 320.0, LocalDate.now(),
      null, null, null);
    activityLogService.upsert(userId, logId, dto);

    BDDMockito.then(userRepository).shouldHaveNoInteractions();
    final var captor = ArgumentCaptor.forClass(ActivityLog.class);
    BDDMockito.then(activityLogRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getActivityType()).isEqualTo("Cycling");
    Assertions.assertThat(captor.getValue().getDurationMin()).isEqualTo(45);
  }

  @Test
  void deleteSetsDeletedAt() {
    final var logId = UUID.randomUUID();
    final var log = buildLog("Running", 30, 200.0, LocalDate.now());
    BDDMockito.given(activityLogRepository.findById(logId)).willReturn(Optional.of(log));

    activityLogService.delete(userId, logId);

    final var captor = ArgumentCaptor.forClass(ActivityLog.class);
    BDDMockito.then(activityLogRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getDeletedAt()).isNotNull();
  }

  @Test
  void deleteThrowsWhenNotFound() {
    final var logId = UUID.randomUUID();
    BDDMockito.given(activityLogRepository.findById(logId)).willReturn(Optional.empty());

    Assertions.assertThatThrownBy(() -> activityLogService.delete(userId, logId))
      .isInstanceOf(NoSuchElementException.class);
  }

  private ActivityLog buildLog(final String type, final int duration, final double calories,
    final LocalDate date) {
    final var log = new ActivityLog();
    log.setId(UUID.randomUUID());
    log.setUser(user);
    log.setActivityType(type);
    log.setDurationMin(duration);
    log.setCaloriesBurned(calories);
    log.setDateLogged(date);
    return log;
  }
}
