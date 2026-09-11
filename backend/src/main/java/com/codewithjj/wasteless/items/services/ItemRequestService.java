package com.codewithjj.wasteless.items.services;

import com.codewithjj.wasteless.items.dtos.RequestCreationDTO;
import com.codewithjj.wasteless.items.entities.ItemRequest;

import java.util.List;
import java.util.UUID;

public interface ItemRequestService {
    ItemRequest createRequest(RequestCreationDTO requestCreationDTO, UUID requesterId);
    ItemRequest getRequestById(String id, UUID userId);
    List<ItemRequest> getAllRequestsByUserId(UUID userId);
    List<ItemRequest> getIncomingRequestsByUserId(UUID userId);
    List<ItemRequest> getOutgoingRequestsByUserId(UUID userId);
    String deleteRequestById(String id, UUID userId);
    ItemRequest acceptRequest(String id, UUID ownerId);
    ItemRequest rejectRequest(String id, UUID ownerId);
}
