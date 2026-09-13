package com.codewithjj.wasteless.auth.dtos;

import com.codewithjj.wasteless.users.entities.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

// Request and response bodies for the /auth endpoints
public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Email String email,
            // bcrypt only uses the first 72 bytes of a password
            @NotBlank @Size(min = 6, max = 72) String password,
            @NotBlank @Size(max = 100) String displayName,
            @Size(max = 50) String username) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    public record VerifyEmailRequest(
            @NotBlank @Email String email,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "must be 6 digits") String code) {}

    public record ResendCodeRequest(@NotBlank @Email String email) {}

    public record GoogleSignInRequest(@NotBlank String idToken) {}

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            // bcrypt only uses the first 72 bytes of a password
            @NotBlank @Size(min = 6, max = 72) String newPassword) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record RegisterResponse(String email, boolean verificationRequired) {}

    public record UserResponse(
            UUID id,
            String email,
            String displayName,
            String username,
            String avatarUrl,
            boolean emailVerified,
            String provider,
            LocalDateTime createdAt,
            LocalDateTime lastSignInAt) {

        public static UserResponse from(User user) {
            String provider = user.getPasswordHash() == null && user.getGoogleSubject() != null ? "google" : "email";
            return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getUsername(),
                    user.getAvatarUrl(), user.isEmailVerified(), provider, user.getCreatedAt(), user.getLastSignInAt());
        }
    }

    public record AuthResponse(String accessToken, String refreshToken, long expiresIn, UserResponse user) {}
}
