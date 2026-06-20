package com.gryffin.calorai.repository;

import com.gryffin.calorai.entity.UserE2EConfig;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Repository for user E2E encryption configuration (PBKDF2 salt). */
public interface UserE2EConfigRepository extends JpaRepository<UserE2EConfig, UUID> {

}
