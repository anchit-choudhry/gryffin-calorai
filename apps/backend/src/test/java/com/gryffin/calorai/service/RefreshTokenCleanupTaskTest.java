package com.gryffin.calorai.service;

import com.gryffin.calorai.repository.RefreshTokenRepository;
import java.time.Instant;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.BDDMockito;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RefreshTokenCleanupTaskTest {

  @Mock
  private RefreshTokenRepository refreshTokenRepository;

  @InjectMocks
  private RefreshTokenCleanupTask cleanupTask;

  @Test
  void deleteExpiredTokensDelegatesToRepository() {
    var before = Instant.now();
    cleanupTask.deleteExpiredTokens();
    var after = Instant.now();

    var captor = ArgumentCaptor.forClass(Instant.class);
    BDDMockito.then(refreshTokenRepository).should().deleteExpired(captor.capture());

    var captured = captor.getValue();
    Assertions.assertThat(captured).isAfterOrEqualTo(before).isBeforeOrEqualTo(after);
  }
}
