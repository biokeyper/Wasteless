package com.codewithjj.wasteless.auth.services;

import com.codewithjj.wasteless.auth.entities.RefreshToken;
import com.codewithjj.wasteless.auth.repositories.RefreshTokenRepository;
import com.codewithjj.wasteless.exceptions.ApiException;
import com.codewithjj.wasteless.users.entities.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class TokenService {

    public static final String ISSUER = "wasteless";
    private static final SecureRandom RANDOM = new SecureRandom();

    public record IssuedTokens(String accessToken, String refreshToken, long expiresIn, User user) {}

    private final JwtEncoder jwtEncoder;
    private final RefreshTokenRepository refreshTokens;
    private final Duration accessTtl;
    private final Duration refreshTtl;

    public TokenService(JwtEncoder jwtEncoder, RefreshTokenRepository refreshTokens,
                        @Value("${app.auth.access-token-minutes}") long accessMinutes,
                        @Value("${app.auth.refresh-token-days}") long refreshDays) {
        this.jwtEncoder = jwtEncoder;
        this.refreshTokens = refreshTokens;
        this.accessTtl = Duration.ofMinutes(accessMinutes);
        this.refreshTtl = Duration.ofDays(refreshDays);
    }

    @Transactional
    public IssuedTokens issue(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .subject(user.getId().toString())
                .issuedAt(now)
                .expiresAt(now.plus(accessTtl))
                .claim("email", user.getEmail())
                .build();
        String accessToken = jwtEncoder
                .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();

        String refreshToken = randomToken();
        RefreshToken row = new RefreshToken();
        row.setUser(user);
        row.setTokenHash(sha256(refreshToken));
        row.setExpiresAt(now.plus(refreshTtl));
        refreshTokens.save(row);

        return new IssuedTokens(accessToken, refreshToken, accessTtl.toSeconds(), user);
    }

    // Swaps a refresh token for a new pair. A token that was already used means it leaked,
    // so every session of that user is revoked; that revocation must survive the error.
    @Transactional(noRollbackFor = ApiException.class)
    public IssuedTokens rotate(String refreshToken) {
        Instant now = Instant.now();
        RefreshToken row = refreshTokens.findByTokenHash(sha256(refreshToken))
                .orElseThrow(TokenService::invalidRefreshToken);
        if (row.getRevokedAt() != null) {
            refreshTokens.revokeAllForUser(row.getUser().getId(), now);
            throw invalidRefreshToken();
        }
        if (!row.getExpiresAt().isAfter(now)) {
            throw invalidRefreshToken();
        }
        row.setRevokedAt(now);
        return issue(row.getUser());
    }

    @Transactional
    public void revoke(String refreshToken) {
        refreshTokens.findByTokenHash(sha256(refreshToken)).ifPresent(row -> {
            if (row.getRevokedAt() == null) {
                row.setRevokedAt(Instant.now());
            }
        });
    }

    static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String randomToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static ApiException invalidRefreshToken() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN",
                "Your session has expired. Please sign in again.");
    }
}
