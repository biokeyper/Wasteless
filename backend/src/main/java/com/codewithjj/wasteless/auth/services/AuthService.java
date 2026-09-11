package com.codewithjj.wasteless.auth.services;

import com.codewithjj.wasteless.auth.dtos.AuthDtos.*;
import com.codewithjj.wasteless.auth.entities.EmailVerificationCode;
import com.codewithjj.wasteless.auth.repositories.EmailVerificationCodeRepository;
import com.codewithjj.wasteless.exceptions.ApiException;
import com.codewithjj.wasteless.users.entities.User;
import com.codewithjj.wasteless.users.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final Duration CODE_TTL = Duration.ofMinutes(10);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    private static final int MAX_CODE_ATTEMPTS = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository users;
    private final EmailVerificationCodeRepository codes;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokens;
    private final VerificationMailer mailer;
    private final GoogleTokenVerifier google;
    // Checked against when the email is unknown, so login takes the same time either way
    private final String dummyPasswordHash;

    public AuthService(UserRepository users, EmailVerificationCodeRepository codes, PasswordEncoder passwordEncoder,
                       TokenService tokens, VerificationMailer mailer, GoogleTokenVerifier google) {
        this.users = users;
        this.codes = codes;
        this.passwordEncoder = passwordEncoder;
        this.tokens = tokens;
        this.mailer = mailer;
        this.google = google;
        this.dummyPasswordHash = passwordEncoder.encode("not-a-real-password");
    }

    // A failed email rolls the whole registration back, so the user can simply try again
    @Transactional
    public RegisterResponse register(RegisterRequest req) {
        String email = normalize(req.email());
        User user = users.findByEmail(email).orElse(null);
        if (user != null && user.isEmailVerified()) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_TAKEN",
                    "An account with this email already exists. Sign in instead.");
        }
        if (user == null) {
            user = new User();
            user.setEmail(email);
        }
        // Registering again before verifying replaces the earlier details
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setDisplayName(req.displayName().trim());
        user.setUsername(blankToNull(req.username()));
        user = users.save(user);
        sendNewCode(user);
        return new RegisterResponse(email, true);
    }

    // Always succeeds silently, so it can't be used to discover which emails have accounts
    @Transactional
    public void resendCode(ResendCodeRequest req) {
        users.findByEmail(normalize(req.email()))
                .filter(user -> !user.isEmailVerified())
                .ifPresent(this::sendNewCode);
    }

    // Failed attempts must be counted even though the request errors
    @Transactional(noRollbackFor = ApiException.class)
    public AuthResponse verifyEmail(VerifyEmailRequest req) {
        User user = users.findByEmail(normalize(req.email()))
                .orElseThrow(AuthService::invalidCode);
        if (user.isEmailVerified()) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_VERIFIED",
                    "This email is already verified. Sign in instead.");
        }
        Instant now = Instant.now();
        EmailVerificationCode code = codes.findFirstByUserIdAndConsumedAtIsNullOrderByCreatedAtDesc(user.getId())
                .orElseThrow(AuthService::codeExpired);
        if (!code.getExpiresAt().isAfter(now) || code.getAttempts() >= MAX_CODE_ATTEMPTS) {
            throw codeExpired();
        }
        byte[] expected = code.getCodeHash().getBytes(StandardCharsets.UTF_8);
        byte[] actual = hashCode(user.getId(), req.code()).getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(expected, actual)) {
            code.setAttempts(code.getAttempts() + 1);
            throw invalidCode();
        }
        code.setConsumedAt(now);
        user.setEmailVerifiedAt(LocalDateTime.now());
        return signIn(user);
    }

    // An unverified login still mails a fresh code, and that must survive the 403
    @Transactional(noRollbackFor = ApiException.class)
    public AuthResponse login(LoginRequest req) {
        Optional<User> found = users.findByEmail(normalize(req.email()));
        String hash = found.map(User::getPasswordHash).orElse(null);
        boolean matches = passwordEncoder.matches(req.password(), hash != null ? hash : dummyPasswordHash);
        if (found.isEmpty() || hash == null || !matches) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Incorrect email or password.");
        }
        User user = found.get();
        if (!user.isEmailVerified()) {
            sendNewCode(user);
            throw new ApiException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED",
                    "Verify your email to continue. We've sent you a new code.");
        }
        return signIn(user);
    }

    @Transactional
    public AuthResponse signInWithGoogle(GoogleSignInRequest req) {
        GoogleTokenVerifier.GoogleAccount account = google.verify(req.idToken());
        if (!account.emailVerified() || account.email() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "GOOGLE_EMAIL_UNVERIFIED",
                    "Your Google account's email isn't verified.");
        }
        String email = normalize(account.email());
        User user = users.findByGoogleSubject(account.subject())
                .or(() -> users.findByEmail(email))
                .orElseGet(() -> {
                    User created = new User();
                    created.setEmail(email);
                    return created;
                });
        if (user.getGoogleSubject() == null) {
            // Linking to an account nobody ever verified: drop its password, since whoever set it
            // hadn't proven they own this email
            if (user.getId() != null && !user.isEmailVerified()) {
                user.setPasswordHash(null);
            }
            user.setGoogleSubject(account.subject());
        }
        if (!user.isEmailVerified()) {
            user.setEmailVerifiedAt(LocalDateTime.now());
        }
        if (user.getDisplayName() == null) {
            user.setDisplayName(account.name());
        }
        if (user.getAvatarUrl() == null) {
            user.setAvatarUrl(account.picture());
        }
        return signIn(users.save(user));
    }

    @Transactional(noRollbackFor = ApiException.class)
    public AuthResponse refresh(RefreshRequest req) {
        TokenService.IssuedTokens issued = tokens.rotate(req.refreshToken());
        return new AuthResponse(issued.accessToken(), issued.refreshToken(), issued.expiresIn(),
                UserResponse.from(issued.user()));
    }

    public void logout(RefreshRequest req) {
        tokens.revoke(req.refreshToken());
    }

    @Transactional(readOnly = true)
    public UserResponse me(UUID userId) {
        return users.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Sign in to continue."));
    }

    private AuthResponse signIn(User user) {
        user.setLastSignInAt(LocalDateTime.now());
        TokenService.IssuedTokens issued = tokens.issue(user);
        return new AuthResponse(issued.accessToken(), issued.refreshToken(), issued.expiresIn(), UserResponse.from(user));
    }

    // Replaces any outstanding code. Within the cooldown the existing code stays valid and nothing is sent.
    private void sendNewCode(User user) {
        Instant now = Instant.now();
        boolean recentlySent = codes.findFirstByUserIdAndConsumedAtIsNullOrderByCreatedAtDesc(user.getId())
                .map(c -> c.getCreatedAt().plus(RESEND_COOLDOWN).isAfter(now))
                .orElse(false);
        if (recentlySent) {
            return;
        }
        codes.consumeAllForUser(user.getId(), now);
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        EmailVerificationCode row = new EmailVerificationCode();
        row.setUser(user);
        row.setCodeHash(hashCode(user.getId(), code));
        row.setExpiresAt(now.plus(CODE_TTL));
        codes.save(row);
        mailer.sendCode(user.getEmail(), code, CODE_TTL.toMinutes());
    }

    private static String hashCode(UUID userId, String code) {
        return TokenService.sha256(userId + ":" + code);
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static ApiException invalidCode() {
        return new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CODE", "That code isn't right. Check it and try again.");
    }

    private static ApiException codeExpired() {
        return new ApiException(HttpStatus.BAD_REQUEST, "CODE_EXPIRED", "This code has expired. Request a new one.");
    }
}
