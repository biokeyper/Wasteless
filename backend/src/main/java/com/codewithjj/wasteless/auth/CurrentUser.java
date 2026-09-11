package com.codewithjj.wasteless.auth;

import org.springframework.security.oauth2.jwt.Jwt;

import java.util.UUID;

// The signed-in user's ID, taken from the verified access token rather than anything the client sends
public final class CurrentUser {

    private CurrentUser() {}

    public static UUID id(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
