package com.gryffin.calorai.service;

import com.gryffin.calorai.dto.BodyMeasurementDto;
import com.gryffin.calorai.entity.AppUser;
import com.gryffin.calorai.entity.BodyMeasurement;
import com.gryffin.calorai.repository.BodyMeasurementRepository;
import com.gryffin.calorai.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Service for body measurement CRUD and delta-sync operations. */
@Service
public class BodyMeasurementService {

  private final BodyMeasurementRepository bodyMeasurementRepository;
  private final UserRepository userRepository;

  public BodyMeasurementService(final BodyMeasurementRepository bodyMeasurementRepository,
      final UserRepository userRepository) {
    this.bodyMeasurementRepository = bodyMeasurementRepository;
    this.userRepository = userRepository;
  }

  public List<BodyMeasurementDto> getAll(final UUID userId) {
    return bodyMeasurementRepository.findByUserIdAndDeletedAtIsNullOrderByDateLoggedDesc(userId)
        .stream().map(this::toDto).toList();
  }

  public List<BodyMeasurementDto> getChangesSince(final UUID userId, final Instant since) {
    return bodyMeasurementRepository.findByUserIdAndUpdatedAtAfter(userId, since)
        .stream().map(this::toDto).toList();
  }

  @Transactional
  public BodyMeasurementDto create(final UUID userId, final BodyMeasurementDto dto) {
    final AppUser user = userRepository.findById(userId)
        .orElseThrow(() -> new NoSuchElementException("User not found"));
    final BodyMeasurement bm = new BodyMeasurement();
    bm.setUser(user);
    bm.setWeightKg(dto.weightKg());
    bm.setBodyFatPct(dto.bodyFatPct());
    bm.setDateLogged(dto.dateLogged());
    bm.setNotes(dto.notes());
    return toDto(bodyMeasurementRepository.save(bm));
  }

  @Transactional
  public BodyMeasurementDto upsert(final UUID userId, final UUID measurementId,
      final BodyMeasurementDto dto) {
    final AppUser user = userRepository.findById(userId)
        .orElseThrow(() -> new NoSuchElementException("User not found"));

    final BodyMeasurement bm = bodyMeasurementRepository.findById(measurementId)
        .filter(b -> b.getUser().getId().equals(userId))
        .orElseGet(() -> {
          final var newBm = new BodyMeasurement();
          newBm.setId(measurementId);
          newBm.setUser(user);
          return newBm;
        });

    bm.setWeightKg(dto.weightKg());
    bm.setBodyFatPct(dto.bodyFatPct());
    bm.setDateLogged(dto.dateLogged());
    bm.setNotes(dto.notes());
    bm.setDeletedAt(null);

    return toDto(bodyMeasurementRepository.save(bm));
  }

  /**
   * Deletes all body measurements for a user. Called during E2E activation migration.
   *
   * @param userId the user ID
   */
  @Transactional
  public void deleteAllByUserId(final UUID userId) {
    bodyMeasurementRepository.deleteAllByUserId(userId);
  }

  @Transactional
  public void delete(final UUID userId, final UUID measurementId) {
    final BodyMeasurement bm = bodyMeasurementRepository.findById(measurementId)
        .filter(b -> b.getUser().getId().equals(userId))
        .orElseThrow(() -> new NoSuchElementException("Body measurement not found"));
    bm.setDeletedAt(Instant.now());
    bodyMeasurementRepository.save(bm);
  }

  private BodyMeasurementDto toDto(final BodyMeasurement bm) {
    return new BodyMeasurementDto(
        bm.getId().toString(),
        bm.getWeightKg(),
        bm.getBodyFatPct(),
        bm.getDateLogged(),
        bm.getNotes(),
        bm.getUpdatedAt(),
        bm.getDeletedAt()
    );
  }
}
