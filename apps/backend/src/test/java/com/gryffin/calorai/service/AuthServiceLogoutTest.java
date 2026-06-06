package com.gryffin.calorai.service;

import com.gryffin.calorai.repository.RefreshTokenRepository;
import com.gryffin.calorai.repository.UserRepository;
import com.gryffin.calorai.security.JwtService;
import com.gryffin.calorai.security.OidcTokenVerifier;
import io.jsonwebtoken.JwtException;
import java.util.Map;
import java.util.UUID;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.BDDMockito;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
  void logoutValidRefreshTokenDeletesJti() {
    var jti = UUID.randomUUID();
    BDDMockito.given(jwtService.isRefreshToken("valid-refresh")).willReturn(true);
    BDDMockito.given(jwtService.extractJti("valid-refresh")).willReturn(jti);

    authService.logout("valid-refresh");

    BDDMockito.then(refreshTokenRepository).should().deleteByJti(jti);
  }

  @Test
  void logoutMalformedTokenNoExceptionAndNoDelete() {
    BDDMockito.given(jwtService.isRefreshToken("bad-token"))
        .willThrow(new JwtException("malformed"));

    Assertions.assertThatNoException().isThrownBy(() -> authService.logout("bad-token"));
    BDDMockito.then(refreshTokenRepository).shouldHaveNoInteractions();
  }

  @Test
  void logoutAccessTokenInsteadOfRefreshNoDelete() {
    BDDMockito.given(jwtService.isRefreshToken("access-token")).willReturn(false);

    authService.logout("access-token");

    BDDMockito.then(refreshTokenRepository).shouldHaveNoInteractions();
  }

  @Test
  void logoutIdempotentSecondCallNoException() {
    var jti = UUID.randomUUID();
    BDDMockito.given(jwtService.isRefreshToken("used-refresh")).willReturn(true);
    BDDMockito.given(jwtService.extractJti("used-refresh")).willReturn(jti);
    BDDMockito.given(refreshTokenRepository.deleteByJti(jti)).willReturn(0);

    Assertions.assertThatNoException().isThrownBy(() -> authService.logout("used-refresh"));
    BDDMockito.then(refreshTokenRepository).should().deleteByJti(jti);
  }
}
