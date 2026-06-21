package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.BodyMeasurementDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.BodyMeasurement;
import com.gryffin.calorai.repository.BodyMeasurementRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.BDDMockito;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BodyMeasurementServiceTest {

  @Mock
  private BodyMeasurementRepository bodyMeasurementRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private AppUser user;

  @InjectMocks
  private BodyMeasurementService bodyMeasurementService;

  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    BDDMockito.given(user.getId()).willReturn(userId);
  }

  @Test
  void getAllReturnsMeasurementsExcludingDeleted() {
    final var bm = buildMeasurement(75.0, 18.5, LocalDate.now());
    BDDMockito.given(
        bodyMeasurementRepository.findByUserIdAndDeletedAtIsNullOrderByDateLoggedDesc(userId))
      .willReturn(List.of(bm));

    final var result = bodyMeasurementService.getAll(userId);

    Assertions.assertThat(result).hasSize(1);
    Assertions.assertThat(result.getFirst().weightKg()).isEqualTo(75.0);
  }

  @Test
  void getChangesSinceReturnsMeasurementsUpdatedAfterTimestamp() {
    final var since = Instant.now().minusSeconds(3600);
    final var bm = buildMeasurement(76.0, null, LocalDate.now().minusDays(1));
    BDDMockito.given(bodyMeasurementRepository.findByUserIdAndUpdatedAtAfter(userId, since))
      .willReturn(List.of(bm));

    final var result = bodyMeasurementService.getChangesSince(userId, since);

    Assertions.assertThat(result).hasSize(1);
    Assertions.assertThat(result.getFirst().weightKg()).isEqualTo(76.0);
  }

  @Test
  void createPersistsAndReturnsDto() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    final var saved = buildMeasurement(80.0, 20.0, LocalDate.now());
    BDDMockito.given(bodyMeasurementRepository.save(ArgumentMatchers.any())).willReturn(saved);

    final var dto = new BodyMeasurementDto(null, 80.0, 20.0, LocalDate.now(), null, null, null);
    final var result = bodyMeasurementService.create(userId, dto);

    Assertions.assertThat(result.weightKg()).isEqualTo(80.0);
    Assertions.assertThat(result.bodyFatPct()).isEqualTo(20.0);
  }

  @Test
  void createThrowsWhenUserNotFound() {
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.empty());

    final var dto = new BodyMeasurementDto(null, 70.0, null, LocalDate.now(), null, null, null);
    Assertions.assertThatThrownBy(() -> bodyMeasurementService.create(userId, dto))
      .isInstanceOf(NoSuchElementException.class);
  }

  @Test
  void upsertUpdatesExistingMeasurement() {
    final var measurementId = UUID.randomUUID();
    final var existing = buildMeasurement(74.0, 19.0, LocalDate.now());
    BDDMockito.given(userRepository.findById(userId)).willReturn(Optional.of(user));
    BDDMockito.given(bodyMeasurementRepository.findById(measurementId))
      .willReturn(Optional.of(existing));
    BDDMockito.given(bodyMeasurementRepository.save(ArgumentMatchers.any())).willReturn(existing);

    final var dto = new BodyMeasurementDto(
      measurementId.toString(), 75.0, 19.5, LocalDate.now(), null, null, null
    );
    bodyMeasurementService.upsert(userId, measurementId, dto);

    final var captor = ArgumentCaptor.forClass(BodyMeasurement.class);
    BDDMockito.then(bodyMeasurementRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getWeightKg()).isEqualTo(75.0);
  }

  @Test
  void deleteSetsDeletedAt() {
    final var measurementId = UUID.randomUUID();
    final var bm = buildMeasurement(72.0, null, LocalDate.now());
    BDDMockito.given(bodyMeasurementRepository.findById(measurementId))
      .willReturn(Optional.of(bm));

    bodyMeasurementService.delete(userId, measurementId);

    final var captor = ArgumentCaptor.forClass(BodyMeasurement.class);
    BDDMockito.then(bodyMeasurementRepository).should().save(captor.capture());
    Assertions.assertThat(captor.getValue().getDeletedAt()).isNotNull();
  }

  @Test
  void deleteThrowsWhenNotFound() {
    final var measurementId = UUID.randomUUID();
    BDDMockito.given(bodyMeasurementRepository.findById(measurementId))
      .willReturn(Optional.empty());

    Assertions.assertThatThrownBy(() -> bodyMeasurementService.delete(userId, measurementId))
      .isInstanceOf(NoSuchElementException.class);
  }

  private BodyMeasurement buildMeasurement(final Double weightKg, final Double bodyFatPct,
    final LocalDate date) {
    final var bm = new BodyMeasurement();
    bm.setId(UUID.randomUUID());
    bm.setUser(user);
    bm.setWeightKg(weightKg);
    bm.setBodyFatPct(bodyFatPct);
    bm.setDateLogged(date);
    return bm;
  }
}
