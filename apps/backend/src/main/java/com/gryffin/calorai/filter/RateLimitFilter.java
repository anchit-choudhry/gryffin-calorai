package com.gryffin.calorai.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

/** Servlet filter that enforces per-IP token-bucket rate limits on auth endpoints. */
public class RateLimitFilter extends OncePerRequestFilter {

  private static final String TOKEN_PATH = "/v1/auth/token";
  private static final String REFRESH_PATH = "/v1/auth/refresh";

  private final ProxyManager<String> proxyManager;
  private final long tokenCapacity;
  private final long refreshCapacity;
  private final BucketConfiguration tokenConfig;
  private final BucketConfiguration refreshConfig;

  public RateLimitFilter(
      final ProxyManager<String> proxyManager,
      final long tokenCapacity,
      final long tokenRefillSeconds,
      final long refreshCapacity,
      final long refreshRefillSeconds
  ) {
    this.proxyManager = proxyManager;
    this.tokenCapacity = tokenCapacity;
    this.refreshCapacity = refreshCapacity;
    this.tokenConfig = BucketConfiguration.builder()
        .addLimit(Bandwidth.builder()
            .capacity(tokenCapacity)
            .refillIntervally(tokenCapacity, Duration.ofSeconds(tokenRefillSeconds))
            .build())
        .build();
    this.refreshConfig = BucketConfiguration.builder()
        .addLimit(Bandwidth.builder()
            .capacity(refreshCapacity)
            .refillIntervally(refreshCapacity, Duration.ofSeconds(refreshRefillSeconds))
            .build())
        .build();
  }

  @Override
  protected void doFilterInternal(
      final HttpServletRequest request,
      final HttpServletResponse response,
      final FilterChain chain
  ) throws ServletException, IOException {
    final String contextPath = request.getContextPath();
    final String path = request.getRequestURI().substring(contextPath.length());
    if (!TOKEN_PATH.equals(path) && !REFRESH_PATH.equals(path)) {
      chain.doFilter(request, response);
      return;
    }

    final boolean isTokenPath = TOKEN_PATH.equals(path);
    final long capacity = isTokenPath ? tokenCapacity : refreshCapacity;
    final BucketConfiguration config = isTokenPath ? tokenConfig : refreshConfig;

    final String ip = resolveClientIp(request);
    final String key = "rate-limit:" + path + ":" + ip;

    final Bucket bucket = proxyManager.getProxy(key, () -> config);
    final ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

    response.setHeader("X-RateLimit-Limit", String.valueOf(capacity));
    response.setHeader(
        "X-RateLimit-Remaining", String.valueOf(Math.max(0, probe.getRemainingTokens())));

    if (probe.isConsumed()) {
      chain.doFilter(request, response);
    } else {
      final long retryAfterSeconds = (probe.getNanosToWaitForRefill() / 1_000_000_000L) + 1;
      response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
      response.setStatus(429);
      response.setContentType(MediaType.APPLICATION_JSON_VALUE);
      response.getWriter().write(
          "{\"error\":\"Too many requests\",\"retryAfter\":" + retryAfterSeconds + "}"
      );
    }
  }

  private String resolveClientIp(final HttpServletRequest request) {
    final String remoteAddr = request.getRemoteAddr();
    // Only trust X-Forwarded-For when the direct connection comes from a private/loopback
    // address (i.e. a reverse proxy on the same host or within the Docker network).
    // If the backend is directly internet-facing, remoteAddr will be a public IP and
    // X-Forwarded-For could be spoofed - fall back to remoteAddr in that case.
    if (isTrustedProxy(remoteAddr)) {
      final String forwarded = request.getHeader("X-Forwarded-For");
      if (forwarded != null && !forwarded.isBlank()) {
        return forwarded.split(",")[0].trim();
      }
    }
    return remoteAddr;
  }

  private boolean isTrustedProxy(final String addr) {
    return addr.startsWith("127.")
        || addr.startsWith("10.")
        || addr.startsWith("172.16.") || addr.startsWith("172.17.") || addr.startsWith("172.18.")
        || addr.startsWith("172.19.") || addr.startsWith("172.2") || addr.startsWith("172.30.")
        || addr.startsWith("172.31.")
        || addr.startsWith("192.168.")
        || addr.equals("0:0:0:0:0:0:0:1") || addr.equals("::1");
  }
}
