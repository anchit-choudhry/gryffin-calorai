package com.gryffin.calorai.service;

import com.gryffin.calorai.repository.RefreshTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RefreshTokenCleanupTaskTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private RefreshTokenCleanupTask cleanupTask;

    @Test
    void deleteExpiredTokens_delegatesToRepository() {
        var before = Instant.now();
        cleanupTask.deleteExpiredTokens();
        var after = Instant.now();

        var captor = ArgumentCaptor.forClass(Instant.class);
        verify(refreshTokenRepository).deleteExpired(captor.capture());

        var captured = captor.getValue();
        assertThat(captured).isAfterOrEqualTo(before).isBeforeOrEqualTo(after);
    }
}
