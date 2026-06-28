package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.ReminderDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.UserReminder;
import com.gryffin.calorai.repository.UserReminderRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.time.Instant;
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
class ReminderServiceTest {

  @Mock
  private UserReminderRepository reminderRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private AppUser user;

  @InjectMocks
  private ReminderService reminderService;

  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    BDDMockito.given(user.getId()).willReturn(userId);
  }

  @Test
  void getAllReturnsNonDeletedReminders() {
    final var reminder = buildReminder("water", "08:00");
    BDDMockito.given(reminderRepository.findByUserIdAndDeletedAtIsNull(userId))
      .willReturn(List.of(reminder));

    final var result = reminderService.getAll(userId);

    Assertions.assertThat(result).hasSize(1);
    Assertions.assertThat(result.getFirst().type()).isEqualTo("water");
  }

  @Test
  void getChangesSinceReturnsDeltaReminders() {
    final var since = Instant.now().minusSeconds(3600);
    BDDMockito.given(reminderRepository.findByUserIdAndUpdatedAtAfter(userId, since))
      .willReturn(List.of(buildReminder("meal", "12:00")));

    final var result = reminderService.getChangesSince(userId, since);

    Assertions.assertThat(result).hasSize(1);
    Assertions.assertThat(result.getFirst().type()).isEqualTo("meal");
  }

  @Test
  void createPersistsAndReturnsDto() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    final var saved = buildReminder("step", "18:00");
    BDDMockito.given(reminderRepository.save(ArgumentMatchers.any())).willReturn(saved);

    final var dto = new ReminderDto(null, "step", "18:00", 127, true, null, null);
    final var result = reminderService.create(userId, dto);

    Assertions.assertThat(result.type()).isEqualTo("step");
  }

  @Test
  void createThrowsWhenUserNotFound() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.empty());

    final var dto = new ReminderDto(null, "water", "09:00", 62, true, null, null);
    Assertions.assertThatThrownBy(() -> reminderService.create(userId, dto))
      .isInstanceOf(NoSuchElementException.class);
  }

  @Test
  void upsertCreatesNewReminderWhenIdNotFound() {
    final var reminderId = UUID.randomUUID();
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    BDDMockito.given(reminderRepository.findById(reminderId)).willReturn(Optional.empty());
    BDDMockito.given(reminderRepository.save(ArgumentMatchers.any()))
      .willReturn(buildReminder("water", "07:00"));

    final var dto = new ReminderDto(null, "water", "07:00", 62, true, null, null);
    final var result = reminderService.upsert(userId, reminderId, dto);

    Assertions.assertThat(result).isNotNull();
  }

  @Test
  void upsertUpdatesExistingReminderWithoutQueryingUserRepository() {
    final var reminderId = UUID.randomUUID();
    final var existing = buildReminder("meal", "12:00");
    existing.setId(reminderId);
    BDDMockito.given(reminderRepository.findById(reminderId)).willReturn(Optional.of(existing));
    BDDMockito.given(reminderRepository.save(ArgumentMatchers.any())).willReturn(existing);

    final var dto = new ReminderDto(null, "meal", "13:00", 62, false, null, null);
    reminderService.upsert(userId, reminderId, dto);

    BDDMockito.then(userRepository).shouldHaveNoInteractions();
    final var captor = ArgumentCaptor.forClass(UserReminder.class);
    BDDMockito.then(reminderRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getTime()).isEqualTo("13:00");
    Assertions.assertThat(captor.getValue().isEnabled()).isFalse();
  }

  @Test
  void deleteSetsDeletedAt() {
    final var reminderId = UUID.randomUUID();
    final var reminder = buildReminder("water", "08:00");
    BDDMockito.given(reminderRepository.findById(reminderId)).willReturn(Optional.of(reminder));

    reminderService.delete(userId, reminderId);

    final var captor = ArgumentCaptor.forClass(UserReminder.class);
    BDDMockito.then(reminderRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getDeletedAt()).isNotNull();
  }

  @Test
  void deleteThrowsWhenNotFound() {
    final var reminderId = UUID.randomUUID();
    BDDMockito.given(reminderRepository.findById(reminderId)).willReturn(Optional.empty());

    Assertions.assertThatThrownBy(() -> reminderService.delete(userId, reminderId))
      .isInstanceOf(NoSuchElementException.class);
  }

  private UserReminder buildReminder(final String type, final String time) {
    final var reminder = new UserReminder();
    reminder.setId(UUID.randomUUID());
    reminder.setUser(user);
    reminder.setType(type);
    reminder.setTime(time);
    reminder.setDaysOfWeek(62);
    reminder.setEnabled(true);
    return reminder;
  }
}
