package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.AuthRequest;
import com.gryffin.calorai.dto.AuthResponse;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.RefreshToken;
import com.gryffin.calorai.repository.RefreshTokenRepository;
import com.gryffin.calorai.repository.UserRepository;
import com.gryffin.calorai.security.JwtService;
import com.gryffin.calorai.security.OidcClaims;
import com.gryffin.calorai.security.OidcTokenVerifier;
import io.jsonwebtoken.JwtException;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for OAuth2 authentication, JWT issuance, refresh, and logout.
 */
@Service
public class AuthService {

  private static final Set<String> ALLOWED_PROVIDERS = Set.of("google", "apple");

  private final Map<String, OidcTokenVerifier> verifiers;
  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final JwtService jwtService;

  public AuthService(
    Map<String, OidcTokenVerifier> verifiers,
    UserRepository userRepository,
    RefreshTokenRepository refreshTokenRepository,
    JwtService jwtService
  ) {
    this.verifiers = verifiers;
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.jwtService = jwtService;
  }

  @Transactional
  public AuthResponse authenticate(AuthRequest request) {
    if (!ALLOWED_PROVIDERS.contains(request.provider())) {
      throw new IllegalArgumentException("Unsupported provider");
    }
    var verifierKey = request.provider() + "OidcVerifier";
    var verifier = verifiers.get(verifierKey);
    if (verifier == null) {
      throw new IllegalArgumentException("Unsupported provider");
    }

    OidcClaims claims = verifier.verify(request.idToken());
    AppUser user = userRepository
      .findByProviderAndProviderSubject(claims.provider(), claims.sub())
      .orElseGet(() -> createUser(claims));

    String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
    String refreshToken = jwtService.generateRefreshToken(user.getId());
    storeRefreshToken(refreshToken, user);

    return AuthResponse.of(accessToken, refreshToken, jwtService.getAccessExpirationSeconds());
  }

  @Transactional
  public AuthResponse refresh(String refreshTokenStr) {
    if (!jwtService.isRefreshToken(refreshTokenStr)) {
      throw new SecurityException("Authentication failed");
    }

    var jti = jwtService.extractJti(refreshTokenStr);
    int deleted = refreshTokenRepository.deleteByJti(jti);
    if (deleted == 0) {
      throw new SecurityException("Authentication failed");
    }

    var userId = jwtService.extractUserId(refreshTokenStr);
    var user = userRepository.findById(userId)
      .orElseThrow(() -> new SecurityException("Authentication failed"));

    String newAccess = jwtService.generateAccessToken(user.getId(), user.getEmail());
    String newRefresh = jwtService.generateRefreshToken(user.getId());
    storeRefreshToken(newRefresh, user);

    return AuthResponse.of(newAccess, newRefresh, jwtService.getAccessExpirationSeconds());
  }

  @Transactional
  public void logout(String refreshTokenStr) {
    try {
      if (jwtService.isRefreshToken(refreshTokenStr)) {
        refreshTokenRepository.deleteByJti(jwtService.extractJti(refreshTokenStr));
      }
    } catch (JwtException ignored) {
      // malformed or expired token - nothing to revoke, treat as success
    }
  }

  private void storeRefreshToken(String rawToken, AppUser user) {
    var token = new RefreshToken();
    token.setJti(jwtService.extractJti(rawToken));
    token.setUser(user);
    token.setExpiresAt(jwtService.extractExpiration(rawToken));
    refreshTokenRepository.save(token);
  }

  private AppUser createUser(OidcClaims claims) {
    var user = new AppUser();
    user.setProvider(claims.provider());
    user.setProviderSubject(claims.sub());
    user.setEmail(claims.email());
    user.setDisplayName(claims.name() != null ? claims.name() : claims.email());
    return userRepository.save(user);
  }
}
