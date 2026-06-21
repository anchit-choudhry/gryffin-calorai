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
class WaterLogServiceTest {

  @Mock
  private WaterLogRepository waterLogRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private AppUser user;

  @InjectMocks
  private WaterLogService waterLogService;

  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    BDDMockito.given(user.getId()).willReturn(userId);
  }

  @Test
  void getDailyLogsReturnsLogsForDate() {
    final var log = buildLog(250.0, LocalDate.now());
    BDDMockito.given(
        waterLogRepository.findByUserIdAndDateLoggedAndDeletedAtIsNull(userId, LocalDate.now()))
      .willReturn(List.of(log));

    final var result = waterLogService.getDailyLogs(userId, LocalDate.now());

    Assertions.assertThat(result).hasSize(1);
    Assertions.assertThat(result.getFirst().amount()).isEqualTo(250.0);
  }

  @Test
  void getChangesSinceReturnsLogsUpdatedAfterTimestamp() {
    final var since = Instant.now().minusSeconds(3600);
    final var log = buildLog(300.0, LocalDate.now());
    BDDMockito.given(waterLogRepository.findByUserIdAndUpdatedAtAfter(userId, since))
      .willReturn(List.of(log));

    final var result = waterLogService.getChangesSince(userId, since);

    Assertions.assertThat(result).hasSize(1);
  }

  @Test
  void createPersistsAndReturnsDto() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    final var saved = buildLog(500.0, LocalDate.now());
    BDDMockito.given(waterLogRepository.save(ArgumentMatchers.any())).willReturn(saved);

    final var dto = new WaterLogDto(null, 500.0, LocalDate.now(), null, null, null);
    final var result = waterLogService.create(userId, dto);

    Assertions.assertThat(result.amount()).isEqualTo(500.0);
    BDDMockito.then(waterLogRepository).should().save(ArgumentMatchers.any(WaterLog.class));
  }

  @Test
  void createThrowsWhenUserNotFound() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.empty());

    final var dto = new WaterLogDto(null, 200.0, LocalDate.now(), null, null, null);
    Assertions.assertThatThrownBy(() -> waterLogService.create(userId, dto))
      .isInstanceOf(NoSuchElementException.class);
  }

  @Test
  void upsertCreatesNewLogWhenIdNotFound() {
    final var logId = UUID.randomUUID();
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    BDDMockito.given(waterLogRepository.findById(logId)).willReturn(Optional.empty());
    final var saved = buildLog(400.0, LocalDate.now());
    BDDMockito.given(waterLogRepository.save(ArgumentMatchers.any())).willReturn(saved);

    final var dto = new WaterLogDto(logId.toString(), 400.0, LocalDate.now(), null, null, null);
    final var result = waterLogService.upsert(userId, logId, dto);

    Assertions.assertThat(result).isNotNull();
  }

  @Test
  void upsertUpdatesExistingLogWithoutQueryingUserRepository() {
    final var logId = UUID.randomUUID();
    final var existing = buildLog(250.0, LocalDate.now());
    existing.setId(logId);
    BDDMockito.given(waterLogRepository.findById(logId)).willReturn(Optional.of(existing));
    BDDMockito.given(waterLogRepository.save(ArgumentMatchers.any())).willReturn(existing);

    final var dto = new WaterLogDto(logId.toString(), 300.0, LocalDate.now(), null, null, null);
    waterLogService.upsert(userId, logId, dto);

    BDDMockito.then(userRepository).shouldHaveNoInteractions();
    final var captor = ArgumentCaptor.forClass(WaterLog.class);
    BDDMockito.then(waterLogRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getAmount()).isEqualTo(300.0);
  }

  @Test
  void deleteSetsDeletedAt() {
    final var logId = UUID.randomUUID();
    final var log = buildLog(200.0, LocalDate.now());
    BDDMockito.given(waterLogRepository.findById(logId)).willReturn(Optional.of(log));

    waterLogService.delete(userId, logId);

    final var captor = ArgumentCaptor.forClass(WaterLog.class);
    BDDMockito.then(waterLogRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getDeletedAt()).isNotNull();
  }

  @Test
  void deleteThrowsWhenNotFound() {
    final var logId = UUID.randomUUID();
    BDDMockito.given(waterLogRepository.findById(logId)).willReturn(Optional.empty());

    Assertions.assertThatThrownBy(() -> waterLogService.delete(userId, logId))
      .isInstanceOf(NoSuchElementException.class);
  }

  private WaterLog buildLog(final double amount, final LocalDate date) {
    final var log = new WaterLog();
    log.setId(UUID.randomUUID());
    log.setUser(user);
    log.setAmount(amount);
    log.setDateLogged(date);
    return log;
  }
}
