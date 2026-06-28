package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.PushSubscriptionDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.PushSubscription;
import com.gryffin.calorai.entity.UserReminder;
import com.gryffin.calorai.repository.PushSubscriptionRepository;
import com.gryffin.calorai.repository.UserReminderRepository;
import com.gryffin.calorai.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import java.math.BigInteger;
import java.net.URI;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyPairGenerator;
import java.security.SecureRandom;
import java.security.Security;
import java.security.interfaces.ECPrivateKey;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.jce.spec.ECPrivateKeySpec;
import org.bouncycastle.jce.spec.ECPublicKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

/**
 * Service for Web Push subscription management and VAPID-based reminder dispatch. VAPID JWT signing
 * (ES256) uses JJWT; message encryption (RFC 8291 / aes128gcm) uses Bouncy Castle + JCA. HTTP
 * delivery uses Spring RestClient. When VAPID keys are not configured, subscription management
 * still works but no push messages are sent.
 */
@Service
public class PushNotificationService {

  private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);
  private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");
  private static final int RECORD_SIZE = 4096;

  private static final byte[] INFO_WEBPUSH =
    "WebPush: info\0".getBytes(StandardCharsets.US_ASCII);
  private static final byte[] INFO_CEK =
    "Content-Encoding: aes128gcm\0".getBytes(StandardCharsets.US_ASCII);
  private static final byte[] INFO_NONCE =
    "Content-Encoding: nonce\0".getBytes(StandardCharsets.US_ASCII);

  private static final Map<String, String> REMINDER_BODY = Map.of(
    "water", "Time to log your water intake.",
    "meal", "Time to log your meal.",
    "steps", "Time to log your steps.",
    "weight", "Time to log your weight."
  );

  private final PushSubscriptionRepository pushRepository;
  private final UserReminderRepository reminderRepository;
  private final UserRepository userRepository;
  private final RestClient restClient;

  @Value("${app.vapid.public-key:}")
  private String vapidPublicKey;

  @Value("${app.vapid.private-key:}")
  private String vapidPrivateKey;

  @Value("${app.vapid.subject:mailto:admin@localhost}")
  private String vapidSubject;

  private ECPrivateKey vapidEcPrivateKey;

  /**
   * Constructor injection.
   *
   * @param pushRepository     push subscription repository
   * @param reminderRepository reminder repository (for scheduler)
   * @param userRepository     user repository
   */
  public PushNotificationService(
    final PushSubscriptionRepository pushRepository,
    final UserReminderRepository reminderRepository,
    final UserRepository userRepository) {
    this.pushRepository = pushRepository;
    this.reminderRepository = reminderRepository;
    this.userRepository = userRepository;
    this.restClient = RestClient.create();
  }

  private static byte[] hkdf(
    final byte[] salt,
    final byte[] ikm,
    final byte[] info,
    final int length) throws Exception {
    final Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(salt, "HmacSHA256"));
    final byte[] prk = mac.doFinal(ikm);
    mac.init(new SecretKeySpec(prk, "HmacSHA256"));
    mac.update(info);
    mac.update((byte) 0x01);
    final byte[] okm = mac.doFinal();
    final byte[] result = new byte[length];
    System.arraycopy(okm, 0, result, 0, length);
    return result;
  }

  private static String extractOrigin(final String endpoint) {
    try {
      final URI uri = URI.create(endpoint);
      final int port = uri.getPort();
      return uri.getScheme() + "://" + uri.getHost() + (port != -1 ? ":" + port : "");
    } catch (Exception e) {
      return endpoint;
    }
  }

  private static byte[] concat(final byte[]... arrays) {
    int len = 0;
    for (final byte[] a : arrays) {
      len += a.length;
    }
    final byte[] result = new byte[len];
    int pos = 0;
    for (final byte[] a : arrays) {
      System.arraycopy(a, 0, result, pos, a.length);
      pos += a.length;
    }
    return result;
  }

  /**
   * Returns the VAPID public key, or empty string when not configured.
   *
   * @return base64url-encoded VAPID public key
   */
  public String getVapidPublicKey() {
    return vapidPublicKey != null ? vapidPublicKey : "";
  }

  /**
   * Returns true when VAPID keys are configured and loaded.
   *
   * @return true if push sending is enabled
   */
  public boolean isEnabled() {
    return vapidEcPrivateKey != null;
  }

  /**
   * Registers Bouncy Castle and loads the VAPID EC private key. Skips silently when keys are absent
   * so the app starts normally in environments without push configured.
   */
  @PostConstruct
  void init() {
    Security.addProvider(new BouncyCastleProvider());
    if (vapidPublicKey == null || vapidPublicKey.isBlank()
      || vapidPrivateKey == null || vapidPrivateKey.isBlank()) {
      log.warn("VAPID keys not configured - push notifications disabled");
      return;
    }
    try {
      final byte[] rawD = Base64.getUrlDecoder().decode(vapidPrivateKey);
      final var spec = ECNamedCurveTable.getParameterSpec("prime256v1");
      final ECPrivateKeySpec keySpec =
        new ECPrivateKeySpec(new BigInteger(1, rawD), spec);
      vapidEcPrivateKey = (ECPrivateKey)
        KeyFactory.getInstance("EC", "BC").generatePrivate(keySpec);
      log.info("Web Push VAPID key loaded successfully");
    } catch (Exception e) {
      log.error("Failed to load VAPID private key: {}", e.getMessage());
    }
  }

  /**
   * Saves or updates a push subscription for the given user. Upserts by (userId, endpoint).
   *
   * @param userId the user ID
   * @param dto    the push subscription payload
   */
  @Transactional
  public void subscribe(final UUID userId, final PushSubscriptionDto dto) {
    final PushSubscription sub = pushRepository
      .findByUserIdAndEndpoint(userId, dto.endpoint())
      .orElseGet(() -> {
        final AppUser user = userRepository.findById(userId)
          .orElseThrow(() -> new NoSuchElementException("User not found"));
        final var newSub = new PushSubscription();
        newSub.setUser(user);
        newSub.setEndpoint(dto.endpoint());
        return newSub;
      });
    sub.setP256dh(dto.p256dh());
    sub.setAuth(dto.auth());
    sub.setTimezone(dto.timezone());
    pushRepository.save(sub);
  }

  /**
   * Removes a push subscription for the given user identified by endpoint URL.
   *
   * @param userId   the user ID
   * @param endpoint the push service endpoint URL
   */
  @Transactional
  public void unsubscribe(final UUID userId, final String endpoint) {
    pushRepository.deleteByUserIdAndEndpoint(userId, endpoint);
  }

  /**
   * Scheduled task (default: every minute) that finds all enabled reminders due at the current time
   * and sends a push notification to each matching subscriber. Silently skips when VAPID is not
   * configured.
   */
  @Scheduled(cron = "${app.push.reminder-scheduler-cron:0 * * * * *}")
  public void sendDueReminderNotifications() {
    if (!isEnabled()) {
      return;
    }

    final List<UserReminder> dueReminders =
      reminderRepository.findByEnabledTrueAndDeletedAtIsNull();
    if (dueReminders.isEmpty()) {
      return;
    }

    for (final UserReminder reminder : dueReminders) {
      final UUID userId = reminder.getUser().getId();
      final List<PushSubscription> subscriptions = pushRepository.findByUserId(userId);
      for (final PushSubscription sub : subscriptions) {
        if (isReminderDue(reminder, sub.getTimezone())) {
          sendPush(sub, reminder);
        }
      }
    }
  }

  private boolean isReminderDue(final UserReminder reminder, final String timezoneStr) {
    final ZoneId zone = parseZone(timezoneStr);
    final ZonedDateTime now = ZonedDateTime.now(zone);
    if (!reminder.getTime().equals(now.format(HH_MM))) {
      return false;
    }
    // Bitmask matches frontend: bit 0 = Monday (DayOfWeek.getValue() = 1)
    final int dayBit = now.getDayOfWeek().getValue() - 1;
    return (reminder.getDaysOfWeek() & (1 << dayBit)) != 0;
  }

  private ZoneId parseZone(final String timezoneStr) {
    if (timezoneStr == null || timezoneStr.isBlank()) {
      return ZoneId.systemDefault();
    }
    try {
      return ZoneId.of(timezoneStr);
    } catch (Exception e) {
      return ZoneId.systemDefault();
    }
  }

  private void sendPush(final PushSubscription sub, final UserReminder reminder) {
    try {
      if (!"https".equals(URI.create(sub.getEndpoint()).getScheme())) {
        log.warn("Skipping push - endpoint must use HTTPS");
        return;
      }
    } catch (IllegalArgumentException e) {
      log.warn("Skipping push - invalid endpoint URI: {}", e.getMessage());
      return;
    }
    final String body = REMINDER_BODY.getOrDefault(reminder.getType(), "You have a reminder.");
    final String payload = String.format(
      "{\"title\":\"Gryffin Calorai\",\"body\":\"%s\",\"tag\":\"%s\"}",
      body, reminder.getType() + "-reminder"
    );
    try {
      final byte[] receiverPub = Base64.getUrlDecoder().decode(sub.getP256dh());
      final byte[] authSecret = Base64.getUrlDecoder().decode(sub.getAuth());
      final byte[] encrypted = encryptPayload(
        receiverPub, authSecret, payload.getBytes(StandardCharsets.UTF_8));
      final String origin = extractOrigin(sub.getEndpoint());
      final String jwt = buildVapidJwt(origin);
      restClient.post()
        .uri(sub.getEndpoint())
        .header("Authorization", "vapid t=" + jwt + ",k=" + vapidPublicKey)
        .header("Content-Encoding", "aes128gcm")
        .header("TTL", "86400")
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .body(encrypted)
        .retrieve()
        .toBodilessEntity();
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      log.warn("Push send interrupted for {}", sub.getEndpoint());
    } catch (Exception e) {
      log.warn("Failed to send push to {}: {}", sub.getEndpoint(), e.getMessage());
    }
  }

  private String buildVapidJwt(final String endpointOrigin) {
    return Jwts.builder()
      .claim("aud", endpointOrigin)
      .subject(vapidSubject)
      .expiration(Date.from(Instant.now().plusSeconds(43200L)))
      .signWith(vapidEcPrivateKey)
      .compact();
  }

  /**
   * Encrypts a plaintext payload using RFC 8291 aes128gcm content encoding.
   *
   * <p>Generates an ephemeral P-256 key pair, performs ECDH with the receiver's public key,
   * derives a content encryption key and nonce via HKDF, and AES-128-GCM encrypts the plaintext.
   * Returns the complete record: salt + header + ciphertext.</p>
   *
   * @param receiverPubBytes uncompressed P-256 public key bytes (65 bytes)
   * @param authSecret       16-byte auth secret from the push subscription
   * @param plaintext        JSON payload bytes to encrypt
   * @return encrypted record with aes128gcm header
   * @throws Exception on any crypto failure
   */
  private byte[] encryptPayload(
    final byte[] receiverPubBytes,
    final byte[] authSecret,
    final byte[] plaintext) throws Exception {
    // Ephemeral P-256 sender key pair
    final var kpg = KeyPairGenerator.getInstance("EC", "BC");
    kpg.initialize(ECNamedCurveTable.getParameterSpec("prime256v1"), new SecureRandom());
    final var ephemeral = kpg.generateKeyPair();
    final byte[] senderPubBytes =
      ((org.bouncycastle.jce.interfaces.ECPublicKey) ephemeral.getPublic())
        .getQ().getEncoded(false);

    // ECDH shared secret with receiver's public key
    final var spec = ECNamedCurveTable.getParameterSpec("prime256v1");
    final ECPublicKeySpec receiverKeySpec = new ECPublicKeySpec(
      spec.getCurve().decodePoint(receiverPubBytes), spec);
    final var receiverPub =
      KeyFactory.getInstance("EC", "BC").generatePublic(receiverKeySpec);
    final var ka = KeyAgreement.getInstance("ECDH", "BC");
    ka.init(ephemeral.getPrivate());
    ka.doPhase(receiverPub, true);
    final byte[] ecdhSecret = ka.generateSecret();

    // Derive IKM via HKDF-Extract (RFC 8291 §3.3); salt = auth secret
    final byte[] ikmInfo = concat(INFO_WEBPUSH, receiverPubBytes, senderPubBytes);
    final byte[] ikm = hkdf(authSecret, ecdhSecret, ikmInfo, 32);

    // Random 16-byte salt; derive content encryption key (16 B) and nonce (12 B)
    final byte[] salt = new byte[16];
    new SecureRandom().nextBytes(salt);
    final byte[] cek = hkdf(salt, ikm, INFO_CEK, 16);
    final byte[] nonce = hkdf(salt, ikm, INFO_NONCE, 12);

    // AES-128-GCM encrypt; 0x02 byte = padding delimiter (RFC 8291 §4)
    final Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
    cipher.init(
      Cipher.ENCRYPT_MODE,
      new SecretKeySpec(cek, "AES"),
      new GCMParameterSpec(128, nonce));
    final byte[] ciphertext = cipher.doFinal(concat(plaintext, new byte[]{0x02}));

    // aes128gcm record header: salt(16) | rs(4 BE) | idlen(1) | senderPub(65)
    final ByteBuffer header = ByteBuffer.allocate(86).order(ByteOrder.BIG_ENDIAN);
    header.put(salt);
    header.putInt(RECORD_SIZE);
    header.put((byte) 65);
    header.put(senderPubBytes);
    return concat(header.array(), ciphertext);
  }
}
