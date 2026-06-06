package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.AppUser;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<AppUser, UUID> {

  Optional<AppUser> findByEmail(String email);

  Optional<AppUser> findByProviderAndProviderSubject(String provider, String providerSubject);
}
