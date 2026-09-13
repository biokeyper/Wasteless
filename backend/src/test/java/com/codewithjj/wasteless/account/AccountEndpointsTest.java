package com.codewithjj.wasteless.account;

import com.codewithjj.wasteless.auth.repositories.EmailVerificationCodeRepository;
import com.codewithjj.wasteless.auth.repositories.RefreshTokenRepository;
import com.codewithjj.wasteless.auth.services.TokenService;
import com.codewithjj.wasteless.auth.services.VerificationMailer;
import com.codewithjj.wasteless.items.entities.Item;
import com.codewithjj.wasteless.items.entities.ItemImage;
import com.codewithjj.wasteless.items.entities.ItemRequest;
import com.codewithjj.wasteless.items.enums.ItemCategory;
import com.codewithjj.wasteless.items.models.LocationData;
import com.codewithjj.wasteless.items.repositories.ItemImageRepository;
import com.codewithjj.wasteless.items.repositories.ItemRepository;
import com.codewithjj.wasteless.items.repositories.ItemRequestRepo;
import com.codewithjj.wasteless.items.services.ImageStorageService;
import com.codewithjj.wasteless.users.entities.User;
import com.codewithjj.wasteless.users.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;

// Covers the settings screen's "Change password", "Export data" and "Delete account" actions
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AccountEndpointsTest {

    private static final ParameterizedTypeReference<Map<String, Object>> JSON =
            new ParameterizedTypeReference<>() {};

    @Autowired private TestRestTemplate rest;
    @Autowired private UserRepository users;
    @Autowired private ItemRepository items;
    @Autowired private ItemImageRepository itemImages;
    @Autowired private ItemRequestRepo itemRequests;
    @Autowired private RefreshTokenRepository refreshTokens;
    @Autowired private EmailVerificationCodeRepository codes;
    @Autowired private TokenService tokens;

    // Codes are read off the mailer instead of an inbox, and no image ever reaches R2
    @MockitoBean private VerificationMailer mailer;
    @MockitoBean private ImageStorageService imageStorage;

    @BeforeEach
    void resetMocks() {
        reset(mailer, imageStorage);
    }

    @Test
    void exportReturnsTheAccountAndEverythingItOwns() {
        Session session = signUp("export@example.com", "first-password");
        UUID userId = UUID.fromString(users.findByEmail("export@example.com").orElseThrow().getId().toString());
        Item item = seedItem(userId, "A kettle");

        ResponseEntity<Map<String, Object>> response = rest.exchange(
                "/account/export", HttpMethod.GET, new HttpEntity<>(bearer(session.accessToken)), JSON);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body).containsKey("exportedAt");
        assertThat(asMap(body.get("account"))).containsEntry("email", "export@example.com");

        List<?> exported = (List<?>) body.get("items");
        assertThat(exported).hasSize(1);
        assertThat(asMap(exported.get(0))).containsEntry("title", "A kettle");
        assertThat((List<?>) asMap(exported.get(0)).get("images")).hasSize(1);
        assertThat(item.getId()).isNotNull();
    }

    @Test
    void exportAndDeleteRequireAuthentication() {
        assertThat(rest.getForEntity("/account/export", String.class).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(rest.exchange("/account", HttpMethod.DELETE, HttpEntity.EMPTY, String.class).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(rest.postForEntity("/auth/change-password",
                Map.of("currentPassword", "a-password", "newPassword", "another-password"), String.class)
                .getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void changePasswordRejectsAWrongCurrentPassword() {
        Session session = signUp("wrong-current@example.com", "first-password");

        ResponseEntity<Map<String, Object>> response = changePassword(
                session.accessToken, "not-the-password", "second-password");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).containsEntry("code", "INVALID_CREDENTIALS");
        // The old password still works
        assertThat(login("wrong-current@example.com", "first-password").getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void changePasswordRejectsReusingTheCurrentPassword() {
        Session session = signUp("same-again@example.com", "first-password");

        ResponseEntity<Map<String, Object>> response = changePassword(
                session.accessToken, "first-password", "first-password");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("code", "PASSWORD_UNCHANGED");
    }

    @Test
    void changePasswordSwapsTheSessionAndSignsOtherDevicesOut() {
        Session first = signUp("rotate@example.com", "first-password");
        // A second device on the same account
        Session second = asSession(login("rotate@example.com", "first-password").getBody());

        ResponseEntity<Map<String, Object>> response = changePassword(
                first.accessToken, "first-password", "second-password");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Session rotated = asSession(response.getBody());
        assertThat(rotated.refreshToken).isNotEqualTo(first.refreshToken);

        // The new session works, the other device's refresh token doesn't
        assertThat(rest.exchange("/auth/me", HttpMethod.GET,
                new HttpEntity<>(bearer(rotated.accessToken)), String.class).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(refreshWith(second.refreshToken).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        assertThat(login("rotate@example.com", "second-password").getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(login("rotate@example.com", "first-password").getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void changePasswordIsRefusedForAccountsThatSignInWithGoogle() {
        User user = new User();
        user.setEmail("google-only@example.com");
        user.setGoogleSubject("google-subject-1");
        user.setEmailVerifiedAt(LocalDateTime.now());
        user = users.save(user);
        String accessToken = tokens.issue(user).accessToken();

        ResponseEntity<Map<String, Object>> response = changePassword(
                accessToken, "anything-at-all", "a-new-password");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("code", "NO_PASSWORD_SET");
    }

    @Test
    void deleteRemovesTheAccountAndEverythingAttachedToIt() {
        Session session = signUp("delete-me@example.com", "first-password");
        UUID userId = users.findByEmail("delete-me@example.com").orElseThrow().getId();
        Item owned = seedItem(userId, "A bookshelf");

        // Someone else's request on the leaving user's item
        User other = new User();
        other.setEmail("neighbour@example.com");
        other.setEmailVerifiedAt(LocalDateTime.now());
        other = users.save(other);
        seedRequest(other.getId(), owned);

        // And a request the leaving user made on someone else's item
        Item theirs = seedItem(other.getId(), "A bicycle");
        seedRequest(userId, theirs);

        ResponseEntity<String> response = rest.exchange(
                "/account", HttpMethod.DELETE, new HttpEntity<>(bearer(session.accessToken)), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(users.findById(userId)).isEmpty();
        assertThat(items.findByUserId(userId)).isEmpty();
        assertThat(itemImages.findByItemId(owned.getId())).isEmpty();
        assertThat(itemRequests.findByItemId(owned.getId())).isEmpty();
        assertThat(itemRequests.findByUserId(userId)).isEmpty();
        assertThat(refreshTokens.findByTokenHash(sha256(session.refreshToken))).isEmpty();
        assertThat(codes.findFirstByUserIdAndConsumedAtIsNullOrderByCreatedAtDesc(userId)).isEmpty();

        // The other user is untouched
        assertThat(users.findById(other.getId())).isPresent();
        assertThat(items.findByUserId(other.getId())).hasSize(1);

        // The stored photo was cleaned up too
        verify(imageStorage).deleteImage(anyString());

        // And the session it was signed in with is gone
        assertThat(rest.exchange("/account/export", HttpMethod.GET,
                new HttpEntity<>(bearer(session.accessToken)), String.class).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // --- helpers ---

    private record Session(String accessToken, String refreshToken) {}

    private Session signUp(String email, String password) {
        ResponseEntity<String> registered = rest.postForEntity("/auth/register",
                Map.of("email", email, "password", password, "displayName", "Test Person"), String.class);
        assertThat(registered.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);

        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        verify(mailer).sendCode(eq(email), code.capture(), anyLong());

        ResponseEntity<Map<String, Object>> verified = rest.exchange("/auth/verify-email", HttpMethod.POST,
                new HttpEntity<>(Map.of("email", email, "code", code.getValue())), JSON);
        assertThat(verified.getStatusCode()).isEqualTo(HttpStatus.OK);
        return asSession(verified.getBody());
    }

    private ResponseEntity<Map<String, Object>> login(String email, String password) {
        return rest.exchange("/auth/login", HttpMethod.POST,
                new HttpEntity<>(Map.of("email", email, "password", password)), JSON);
    }

    private ResponseEntity<Map<String, Object>> refreshWith(String refreshToken) {
        return rest.exchange("/auth/refresh", HttpMethod.POST,
                new HttpEntity<>(Map.of("refreshToken", refreshToken)), JSON);
    }

    private ResponseEntity<Map<String, Object>> changePassword(String accessToken, String current, String next) {
        return rest.exchange("/auth/change-password", HttpMethod.POST,
                new HttpEntity<>(Map.of("currentPassword", current, "newPassword", next), bearer(accessToken)), JSON);
    }

    private Item seedItem(UUID ownerId, String title) {
        Item item = new Item();
        item.setTitle(title);
        item.setUserId(ownerId);
        item.setCategory(ItemCategory.HOME_GOODS);
        item.setDescription("Seeded for the test");
        item.setLocation(new LocationData(0.31, 32.58, "Some street", "Kampala", 10.0));
        Item saved = items.save(item);

        ItemImage image = new ItemImage();
        image.setItem(saved);
        image.setUrl("http://localhost:1/photo.jpg");
        image.setPublicId("wasteless/" + UUID.randomUUID());
        itemImages.save(image);
        return saved;
    }

    private void seedRequest(UUID requesterId, Item item) {
        ItemRequest request = new ItemRequest();
        request.setUserId(requesterId);
        request.setItem(item);
        request.setNotes("Seeded for the test");
        itemRequests.save(request);
    }

    private static HttpHeaders bearer(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        return headers;
    }

    private static Session asSession(Map<String, Object> body) {
        assertThat(body).isNotNull();
        return new Session((String) body.get("accessToken"), (String) body.get("refreshToken"));
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value) {
        return (Map<String, Object>) value;
    }

    private static String sha256(String value) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            return java.util.HexFormat.of().formatHex(digest.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
