package com.gryffin.calorai.service;

import com.gryffin.calorai.repository.RefreshTokenRepository;
import com.gryffin.calorai.repository.UserRepository;
import com.gryffin.calorai.security.JwtService;
import com.gryffin.calorai.security.OidcTokenVerifier;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceLogoutTest {

    @Mock
    private Map<String, OidcTokenVerifier> verifiers;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    void logout_validRefreshToken_deletesJti() {
        var jti = UUID.randomUUID();
        when(jwtService.isRefreshToken("valid-refresh")).thenReturn(true);
        when(jwtService.extractJti("valid-refresh")).thenReturn(jti);

        authService.logout("valid-refresh");

        verify(refreshTokenRepository).deleteByJti(jti);
    }

    @Test
    void logout_malformedToken_noExceptionAndNoDelete() {
        when(jwtService.isRefreshToken("bad-token")).thenThrow(new JwtException("malformed"));

        assertThatNoException().isThrownBy(() -> authService.logout("bad-token"));
        verifyNoInteractions(refreshTokenRepository);
    }

    @Test
    void logout_accessTokenInsteadOfRefresh_noDelete() {
        when(jwtService.isRefreshToken("access-token")).thenReturn(false);

        authService.logout("access-token");

        verifyNoInteractions(refreshTokenRepository);
    }

    @Test
    void logout_idempotent_secondCallNoException() {
        var jti = UUID.randomUUID();
        when(jwtService.isRefreshToken("used-refresh")).thenReturn(true);
        when(jwtService.extractJti("used-refresh")).thenReturn(jti);
        when(refreshTokenRepository.deleteByJti(jti)).thenReturn(0);

        assertThatNoException().isThrownBy(() -> authService.logout("used-refresh"));
        verify(refreshTokenRepository).deleteByJti(jti);
    }
}
