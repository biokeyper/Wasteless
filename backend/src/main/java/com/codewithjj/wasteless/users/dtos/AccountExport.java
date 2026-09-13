package com.codewithjj.wasteless.users.dtos;

import com.codewithjj.wasteless.auth.dtos.AuthDtos.UserResponse;
import com.codewithjj.wasteless.items.entities.Item;
import com.codewithjj.wasteless.items.entities.ItemRequest;

import java.time.Instant;
import java.util.List;

// Everything the account holds, handed back as one JSON document the user can keep
public record AccountExport(
        Instant exportedAt,
        UserResponse account,
        List<Item> items,
        List<ItemRequest> requests) {}
