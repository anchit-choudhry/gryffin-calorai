package com.gryffin.calorai.config;

import com.gryffin.calorai.filter.RateLimitFilter;
import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.Bucket4jLettuce;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

/** Configures Bucket4j rate limiting backed by Valkey (Redis-compatible) via Lettuce. */
@Configuration
public class RateLimitConfig {

  @Value("${spring.data.redis.host:localhost}")
  private String valkeyHost;

  @Value("${spring.data.redis.port:6379}")
  private int valkeyPort;

  @Value("${app.rate-limit.auth-token.capacity:10}")
  private long tokenCapacity;

  @Value("${app.rate-limit.auth-token.refill-seconds:60}")
  private long tokenRefillSeconds;

  @Value("${app.rate-limit.auth-refresh.capacity:20}")
  private long refreshCapacity;

  @Value("${app.rate-limit.auth-refresh.refill-seconds:60}")
  private long refreshRefillSeconds;

  /**
   * Creates a dedicated Lettuce Redis client for rate limiting.
   *
   * @return RedisClient connected to Valkey
   */
  @Bean(destroyMethod = "shutdown")
  public RedisClient rateLimitRedisClient() {
    return RedisClient.create(RedisURI.builder()
        .withHost(valkeyHost)
        .withPort(valkeyPort)
        .build());
  }

  /**
   * Opens a stateful Redis connection with String keys and byte-array values.
   *
   * @param rateLimitRedisClient the Lettuce client
   * @return the open connection
   */
  @Bean(destroyMethod = "close")
  public StatefulRedisConnection<String, byte[]> rateLimitRedisConnection(
      final RedisClient rateLimitRedisClient
  ) {
    return rateLimitRedisClient.connect(RedisCodec.of(StringCodec.UTF8, new ByteArrayCodec()));
  }

  /**
   * Creates a Bucket4j proxy manager backed by the Valkey connection.
   *
   * @param rateLimitRedisConnection the Lettuce connection
   * @return the proxy manager
   */
  @Bean
  public ProxyManager<String> rateLimitProxyManager(
      final StatefulRedisConnection<String, byte[]> rateLimitRedisConnection
  ) {
    return Bucket4jLettuce.casBasedBuilder(rateLimitRedisConnection)
        .expirationAfterWrite(
            ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(Duration.ofMinutes(2)))
        .build();
  }

  /**
   * Creates the rate limit filter with per-endpoint capacity and refill configuration.
   *
   * @param rateLimitProxyManager the Bucket4j proxy manager
   * @return the filter
   */
  @Bean
  public RateLimitFilter rateLimitFilter(final ProxyManager<String> rateLimitProxyManager) {
    return new RateLimitFilter(
        rateLimitProxyManager,
        tokenCapacity,
        tokenRefillSeconds,
        refreshCapacity,
        refreshRefillSeconds
    );
  }

  /**
   * Registers the rate limit filter at highest precedence so it runs before all other filters.
   *
   * @param rateLimitFilter the filter
   * @return the registration bean
   */
  @Bean
  public FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(
      final RateLimitFilter rateLimitFilter
  ) {
    final var registration = new FilterRegistrationBean<>(rateLimitFilter);
    registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
    return registration;
  }
}
