package com.codewithjj.wasteless.items.controllers;

import com.codewithjj.wasteless.auth.CurrentUser;
import com.codewithjj.wasteless.exceptions.ApiException;
import com.codewithjj.wasteless.items.dtos.RequestCreationDTO;
import com.codewithjj.wasteless.items.entities.ItemRequest;
import com.codewithjj.wasteless.items.services.ItemRequestServiceImpl;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("requests")
@Tag(name = "Requests", description = "Requests for items")
public class RequestController {
    ItemRequestServiceImpl itemRequestService;

    @Autowired
    public RequestController(ItemRequestServiceImpl itemRequestService) {
        this.itemRequestService = itemRequestService;
    }

    @PostMapping
    public  ResponseEntity<ItemRequest> createRequest(@RequestBody RequestCreationDTO dto, @AuthenticationPrincipal Jwt jwt) {
         ItemRequest createdItemRequest = itemRequestService.createRequest(dto, CurrentUser.id(jwt));
        return new ResponseEntity<>(createdItemRequest, HttpStatus.CREATED);
    }
    @GetMapping("{id}")
    public  ResponseEntity<ItemRequest> getRequestById(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        ItemRequest createdItemRequest = itemRequestService.getRequestById(id, CurrentUser.id(jwt));
        return new ResponseEntity<>(createdItemRequest, HttpStatus.CREATED);
    }
    @GetMapping("{userId}/list")
    public  ResponseEntity<List<ItemRequest>> getAllRequestsByUserId(@PathVariable String userId, @AuthenticationPrincipal Jwt jwt) {
        List<ItemRequest> createdItemRequest = itemRequestService.getAllRequestsByUserId(self(userId, jwt));
        return new ResponseEntity<>(createdItemRequest, HttpStatus.CREATED);
    }
    @GetMapping("incoming/{userId}")
    public  ResponseEntity<List<ItemRequest>> getIncomingRequestsByUserId(@PathVariable String userId, @AuthenticationPrincipal Jwt jwt) {
        List<ItemRequest> createdItemRequest = itemRequestService.getIncomingRequestsByUserId(self(userId, jwt));
        return new ResponseEntity<>(createdItemRequest, HttpStatus.CREATED);
    }
    @GetMapping("outgoing/{userId}")
    public  ResponseEntity<List<ItemRequest>> getOutgoingRequestsByUserId(@PathVariable String userId, @AuthenticationPrincipal Jwt jwt) {
        List<ItemRequest> createdItemRequest = itemRequestService.getOutgoingRequestsByUserId(self(userId, jwt));
        return new ResponseEntity<>(createdItemRequest, HttpStatus.CREATED);
    }
    @PatchMapping("{id}/reject")
    public  ResponseEntity<ItemRequest> rejectRequest(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        ItemRequest createdItemRequest = itemRequestService.rejectRequest(id, CurrentUser.id(jwt));
        return new ResponseEntity<>(createdItemRequest, HttpStatus.CREATED);
    }

    @PatchMapping("{id}/accept")
    public  ResponseEntity<ItemRequest> acceptRequest(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        ItemRequest createdItemRequest = itemRequestService.acceptRequest(id, CurrentUser.id(jwt));
        return new ResponseEntity<>(createdItemRequest, HttpStatus.CREATED);
    }

@DeleteMapping("{id}")
    public  String deleteRequest(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        return itemRequestService.deleteRequestById(id, CurrentUser.id(jwt));
    }

    // The apps still put their own ID in these paths; it must match the signed-in user
    private static UUID self(String userId, Jwt jwt) {
        UUID current = CurrentUser.id(jwt);
        if (!current.toString().equalsIgnoreCase(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_ALLOWED", "You can only view your own requests");
        }
        return current;
    }
}
