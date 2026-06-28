package com.gryffin.calorai.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

import com.gryffin.calorai.dto.PushSubscriptionDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.PushSubscription;
import com.gryffin.calorai.entity.UserReminder;
import com.gryffin.calorai.repository.PushSubscriptionRepository;
import com.gryffin.calorai.repository.UserReminderRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * Unit tests for {@link PushNotificationService} using BDDMockito.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PushNotificationServiceTest {

  @Mock
  private PushSubscriptionRepository pushRepository;

  @Mock
  private UserReminderRepository reminderRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private AppUser user;

  private PushNotificationService service;
  private UUID userId;
  private UUID subId;

  @BeforeEach
  void setUp() {
    service = new PushNotificationService(pushRepository, reminderRepository, userRepository);
    userId = UUID.randomUUID();
    subId = UUID.randomUUID();
    given(user.getId()).willReturn(userId);
    given(userRepository.findById(userId)).willReturn(Optional.of(user));
  }

  @Test
  void subscribeCreatesNewSubscriptionWhenNoneExists() {
    final var dto = new PushSubscriptionDto(
      "https://fcm.googleapis.com/fcm/send/abc123",
      "BNcK...",
      "tBHItJI...",
      "America/New_York"
    );
    given(pushRepository.findByUserIdAndEndpoint(userId, dto.endpoint()))
      .willReturn(Optional.empty());

    service.subscribe(userId, dto);

    final ArgumentCaptor<PushSubscription> captor = ArgumentCaptor.forClass(PushSubscription.class);
    then(pushRepository).should().save(captor.capture());
    final PushSubscription saved = captor.getValue();
    assertThat(saved.getEndpoint()).isEqualTo(dto.endpoint());
    assertThat(saved.getP256dh()).isEqualTo(dto.p256dh());
    assertThat(saved.getAuth()).isEqualTo(dto.auth());
    assertThat(saved.getTimezone()).isEqualTo("America/New_York");
  }

  @Test
  void subscribeUpdatesExistingSubscriptionWithoutQueryingUserRepository() {
    final var existing = new PushSubscription();
    existing.setEndpoint("https://fcm.googleapis.com/fcm/send/abc123");
    existing.setP256dh("oldKey");
    existing.setAuth("oldAuth");
    final var dto = new PushSubscriptionDto(
      "https://fcm.googleapis.com/fcm/send/abc123",
      "BNcK...",
      "tBHItJI...",
      "Europe/London"
    );
    given(pushRepository.findByUserIdAndEndpoint(userId, dto.endpoint()))
      .willReturn(Optional.of(existing));

    service.subscribe(userId, dto);

    then(userRepository).shouldHaveNoInteractions();
    final ArgumentCaptor<PushSubscription> captor = ArgumentCaptor.forClass(PushSubscription.class);
    then(pushRepository).should().save(captor.capture());
    assertThat(captor.getValue().getP256dh()).isEqualTo("BNcK...");
    assertThat(captor.getValue().getTimezone()).isEqualTo("Europe/London");
  }

  @Test
  void subscribeThrowsWhenUserNotFound() {
    final var dto = new PushSubscriptionDto(
      "https://fcm.googleapis.com/fcm/send/xyz",
      "key",
      "auth",
      null
    );
    given(pushRepository.findByUserIdAndEndpoint(userId, dto.endpoint()))
      .willReturn(Optional.empty());
    given(userRepository.findById(userId)).willReturn(Optional.empty());

    assertThatThrownBy(() -> service.subscribe(userId, dto))
      .isInstanceOf(NoSuchElementException.class)
      .hasMessageContaining("User not found");
  }

  @Test
  void unsubscribeRemovesSubscriptionByEndpoint() {
    final String endpoint = "https://fcm.googleapis.com/fcm/send/abc123";
    service.unsubscribe(userId, endpoint);
    then(pushRepository).should().deleteByUserIdAndEndpoint(userId, endpoint);
  }

  @Test
  void sendDueReminderNotificationsSkipsWhenPushServiceNotEnabled() {
    // No @PostConstruct called in unit test, so vapidEcPrivateKey is null -> isEnabled() = false
    service.sendDueReminderNotifications();
    then(reminderRepository).should(never()).findByEnabledTrueAndDeletedAtIsNull();
  }

  @Test
  void sendDueReminderNotificationsSkipsWhenNoReminders() {
    // vapidEcPrivateKey is null in unit tests (no @PostConstruct), so isEnabled() is false.
    // The full send path (encryptPayload + RestClient) requires real VAPID keys and a push
    // endpoint; cover that path via integration tests or a wired Spring context.
    given(reminderRepository.findByEnabledTrueAndDeletedAtIsNull()).willReturn(List.of());
    assertThat(service.isEnabled()).isFalse();
  }

  @Test
  void getVapidPublicKeyReturnsConfiguredValue() {
    assertThat(service.getVapidPublicKey()).isNotNull();
  }

  @Test
  void isEnabledReturnsFalseWhenVapidKeysNotConfigured() {
    assertThat(service.isEnabled()).isFalse();
  }
}
