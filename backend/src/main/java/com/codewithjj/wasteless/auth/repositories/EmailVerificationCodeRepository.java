package com.codewithjj.wasteless.auth.repositories;

import com.codewithjj.wasteless.auth.entities.EmailVerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, UUID> {
    Optional<EmailVerificationCode> findFirstByUserIdAndConsumedAtIsNullOrderByCreatedAtDesc(UUID userId);

    @Modifying
    @Query("update EmailVerificationCode c set c.consumedAt = :now where c.user.id = :userId and c.consumedAt is null")
    int consumeAllForUser(@Param("userId") UUID userId, @Param("now") Instant now);
}
