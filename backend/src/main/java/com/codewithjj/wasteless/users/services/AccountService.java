package com.codewithjj.wasteless.users.services;

import com.codewithjj.wasteless.auth.dtos.AuthDtos.UserResponse;
import com.codewithjj.wasteless.auth.repositories.EmailVerificationCodeRepository;
import com.codewithjj.wasteless.auth.services.TokenService;
import com.codewithjj.wasteless.exceptions.ApiException;
import com.codewithjj.wasteless.items.entities.Item;
import com.codewithjj.wasteless.items.entities.ItemImage;
import com.codewithjj.wasteless.items.entities.ItemRequest;
import com.codewithjj.wasteless.items.repositories.ItemImageRepository;
import com.codewithjj.wasteless.items.repositories.ItemRepository;
import com.codewithjj.wasteless.items.repositories.ItemRequestRepo;
import com.codewithjj.wasteless.items.services.ImageStorageService;
import com.codewithjj.wasteless.users.dtos.AccountExport;
import com.codewithjj.wasteless.users.entities.User;
import com.codewithjj.wasteless.users.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

// Backs the "Export data" and "Delete account" settings, which Google Play requires apps to offer
@Service
public class AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountService.class);

    private final UserRepository users;
    private final ItemRepository items;
    private final ItemImageRepository itemImages;
    private final ItemRequestRepo itemRequests;
    private final ImageStorageService imageStorage;
    private final EmailVerificationCodeRepository codes;
    private final TokenService tokens;

    public AccountService(UserRepository users, ItemRepository items, ItemImageRepository itemImages,
                          ItemRequestRepo itemRequests, ImageStorageService imageStorage,
                          EmailVerificationCodeRepository codes, TokenService tokens) {
        this.users = users;
        this.items = items;
        this.itemImages = itemImages;
        this.itemRequests = itemRequests;
        this.imageStorage = imageStorage;
        this.codes = codes;
        this.tokens = tokens;
    }

    @Transactional(readOnly = true)
    public AccountExport export(UUID userId) {
        User user = users.findById(userId).orElseThrow(AccountService::notSignedIn);
        List<Item> posted = items.findByUserId(userId);
        // Loaded here rather than during serialisation, so the export doesn't depend on open-in-view
        posted.forEach(item -> item.getImages().size());
        List<ItemRequest> requested = itemRequests.findByUserId(userId);
        return new AccountExport(Instant.now(), UserResponse.from(user), posted, requested);
    }

    // Takes the account and everything attached to it: posted items and their photos,
    // requests made on those items, the user's own requests, and every session
    @Transactional
    public void delete(UUID userId) {
        User user = users.findById(userId).orElseThrow(AccountService::notSignedIn);

        itemRequests.deleteAll(itemRequests.findByUserId(userId));
        for (Item item : items.findByUserId(userId)) {
            itemRequests.deleteAll(itemRequests.findByItemId(item.getId()));
            for (ItemImage image : itemImages.findByItemId(item.getId())) {
                deleteStoredImage(image.getPublicId());
                itemImages.delete(image);
            }
            items.delete(item);
        }

        codes.deleteAllForUser(userId);
        tokens.deleteAllSessions(userId);
        users.delete(user);
        log.info("Deleted account {}", userId);
    }

    // A file the bucket has already lost shouldn't keep someone from deleting their account
    private void deleteStoredImage(String publicId) {
        try {
            imageStorage.deleteImage(publicId);
        } catch (RuntimeException e) {
            log.warn("Could not delete stored image {}: {}", publicId, e.getMessage());
        }
    }

    private static ApiException notSignedIn() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Sign in to continue.");
    }
}
