package com.gryffin.calorai.filter;

import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.BucketProxy;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import jakarta.servlet.FilterChain;
import java.time.Duration;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.BDDMockito;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RateLimitFilterTest {

  @Mock
  private ProxyManager<String> proxyManager;

  @Mock
  private BucketProxy bucket;

  @Mock
  private FilterChain chain;

  private RateLimitFilter filter;

  @BeforeEach
  void setUp() {
    filter = new RateLimitFilter(proxyManager, 10, 60, 20, 60);
    BDDMockito.given(proxyManager.getProxy(ArgumentMatchers.anyString(), ArgumentMatchers.any()))
      .willReturn(bucket);
  }

  @Test
  void nonAuthPathPassesThroughWithoutRateLimitCheck() throws Exception {
    final var request = new MockHttpServletRequest("GET", "/v1/food-items");
    final var response = new MockHttpServletResponse();

    filter.doFilterInternal(request, response, chain);

    BDDMockito.then(chain).should().doFilter(request, response);
    BDDMockito.then(proxyManager).shouldHaveNoInteractions();
  }

  @Test
  void tokenPathUnderLimitAllowsRequest() throws Exception {
    BDDMockito.given(bucket.tryConsumeAndReturnRemaining(1))
      .willReturn(ConsumptionProbe.consumed(9, 0));

    final var request = new MockHttpServletRequest("POST", "/v1/auth/token");
    final var response = new MockHttpServletResponse();

    filter.doFilterInternal(request, response, chain);

    BDDMockito.then(chain).should().doFilter(request, response);
    Assertions.assertThat(response.getStatus()).isEqualTo(200);
    Assertions.assertThat(response.getHeader("X-RateLimit-Limit")).isEqualTo("10");
    Assertions.assertThat(response.getHeader("X-RateLimit-Remaining")).isEqualTo("9");
  }

  @Test
  void tokenPathOverLimitReturns429WithHeaders() throws Exception {
    final long nanosToWait = Duration.ofSeconds(30).toNanos();
    BDDMockito.given(bucket.tryConsumeAndReturnRemaining(1))
      .willReturn(ConsumptionProbe.rejected(0, nanosToWait, 0));

    final var request = new MockHttpServletRequest("POST", "/v1/auth/token");
    final var response = new MockHttpServletResponse();

    filter.doFilterInternal(request, response, chain);

    BDDMockito.then(chain).shouldHaveNoInteractions();
    Assertions.assertThat(response.getStatus()).isEqualTo(429);
    Assertions.assertThat(response.getHeader("X-RateLimit-Limit")).isEqualTo("10");
    Assertions.assertThat(response.getHeader("X-RateLimit-Remaining")).isEqualTo("0");
    Assertions.assertThat(response.getHeader("Retry-After")).isEqualTo("31");
  }

  @Test
  void refreshPathUnderLimitUsesRefreshCapacity() throws Exception {
    BDDMockito.given(bucket.tryConsumeAndReturnRemaining(1))
      .willReturn(ConsumptionProbe.consumed(19, 0));

    final var request = new MockHttpServletRequest("POST", "/v1/auth/refresh");
    final var response = new MockHttpServletResponse();

    filter.doFilterInternal(request, response, chain);

    BDDMockito.then(chain).should().doFilter(request, response);
    Assertions.assertThat(response.getHeader("X-RateLimit-Limit")).isEqualTo("20");
    Assertions.assertThat(response.getHeader("X-RateLimit-Remaining")).isEqualTo("19");
  }

  @Test
  void refreshPathOverLimitReturns429WithRetryAfter() throws Exception {
    final long nanosToWait = Duration.ofSeconds(45).toNanos();
    BDDMockito.given(bucket.tryConsumeAndReturnRemaining(1))
      .willReturn(ConsumptionProbe.rejected(0, nanosToWait, 0));

    final var request = new MockHttpServletRequest("POST", "/v1/auth/refresh");
    final var response = new MockHttpServletResponse();

    filter.doFilterInternal(request, response, chain);

    Assertions.assertThat(response.getStatus()).isEqualTo(429);
    Assertions.assertThat(response.getHeader("Retry-After")).isEqualTo("46");
  }

  @Test
  void xForwardedForFirstIpUsedAsClientKey() throws Exception {
    BDDMockito.given(bucket.tryConsumeAndReturnRemaining(1))
      .willReturn(ConsumptionProbe.consumed(9, 0));

    final var request = new MockHttpServletRequest("POST", "/v1/auth/token");
    request.addHeader("X-Forwarded-For", "203.0.113.1, 10.0.0.1");
    final var response = new MockHttpServletResponse();

    filter.doFilterInternal(request, response, chain);

    BDDMockito.then(proxyManager).should()
      .getProxy(ArgumentMatchers.contains("203.0.113.1"), ArgumentMatchers.any());
  }

  @Test
  void xForwardedForIgnoredWhenDirectConnectionFromPublicIp() throws Exception {
    BDDMockito.given(bucket.tryConsumeAndReturnRemaining(1))
      .willReturn(ConsumptionProbe.consumed(9, 0));

    final var request = new MockHttpServletRequest("POST", "/v1/auth/token");
    request.setRemoteAddr("203.0.113.99");
    request.addHeader("X-Forwarded-For", "1.2.3.4, 5.6.7.8");
    final var response = new MockHttpServletResponse();

    filter.doFilterInternal(request, response, chain);

    // Rate-limit key must use the real remoteAddr, not the spoofed X-Forwarded-For value
    BDDMockito.then(proxyManager).should()
      .getProxy(ArgumentMatchers.contains("203.0.113.99"), ArgumentMatchers.any());
    BDDMockito.then(proxyManager).should(BDDMockito.never())
      .getProxy(ArgumentMatchers.contains("1.2.3.4"), ArgumentMatchers.any());
  }

  @Test
  void tokenPathExhaustedTokensResponseBodyIsJson() throws Exception {
    final long nanosToWait = Duration.ofSeconds(10).toNanos();
    BDDMockito.given(bucket.tryConsumeAndReturnRemaining(1))
      .willReturn(ConsumptionProbe.rejected(0, nanosToWait, 0));

    final var request = new MockHttpServletRequest("POST", "/v1/auth/token");
    final var response = new MockHttpServletResponse();

    filter.doFilterInternal(request, response, chain);

    Assertions.assertThat(response.getContentType()).contains("application/json");
    Assertions.assertThat(response.getContentAsString()).contains("\"error\"");
    Assertions.assertThat(response.getContentAsString()).contains("retryAfter");
  }
}
