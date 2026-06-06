package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.FastingSessionDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.FastingSession;
import com.gryffin.calorai.repository.FastingSessionRepository;
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
class FastingSessionServiceTest {

  @Mock
  private FastingSessionRepository fastingSessionRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private AppUser user;

  @InjectMocks
  private FastingSessionService fastingSessionService;

  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    BDDMockito.given(user.getId()).willReturn(userId);
  }

  @Test
  void getAllReturnsSessionsExcludingDeleted() {
    final var session = buildSession(16, false);
    BDDMockito.given(
        fastingSessionRepository.findByUserIdAndDeletedAtIsNullOrderByStartTimeDesc(userId))
        .willReturn(List.of(session));

    final var result = fastingSessionService.getAll(userId);

    Assertions.assertThat(result).hasSize(1);
    Assertions.assertThat(result.getFirst().targetHours()).isEqualTo(16);
  }

  @Test
  void getActiveReturnsActiveSession() {
    final var session = buildSession(16, false);
    BDDMockito.given(fastingSessionRepository
        .findFirstByUserIdAndCompletedFalseAndDeletedAtIsNullOrderByStartTimeDesc(userId))
        .willReturn(Optional.of(session));

    final var result = fastingSessionService.getActive(userId);

    Assertions.assertThat(result).isPresent();
    Assertions.assertThat(result.get().completed()).isFalse();
  }

  @Test
  void getActiveReturnsEmptyWhenNoneActive() {
    BDDMockito.given(fastingSessionRepository
        .findFirstByUserIdAndCompletedFalseAndDeletedAtIsNullOrderByStartTimeDesc(userId))
        .willReturn(Optional.empty());

    final var result = fastingSessionService.getActive(userId);

    Assertions.assertThat(result).isEmpty();
  }

  @Test
  void getChangesSinceReturnsSessionsUpdatedAfterTimestamp() {
    final var since = Instant.now().minusSeconds(3600);
    BDDMockito.given(fastingSessionRepository.findByUserIdAndUpdatedAtAfter(userId, since))
        .willReturn(List.of(buildSession(14, true)));

    final var result = fastingSessionService.getChangesSince(userId, since);

    Assertions.assertThat(result).hasSize(1);
  }

  @Test
  void createPersistsAndReturnsDto() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    final var saved = buildSession(16, false);
    BDDMockito.given(fastingSessionRepository.save(ArgumentMatchers.any())).willReturn(saved);

    final var startTime = Instant.now();
    final var dto = new FastingSessionDto(null, startTime, null, 16, LocalDate.now(), false, null,
        null);
    final var result = fastingSessionService.create(userId, dto);

    Assertions.assertThat(result.targetHours()).isEqualTo(16);
    BDDMockito.then(fastingSessionRepository).should()
        .save(ArgumentMatchers.any(FastingSession.class));
  }

  @Test
  void createThrowsWhenUserNotFound() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.empty());

    final var dto = new FastingSessionDto(null, Instant.now(), null, 16, LocalDate.now(), false,
        null, null);
    Assertions.assertThatThrownBy(() -> fastingSessionService.create(userId, dto))
        .isInstanceOf(NoSuchElementException.class);
  }

  @Test
  void upsertCompletesExistingSession() {
    final var sessionId = UUID.randomUUID();
    final var existing = buildSession(16, false);
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    BDDMockito.given(fastingSessionRepository.findById(sessionId))
        .willReturn(Optional.of(existing));
    BDDMockito.given(fastingSessionRepository.save(ArgumentMatchers.any())).willReturn(existing);

    final var endTime = Instant.now();
    final var dto = new FastingSessionDto(
        sessionId.toString(), existing.getStartTime(), endTime, 16, LocalDate.now(), true, null,
        null
    );
    fastingSessionService.upsert(userId, sessionId, dto);

    final var captor = ArgumentCaptor.forClass(FastingSession.class);
    BDDMockito.then(fastingSessionRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().isCompleted()).isTrue();
    Assertions.assertThat(captor.getValue().getEndTime()).isEqualTo(endTime);
  }

  @Test
  void deleteSetsDeletedAt() {
    final var sessionId = UUID.randomUUID();
    final var session = buildSession(16, false);
    BDDMockito.given(fastingSessionRepository.findById(sessionId)).willReturn(Optional.of(session));

    fastingSessionService.delete(userId, sessionId);

    final var captor = ArgumentCaptor.forClass(FastingSession.class);
    BDDMockito.then(fastingSessionRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getDeletedAt()).isNotNull();
  }

  @Test
  void deleteThrowsWhenNotFound() {
    final var sessionId = UUID.randomUUID();
    BDDMockito.given(fastingSessionRepository.findById(sessionId)).willReturn(Optional.empty());

    Assertions.assertThatThrownBy(() -> fastingSessionService.delete(userId, sessionId))
        .isInstanceOf(NoSuchElementException.class);
  }

  private FastingSession buildSession(final int targetHours, final boolean completed) {
    final var session = new FastingSession();
    session.setId(UUID.randomUUID());
    session.setUser(user);
    session.setStartTime(Instant.now().minusSeconds(3600));
    session.setTargetHours(targetHours);
    session.setDateLogged(LocalDate.now());
    session.setCompleted(completed);
    return session;
  }
}
