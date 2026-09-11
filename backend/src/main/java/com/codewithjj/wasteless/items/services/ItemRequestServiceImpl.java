package com.codewithjj.wasteless.items.services;

import com.codewithjj.wasteless.exceptions.ApiException;
import com.codewithjj.wasteless.exceptions.ConflictException;
import com.codewithjj.wasteless.exceptions.NotValidUUIDException;
import com.codewithjj.wasteless.exceptions.ResourceNotFoundException;
import com.codewithjj.wasteless.items.dtos.RequestCreationDTO;
import com.codewithjj.wasteless.items.entities.Item;
import com.codewithjj.wasteless.items.entities.ItemRequest;
import com.codewithjj.wasteless.items.enums.RequestStatus;
import com.codewithjj.wasteless.items.repositories.ItemRepository;
import com.codewithjj.wasteless.items.repositories.ItemRequestRepo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ItemRequestServiceImpl implements ItemRequestService {
    ItemRequestRepo itemRequestRepo;
    ItemRepository itemRepository;
    public ItemRequestServiceImpl(ItemRequestRepo itemRequestRepo, ItemRepository itemRepository) {
        this.itemRequestRepo = itemRequestRepo;
        this.itemRepository = itemRepository;
    }

    @Override
    public ItemRequest createRequest(RequestCreationDTO dto, UUID requesterId) {
        Item item = itemRepository.findById(dto.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("The Item selected no longer exists"));
        if (requesterId.equals(item.getUserId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "OWN_ITEM", "You can't request your own item");
        }

        ItemRequest existingRequest = itemRequestRepo.findByUserIdAndItemId(requesterId, dto.getItemId());
        if (existingRequest != null) {
            throw new ConflictException("You have already made a request for this item");
        }

        ItemRequest itemRequest = new ItemRequest();
        itemRequest.setUserId(requesterId);
        itemRequest.setItem(item);
        itemRequest.setNotes(dto.getNotes());
        item.setLocation(dto.getLocation());

        return itemRequestRepo.save(itemRequest);
    }

    // Visible to whoever made the request and to the item's owner
    @Override
    @Transactional(readOnly = true)
    public ItemRequest getRequestById(String id, UUID userId) {
        ItemRequest itemRequest = findRequest(id);
        if (!userId.equals(itemRequest.getUserId()) && !userId.equals(itemRequest.getItem().getUserId())) {
            throw notAllowed();
        }
        return itemRequest;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemRequest> getAllRequestsByUserId(UUID userId) {
        return this.itemRequestRepo.findByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemRequest> getIncomingRequestsByUserId(UUID userId) {
        return itemRequestRepo.getIncomingRequestsByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemRequest> getOutgoingRequestsByUserId(UUID userId) {
        return itemRequestRepo.getOutgoingRequestsByUserId(userId);
    }

    // The requester can cancel their request; the item's owner can remove it
    @Override
    public String deleteRequestById(String id, UUID userId) {
        ItemRequest itemRequest = findRequest(id);
        if (!userId.equals(itemRequest.getUserId()) && !userId.equals(itemRequest.getItem().getUserId())) {
            throw notAllowed();
        }
        this.itemRequestRepo.delete(itemRequest);
        return "Request been cancelled successfully";
    }

    @Override
    public ItemRequest acceptRequest(String id, UUID ownerId) {
        ItemRequest itemRequest = findOwnedRequest(id, ownerId);
        itemRequest.setStatus(RequestStatus.APPROVED);
        //reject all other requests
        List<ItemRequest> requests = this.itemRequestRepo.findByItemId(itemRequest.getItem().getId());
        for (ItemRequest request : requests) {
            if (request.getId().equals(itemRequest.getId())) continue;
            request.setStatus(RequestStatus.REJECTED);
            this.itemRequestRepo.save(request);
        }
        return this.itemRequestRepo.save(itemRequest);
    }

    @Override
    public ItemRequest rejectRequest(String id, UUID ownerId) {
        ItemRequest itemRequest = findOwnedRequest(id, ownerId);
        itemRequest.setStatus(RequestStatus.REJECTED);
        return this.itemRequestRepo.save(itemRequest);
    }

    // Only the owner of the requested item may accept or reject
    private ItemRequest findOwnedRequest(String id, UUID ownerId) {
        ItemRequest itemRequest = findRequest(id);
        if (!ownerId.equals(itemRequest.getItem().getUserId())) {
            throw notAllowed();
        }
        return itemRequest;
    }

    private ItemRequest findRequest(String id) {
        UUID requestId;
        try {
            requestId = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new NotValidUUIDException("Invalid UUID format: " + id);
        }
        return this.itemRequestRepo.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found with id: " + id));
    }

    private static ApiException notAllowed() {
        return new ApiException(HttpStatus.FORBIDDEN, "NOT_ALLOWED", "You don't have access to this request");
    }
}
