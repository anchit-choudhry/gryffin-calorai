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
class StepLogServiceTest {

  @Mock
  private StepLogRepository stepLogRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private AppUser user;

  @InjectMocks
  private StepLogService stepLogService;

  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    BDDMockito.given(user.getId()).willReturn(userId);
  }

  @Test
  void getAllReturnsLogsExcludingDeleted() {
    final var log = buildStepLog(8000, LocalDate.now());
    BDDMockito.given(
        stepLogRepository.findByUserIdAndDeletedAtIsNullOrderByDateLoggedDesc(userId))
        .willReturn(List.of(log));

    final var result = stepLogService.getAll(userId);

    Assertions.assertThat(result).hasSize(1);
    Assertions.assertThat(result.getFirst().steps()).isEqualTo(8000);
  }

  @Test
  void getByDateReturnsLogForDate() {
    final var log = buildStepLog(10000, LocalDate.now());
    BDDMockito.given(
        stepLogRepository.findByUserIdAndDateLoggedAndDeletedAtIsNull(userId, LocalDate.now()))
        .willReturn(Optional.of(log));

    final var result = stepLogService.getByDate(userId, LocalDate.now());

    Assertions.assertThat(result).isPresent();
    Assertions.assertThat(result.get().steps()).isEqualTo(10000);
  }

  @Test
  void getByDateReturnsEmptyWhenNoLog() {
    BDDMockito.given(
        stepLogRepository.findByUserIdAndDateLoggedAndDeletedAtIsNull(userId, LocalDate.now()))
        .willReturn(Optional.empty());

    final var result = stepLogService.getByDate(userId, LocalDate.now());

    Assertions.assertThat(result).isEmpty();
  }

  @Test
  void getChangesSinceReturnsLogsUpdatedAfterTimestamp() {
    final var since = Instant.now().minusSeconds(3600);
    BDDMockito.given(stepLogRepository.findByUserIdAndUpdatedAtAfter(userId, since))
        .willReturn(List.of(buildStepLog(5000, LocalDate.now())));

    final var result = stepLogService.getChangesSince(userId, since);

    Assertions.assertThat(result).hasSize(1);
  }

  @Test
  void upsertByDateCreatesNewLogWhenNoneExists() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    BDDMockito.given(
        stepLogRepository.findByUserIdAndDateLoggedAndDeletedAtIsNull(userId, LocalDate.now()))
        .willReturn(Optional.empty());
    final var saved = buildStepLog(7500, LocalDate.now());
    BDDMockito.given(stepLogRepository.save(ArgumentMatchers.any())).willReturn(saved);

    final var dto = new StepLogDto(null, 7500, LocalDate.now(), null, null);
    final var result = stepLogService.upsertByDate(userId, dto);

    Assertions.assertThat(result.steps()).isEqualTo(7500);
  }

  @Test
  void upsertByDateUpdatesExistingLog() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    final var existing = buildStepLog(5000, LocalDate.now());
    BDDMockito.given(
        stepLogRepository.findByUserIdAndDateLoggedAndDeletedAtIsNull(userId, LocalDate.now()))
        .willReturn(Optional.of(existing));
    BDDMockito.given(stepLogRepository.save(ArgumentMatchers.any())).willReturn(existing);

    final var dto = new StepLogDto(null, 12000, LocalDate.now(), null, null);
    stepLogService.upsertByDate(userId, dto);

    final var captor = ArgumentCaptor.forClass(StepLog.class);
    BDDMockito.then(stepLogRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getSteps()).isEqualTo(12000);
  }

  @Test
  void deleteByDateSetsDeletedAt() {
    final var log = buildStepLog(6000, LocalDate.now());
    BDDMockito.given(
        stepLogRepository.findByUserIdAndDateLoggedAndDeletedAtIsNull(userId, LocalDate.now()))
        .willReturn(Optional.of(log));

    stepLogService.deleteByDate(userId, LocalDate.now());

    final var captor = ArgumentCaptor.forClass(StepLog.class);
    BDDMockito.then(stepLogRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getDeletedAt()).isNotNull();
  }

  @Test
  void deleteByDateThrowsWhenNotFound() {
    BDDMockito.given(
        stepLogRepository.findByUserIdAndDateLoggedAndDeletedAtIsNull(userId, LocalDate.now()))
        .willReturn(Optional.empty());

    Assertions.assertThatThrownBy(() -> stepLogService.deleteByDate(userId, LocalDate.now()))
        .isInstanceOf(NoSuchElementException.class);
  }

  private StepLog buildStepLog(final int steps, final LocalDate date) {
    final var log = new StepLog();
    log.setId(UUID.randomUUID());
    log.setUser(user);
    log.setSteps(steps);
    log.setDateLogged(date);
    return log;
  }
}
