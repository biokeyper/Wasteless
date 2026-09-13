package com.codewithjj.wasteless.auth.controllers;

import com.codewithjj.wasteless.auth.CurrentUser;
import com.codewithjj.wasteless.auth.dtos.AuthDtos.*;
import com.codewithjj.wasteless.auth.services.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("auth")
@Tag(name = "Auth", description = "Sign-up, sign-in and sessions")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("register")
    @Operation(summary = "Create an account", description = "Emails a 6-digit verification code")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(authService.register(req));
    }

    @PostMapping("verify-email")
    @Operation(summary = "Verify the emailed code", description = "Signs the user in on success")
    public AuthResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest req) {
        return authService.verifyEmail(req);
    }

    @PostMapping("resend-code")
    @Operation(summary = "Send a new verification code")
    public ResponseEntity<Void> resendCode(@Valid @RequestBody ResendCodeRequest req) {
        authService.resendCode(req);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("login")
    @Operation(summary = "Sign in with email and password")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("google")
    @Operation(summary = "Sign in with a Google ID token")
    public AuthResponse google(@Valid @RequestBody GoogleSignInRequest req) {
        return authService.signInWithGoogle(req);
    }

    @PostMapping("refresh")
    @Operation(summary = "Exchange a refresh token for new tokens")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest req) {
        return authService.refresh(req);
    }

    @PostMapping("logout")
    @Operation(summary = "Revoke a refresh token")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest req) {
        authService.logout(req);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("me")
    @Operation(summary = "The signed-in user")
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return authService.me(CurrentUser.id(jwt));
    }

    @PostMapping("change-password")
    @Operation(summary = "Change the password",
            description = "Signs every other device out and returns a fresh session for this one")
    public AuthResponse changePassword(@AuthenticationPrincipal Jwt jwt,
                                       @Valid @RequestBody ChangePasswordRequest req) {
        return authService.changePassword(CurrentUser.id(jwt), req);
    }
}
