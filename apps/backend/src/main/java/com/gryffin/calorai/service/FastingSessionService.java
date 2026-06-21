package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.FastingSessionDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.FastingSession;
import com.gryffin.calorai.repository.FastingSessionRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for fasting session CRUD and delta-sync operations.
 */
@Service
public class FastingSessionService {

  private final FastingSessionRepository fastingSessionRepository;
  private final UserRepository userRepository;

  public FastingSessionService(final FastingSessionRepository fastingSessionRepository,
    final UserRepository userRepository) {
    this.fastingSessionRepository = fastingSessionRepository;
    this.userRepository = userRepository;
  }

  public List<FastingSessionDto> getAll(final UUID userId) {
    return fastingSessionRepository.findByUserIdAndDeletedAtIsNullOrderByStartTimeDesc(userId)
      .stream().map(this::toDto).toList();
  }

  public Optional<FastingSessionDto> getActive(final UUID userId) {
    return fastingSessionRepository
      .findFirstByUserIdAndCompletedFalseAndDeletedAtIsNullOrderByStartTimeDesc(userId)
      .map(this::toDto);
  }

  public List<FastingSessionDto> getChangesSince(final UUID userId, final Instant since) {
    return fastingSessionRepository.findByUserIdAndUpdatedAtAfter(userId, since)
      .stream().map(this::toDto).toList();
  }

  @Transactional
  public FastingSessionDto create(final UUID userId, final FastingSessionDto dto) {
    final AppUser user = userRepository.findById(userId)
      .orElseThrow(() -> new NoSuchElementException("User not found"));
    final FastingSession session = new FastingSession();
    session.setUser(user);
    session.setStartTime(dto.startTime());
    session.setEndTime(dto.endTime());
    session.setTargetHours(dto.targetHours());
    session.setDateLogged(dto.dateLogged());
    session.setCompleted(dto.completed());
    return toDto(fastingSessionRepository.save(session));
  }

  @Transactional
  public FastingSessionDto upsert(final UUID userId, final UUID sessionId,
    final FastingSessionDto dto) {
    final AppUser user = userRepository.findById(userId)
      .orElseThrow(() -> new NoSuchElementException("User not found"));

    final FastingSession session = fastingSessionRepository.findById(sessionId)
      .filter(s -> s.getUser().getId().equals(userId))
      .orElseGet(() -> {
        final var newSession = new FastingSession();
        newSession.setId(sessionId);
        newSession.setUser(user);
        return newSession;
      });

    session.setStartTime(dto.startTime());
    session.setEndTime(dto.endTime());
    session.setTargetHours(dto.targetHours());
    session.setDateLogged(dto.dateLogged());
    session.setCompleted(dto.completed());
    session.setDeletedAt(null);

    return toDto(fastingSessionRepository.save(session));
  }

  /**
   * Deletes all fasting sessions for a user. Called during E2E activation migration.
   *
   * @param userId the user ID
   */
  @Transactional
  public void deleteAllByUserId(final UUID userId) {
    fastingSessionRepository.deleteAllByUserId(userId);
  }

  @Transactional
  public void delete(final UUID userId, final UUID sessionId) {
    final FastingSession session = fastingSessionRepository.findById(sessionId)
      .filter(s -> s.getUser().getId().equals(userId))
      .orElseThrow(() -> new NoSuchElementException("Fasting session not found"));
    session.setDeletedAt(Instant.now());
    fastingSessionRepository.save(session);
  }

  private FastingSessionDto toDto(final FastingSession session) {
    return new FastingSessionDto(
      session.getId().toString(),
      session.getStartTime(),
      session.getEndTime(),
      session.getTargetHours(),
      session.getDateLogged(),
      session.isCompleted(),
      session.getUpdatedAt(),
      session.getDeletedAt()
    );
  }
}
