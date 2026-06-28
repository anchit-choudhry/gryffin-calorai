package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.ReminderDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.UserReminder;
import com.gryffin.calorai.repository.UserReminderRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for user reminder CRUD and delta-sync operations.
 */
@Service
public class ReminderService {

  private final UserReminderRepository reminderRepository;
  private final UserRepository userRepository;

  public ReminderService(
    final UserReminderRepository reminderRepository,
    final UserRepository userRepository
  ) {
    this.reminderRepository = reminderRepository;
    this.userRepository = userRepository;
  }

  /**
   * Returns all non-deleted reminders for a user.
   *
   * @param userId the user ID
   * @return list of reminder DTOs
   */
  public List<ReminderDto> getAll(final UUID userId) {
    return reminderRepository.findByUserIdAndDeletedAtIsNull(userId)
      .stream().map(this::toDto).toList();
  }

  /**
   * Returns all reminders updated after the given timestamp (for delta sync).
   *
   * @param userId the user ID
   * @param since  the lower bound (exclusive)
   * @return list of reminder DTOs
   */
  public List<ReminderDto> getChangesSince(final UUID userId, final Instant since) {
    return reminderRepository.findByUserIdAndUpdatedAtAfter(userId, since)
      .stream().map(this::toDto).toList();
  }

  /**
   * Creates a new reminder for the given user.
   *
   * @param userId the user ID
   * @param dto    the reminder data
   * @return the created reminder DTO
   */
  @Transactional
  public ReminderDto create(final UUID userId, final ReminderDto dto) {
    final AppUser user = userRepository.findById(userId)
      .orElseThrow(() -> new NoSuchElementException("User not found"));
    final UserReminder reminder = new UserReminder();
    reminder.setUser(user);
    applyDto(reminder, dto);
    return toDto(reminderRepository.save(reminder));
  }

  /**
   * Upserts a reminder by its client-provided ID (creates if absent, updates if present).
   *
   * @param userId     the user ID
   * @param reminderId the client-provided UUID (used as PK)
   * @param dto        the reminder data
   * @return the upserted reminder DTO
   */
  @Transactional
  public ReminderDto upsert(final UUID userId, final UUID reminderId, final ReminderDto dto) {
    final UserReminder reminder = reminderRepository.findById(reminderId)
      .filter(r -> r.getUser().getId().equals(userId))
      .orElseGet(() -> {
        final AppUser user = userRepository.findById(userId)
          .orElseThrow(() -> new NoSuchElementException("User not found"));
        final var newReminder = new UserReminder();
        newReminder.setId(reminderId);
        newReminder.setUser(user);
        return newReminder;
      });

    applyDto(reminder, dto);
    reminder.setDeletedAt(null);
    return toDto(reminderRepository.save(reminder));
  }

  /**
   * Soft-deletes a reminder by setting its deletedAt timestamp.
   *
   * @param userId     the user ID
   * @param reminderId the reminder ID
   */
  @Transactional
  public void delete(final UUID userId, final UUID reminderId) {
    final UserReminder reminder = reminderRepository.findById(reminderId)
      .filter(r -> r.getUser().getId().equals(userId))
      .orElseThrow(() -> new NoSuchElementException("Reminder not found"));
    reminder.setDeletedAt(Instant.now());
    reminderRepository.save(reminder);
  }

  /**
   * Hard-deletes all reminders for a user. Called during account deletion.
   *
   * @param userId the user ID
   */
  @Transactional
  public void deleteAllByUserId(final UUID userId) {
    reminderRepository.deleteAllByUserId(userId);
  }

  private void applyDto(final UserReminder reminder, final ReminderDto dto) {
    reminder.setType(dto.type());
    reminder.setTime(dto.time());
    reminder.setDaysOfWeek(dto.daysOfWeek());
    reminder.setEnabled(dto.enabled());
  }

  private ReminderDto toDto(final UserReminder reminder) {
    return new ReminderDto(
      reminder.getId().toString(),
      reminder.getType(),
      reminder.getTime(),
      reminder.getDaysOfWeek(),
      reminder.isEnabled(),
      reminder.getUpdatedAt(),
      reminder.getDeletedAt()
    );
  }
}
