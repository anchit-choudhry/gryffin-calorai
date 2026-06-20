package com.gryffin.calorai.service;

import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.any;

import com.gryffin.calorai.dto.EncryptedBlobDto;
import com.gryffin.calorai.dto.UserE2ESaltDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.EncryptedBlob;
import com.gryffin.calorai.entity.UserE2EConfig;
import com.gryffin.calorai.repository.EncryptedBlobRepository;
import com.gryffin.calorai.repository.UserE2EConfigRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/** Unit tests for EncryptedBlobService. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EncryptedBlobServiceTest {

  @Mock
  private EncryptedBlobRepository blobRepository;

  @Mock
  private UserE2EConfigRepository configRepository;

  @Mock
  private UserRepository userRepository;

  @InjectMocks
  private EncryptedBlobService service;

  private static final UUID USER_ID = UUID.randomUUID();

  private AppUser makeUser() {
    final AppUser user = new AppUser();
    user.setId(USER_ID);
    return user;
  }

  @Test
  void getSaltReturnsConfigWhenPresent() {
    final UserE2EConfig config = new UserE2EConfig();
    config.setUserId(USER_ID);
    config.setSalt("abc123");
    given(configRepository.findById(USER_ID)).willReturn(Optional.of(config));

    final Optional<UserE2ESaltDto> result = service.getSalt(USER_ID);

    Assertions.assertThat(result).isPresent();
    Assertions.assertThat(result.get().salt()).isEqualTo("abc123");
  }

  @Test
  void getSaltReturnsEmptyWhenNotConfigured() {
    given(configRepository.findById(USER_ID)).willReturn(Optional.empty());

    final Optional<UserE2ESaltDto> result = service.getSalt(USER_ID);

    Assertions.assertThat(result).isEmpty();
  }

  @Test
  void saveSaltCreatesConfigForNewUser() {
    given(configRepository.findById(USER_ID)).willReturn(Optional.empty());
    given(configRepository.save(any(UserE2EConfig.class))).willAnswer(i -> i.getArgument(0));

    service.saveSalt(USER_ID, new UserE2ESaltDto("newsalt"));

    then(configRepository).should().save(any(UserE2EConfig.class));
  }

  @Test
  void saveSaltUpdatesExistingConfig() {
    final UserE2EConfig existing = new UserE2EConfig();
    existing.setUserId(USER_ID);
    existing.setSalt("oldsalt");
    given(configRepository.findById(USER_ID)).willReturn(Optional.of(existing));
    given(configRepository.save(any(UserE2EConfig.class))).willAnswer(i -> i.getArgument(0));

    service.saveSalt(USER_ID, new UserE2ESaltDto("newsalt"));

    Assertions.assertThat(existing.getSalt()).isEqualTo("newsalt");
  }

  @Test
  void upsertBlobsStoresNewBlobs() {
    final AppUser user = makeUser();
    given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));
    given(blobRepository.findByUserIdAndClientBlobId(USER_ID, "foodItem:abc"))
        .willReturn(Optional.empty());
    given(blobRepository.save(any(EncryptedBlob.class))).willAnswer(i -> i.getArgument(0));

    final List<EncryptedBlobDto> dtos = List.of(
        new EncryptedBlobDto("foodItem:abc", "iv1", "ct1", null, false)
    );
    service.upsertBlobs(USER_ID, dtos);

    then(blobRepository).should().save(any(EncryptedBlob.class));
  }

  @Test
  void upsertBlobsUpdatesExistingBlobs() {
    final AppUser user = makeUser();
    final EncryptedBlob existing = new EncryptedBlob();
    existing.setUser(user);
    existing.setClientBlobId("foodItem:abc");
    existing.setIv("oldiv");
    existing.setCiphertext("oldct");
    given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));
    given(blobRepository.findByUserIdAndClientBlobId(USER_ID, "foodItem:abc"))
        .willReturn(Optional.of(existing));
    given(blobRepository.save(any(EncryptedBlob.class))).willAnswer(i -> i.getArgument(0));

    final List<EncryptedBlobDto> dtos = List.of(
        new EncryptedBlobDto("foodItem:abc", "newiv", "newct", null, false)
    );
    service.upsertBlobs(USER_ID, dtos);

    Assertions.assertThat(existing.getIv()).isEqualTo("newiv");
    Assertions.assertThat(existing.getCiphertext()).isEqualTo("newct");
  }

  @Test
  void getBlobsSinceReturnsDtos() {
    final AppUser user = makeUser();
    final EncryptedBlob blob = new EncryptedBlob();
    blob.setUser(user);
    blob.setClientBlobId("waterLog:xyz");
    blob.setIv("iv");
    blob.setCiphertext("ct");
    given(blobRepository.findByUserIdAndUpdatedAtAfterOrderByUpdatedAtAsc(
        any(UUID.class), any(Instant.class))).willReturn(List.of(blob));

    final List<EncryptedBlobDto> result = service.getBlobsSince(
        USER_ID, Instant.EPOCH, Integer.MAX_VALUE);

    Assertions.assertThat(result).hasSize(1);
    Assertions.assertThat(result.get(0).clientBlobId()).isEqualTo("waterLog:xyz");
  }

  @Test
  void getBlobsSinceAppliesLimit() {
    final AppUser user = makeUser();
    final EncryptedBlob b1 = new EncryptedBlob();
    b1.setUser(user);
    b1.setClientBlobId("foodItem:a");
    b1.setIv("iv1");
    b1.setCiphertext("ct1");
    final EncryptedBlob b2 = new EncryptedBlob();
    b2.setUser(user);
    b2.setClientBlobId("foodItem:b");
    b2.setIv("iv2");
    b2.setCiphertext("ct2");
    given(blobRepository.findByUserIdAndUpdatedAtAfterOrderByUpdatedAtAsc(
        any(UUID.class), any(Instant.class))).willReturn(List.of(b1, b2));

    final List<EncryptedBlobDto> result = service.getBlobsSince(USER_ID, Instant.EPOCH, 1);

    Assertions.assertThat(result).hasSize(1);
  }

  @Test
  void deleteAllBlobsCallsRepository() {
    service.deleteAllBlobs(USER_ID);
    then(blobRepository).should().deleteAllByUserId(USER_ID);
  }

  @Test
  void upsertBlobsThrowsWhenUserNotFound() {
    given(userRepository.findById(USER_ID)).willReturn(Optional.empty());
    final List<EncryptedBlobDto> dtos = List.of(
        new EncryptedBlobDto("foodItem:abc", "iv", "ct", null, false)
    );
    Assertions.assertThatThrownBy(() -> service.upsertBlobs(USER_ID, dtos))
        .isInstanceOf(NoSuchElementException.class);
  }
}
